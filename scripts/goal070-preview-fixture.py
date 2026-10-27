"""Supported Preview API fixture. Credentials read from ignored store/stdin, never logged.

No SQL provisioning or verification bypass. Run only for the GOAL-070 named fixture.
"""
from pathlib import Path
import json, re, secrets, sys, urllib.request, urllib.error, uuid

ROOT = Path(__file__).resolve().parent.parent
BASE = 'http://172.20.190.16:8088/api/v1'
STATE = ROOT / '.local/goal070/fixture.json'
SLUG = 'saba-acceptance-070-1027'

def call(path, session=None, body=None, org=None, key=None, expected=None):
    headers = {'content-type':'application/json'}
    if session: headers['authorization'] = 'Bearer '+session['accessToken']
    if org: headers['x-organization-id'] = org
    if key: headers['idempotency-key'] = key
    request = urllib.request.Request(BASE+path, data=None if body is None else json.dumps(body).encode(), headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            result=json.load(response)
            if expected: assert response.status==expected
            return result
    except urllib.error.HTTPError as error:
        # Do not emit response/body/challenge/credential.
        raise RuntimeError(f'Preview API {path} returned {error.code}') from None

def admin_login():
    text=(ROOT/'securedata/secureinfo.md').read_text(encoding='utf-8-sig')
    match=re.search(r'Username:\s*admin@jupiter\.local\s*\nPassword:\s*([^\r\n]+)',text)
    if not match: raise RuntimeError('Preview administrator credential not found')
    return call('/auth/login',body={'identifier':'admin@jupiter.local','password':match.group(1).strip().strip('`')})

def save(state):
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps(state,ensure_ascii=False,indent=2),encoding='utf-8')

def main():
    mode=sys.argv[1]
    admin=admin_login()
    if mode=='approve':
        applications=call('/platform/organization-applications',admin)
        found=[item for item in applications if item['preferredSlug']==SLUG]
        assert len(found)==1
        app=found[0]
        state={'slug':SLUG,'applicationId':app['id'],'users':[],'extraOrganizations':[]}
        save(state)
        if app['status']=='SUBMITTED': call('/platform/organization-applications/'+app['id']+'/start-review',admin,{},key=str(uuid.uuid4()))
        call('/platform/organization-applications/'+app['id']+'/approve',admin,{'slug':SLUG,'note':'GOAL-070 separate acceptance fixture'},key=str(uuid.uuid4()))
        org=next(item for item in call('/admin/platform/organizations',admin) if item['slug']==SLUG)
        assert org['status']=='setup' and org['has_active_owner']
        state.update(organizationId=org['id'],adminId=admin['user']['id'])
        save(state)
        print(json.dumps({'approved':True,'status':org['status'],'slug':SLUG}))
    elif mode=='configure':
        state=json.loads(STATE.read_text(encoding='utf-8'))
        owner_input=json.load(sys.stdin)
        owner=call('/auth/login',body=owner_input)
        org=state['organizationId']
        assert any(m['organization_id']==org and 'ORG_OWNER' in m['role_codes'] for m in owner['user']['memberships'])
        state['ownerId']=owner['user']['id'];save(state)
        second=call('/admin/platform/organizations/setup',admin,{'name':'پذیرش اتمیک GOAL-070','slug':SLUG+'-atomic','initialOwnerUserId':state['ownerId']},key='goal070-atomic-1027')
        state['extraOrganizations']=[second['id']];save(state)
        call('/admin/setup-wizard/profile',owner,{'name':'شرکت اضلاع فناوری صبا — پذیرش GOAL-070','businessTimezone':'Asia/Tehran'},org)
        for name,label,role in [('sahra','صحرا — پذیرش ۰۷۰','SUPERVISOR'),('melika','ملیکا — پذیرش ۰۷۰','REQUESTER'),('jalal','جلال — پذیرش ۰۷۰','REQUESTER')]:
            username=name+'.goal070.1027'
            temporary='Jp!'+secrets.token_urlsafe(20)
            call('/admin/members',owner,{'email':username+'@example.test','username':username,'displayName':label,'password':temporary,'roles':[role]},org)
            challenge=call('/auth/login',body={'identifier':username,'password':temporary})
            assert challenge['passwordChangeRequired'] and 'accessToken' not in challenge
            final='Jp!'+secrets.token_urlsafe(20)
            session=call('/auth/password/first-login',body={'passwordChangeToken':challenge['passwordChangeToken'],'nextPassword':final})
            state['users'].append({'name':name,'id':session['user']['id'],'username':username,'password':final,'temporary':temporary})
            save(state)
        catalog=call('/admin/catalog-template/install',owner,{},org)
        supervisor=next(u['id'] for u in state['users'] if u['name']=='sahra')
        call('/admin/teams',owner,{'name':'فناوری اطلاعات — پذیرش ۰۷۰','memberIds':[supervisor]},org)
        call('/sla/rules',owner,{'assigneeUserId':supervisor,'isActive':True},org)
        call('/sla/calendar',owner,{'timezone':'Asia/Tehran','workdays':[1,2,3,6,7],'startMinute':480,'endMinute':1020},org)
        snapshot=call('/admin/setup-wizard',owner,org=org)
        for step in ['DIRECTORY','AI','ASSIST','APPEARANCE']:
            snapshot=call('/admin/setup-wizard/steps/'+step+'/skip',owner,{'version':snapshot['progress']['version']},org)
        print(json.dumps({'configured':True,'temporaryUsers':len(state['users']),'atomicSetup':second['status'],'catalogInstalled':bool(catalog)}))
    elif mode=='tickets':
        state=json.loads(STATE.read_text(encoding='utf-8'));org=state['organizationId']
        sessions={u['name']:call('/auth/login',body={'identifier':u['username'],'password':u['password']}) for u in state['users']}
        melika=call('/tickets',sessions['melika'],org=org)
        assert len(melika)==1 and 'GOAL-070' in melika[0]['title']
        network=melika[0]
        categories=call('/tickets/catalog/categories',sessions['jalal'],org=org)
        category=next(c for c in categories if c['name']=='نرم‌افزار و سامانه‌ها')
        software=call('/tickets/drafts',sessions['jalal'],{'title':'نصب نرم‌افزار — پذیرش GOAL-070','description':'پذیرش موقت: درخواست نصب نرم‌افزار مورد نیاز واحد.','priority':'NORMAL','categoryId':category['id']},org)
        state['ticketIds']=[network['id'],software['id']];save(state)
        call('/tickets/'+software['id']+'/submit',sessions['jalal'],{},org)
        for ticket in [network,software]:call('/tickets/'+ticket['id']+'/status',sessions['sahra'],{'status':'IN_PROGRESS'},org)
        call('/tickets/'+network['id']+'/messages',sessions['sahra'],{'body':'اتصال وای‌فای بررسی و برطرف شد — پاسخ عمومی پذیرش ۰۷۰.'},org)
        call('/tickets/'+network['id']+'/status',sessions['sahra'],{'status':'RESOLVED'},org)
        call('/tickets/'+software['id']+'/notes',sessions['sahra'],{'body':'GOAL070_STAFF_ONLY_NOTE — هماهنگی داخلی نصب نرم‌افزار.'},org)
        state['ticketNumbers']=[network['ticket_number'],software['ticket_number']];save(state)
        # Actual API tenant/requester checks; no bypass or direct DB fixture writes.
        for path,session,target in [('/tickets/'+software['id'],sessions['melika'],org),('/tickets/'+network['id'],sessions['jalal'],org),('/admin/members',sessions['melika'],org),('/tickets',sessions['melika'],state['extraOrganizations'][0])]:
            try:call(path,session,org=target)
            except RuntimeError as error:assert str(error).endswith(('401','403','404'))
            else:raise RuntimeError('Unauthorized fixture access was not denied')
        public=call('/tickets/'+software['id']+'/timeline',sessions['jalal'],org=org)
        assert 'GOAL070_STAFF_ONLY_NOTE' not in json.dumps(public)
        print(json.dumps({'workflow':'PASS','ticketNumbers':state['ticketNumbers'],'network':'RESOLVED','software':'IN_PROGRESS','negativeAuthorizationChecks':4,'internalNoteHidden':True}))
    elif mode=='check-tickets':
        state=json.loads(STATE.read_text(encoding='utf-8'));org=state['organizationId']
        sessions={u['name']:call('/auth/login',body={'identifier':u['username'],'password':u['password']}) for u in state['users']}
        network,software=state['ticketIds']
        for path,session,target in [('/tickets/'+software,sessions['melika'],org),('/tickets/'+network,sessions['jalal'],org),('/admin/members',sessions['melika'],org),('/tickets',sessions['melika'],state['extraOrganizations'][0])]:
            try:call(path,session,org=target)
            except RuntimeError as error:assert str(error).endswith(('401','403','404'))
            else:raise RuntimeError('Unauthorized fixture access was not denied')
        public=call('/tickets/'+software+'/timeline',sessions['jalal'],org=org)
        assert 'GOAL070_STAFF_ONLY_NOTE' not in json.dumps(public)
        staff=call('/tickets/'+software+'/timeline',sessions['sahra'],org=org)
        assert 'GOAL070_STAFF_ONLY_NOTE' in json.dumps(staff)
        assert call('/tickets/'+network,sessions['melika'],org=org)['status']=='RESOLVED'
        assert call('/tickets/'+software,sessions['jalal'],org=org)['status']=='IN_PROGRESS'
        print(json.dumps({'workflow':'PASS','ticketNumbers':state['ticketNumbers'],'negativeAuthorizationChecks':4,'internalNoteHidden':True,'staffNoteVisible':True}))
    elif mode in ['challenge','complete-challenge']:
        state=json.loads(STATE.read_text(encoding='utf-8'))
        user=next(u for u in state['users'] if u['name']=='melika')
        if mode=='challenge':
            temporary='Jp!'+secrets.token_urlsafe(20)
            call('/admin/platform/users/'+user['id'],admin,{'password':temporary})
            user['temporary']=temporary
        else:
            challenge=call('/auth/login',body={'identifier':user['username'],'password':user['temporary']})
            assert challenge['passwordChangeRequired']
            call('/auth/password/first-login',body={'passwordChangeToken':challenge['passwordChangeToken'],'nextPassword':user['password']})
        save(state)
        print(json.dumps({'fixtureOnly':True,'phase':mode}))
    elif mode=='info':
        state=json.loads(STATE.read_text(encoding='utf-8'))
        print(json.dumps({key:value for key,value in state.items() if key!='users'}))
    else: raise RuntimeError('Unknown mode')

if __name__=='__main__': main()
