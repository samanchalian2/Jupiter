"""Delete ONLY manifest-bound GOAL-070 Preview fixtures with normal FK/triggers.

Refuses any additional membership/user scope. Runtime Help and permanent Audit stay.
No shared role, trigger, RLS, sequence or other database is changed.
"""
from pathlib import Path
import json, re, sys, uuid
import paramiko

root=Path(__file__).resolve().parent.parent
path=root/'.local/goal070/fixture.json'
state=json.loads(path.read_text(encoding='utf-8'))
assert state['slug']=='saba-acceptance-070-1027' and len(state['extraOrganizations'])==1 and len(state['users'])==3
orgs=[str(uuid.UUID(value)) for value in [state['organizationId'],*state['extraOrganizations']]]
users=[str(uuid.UUID(user['id'])) for user in state['users']]
assert len(set(orgs))==2 and len(set(users))==3
ids=lambda values:','.join("'"+value+"'" for value in values)
app=str(uuid.UUID(state['applicationId']));admin=str(uuid.UUID(state['adminId']))
sql=f"""
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $$ BEGIN
 IF (SELECT count(*) FROM organizations WHERE id IN ({ids(orgs)}) AND slug IN ('saba-acceptance-070-1027','saba-acceptance-070-1027-atomic'))<>2 THEN RAISE EXCEPTION 'Fixture organization mismatch'; END IF;
 IF (SELECT count(*) FROM users WHERE id IN ({ids(users)}) AND username IN ('sahra.goal070.1027','melika.goal070.1027','jalal.goal070.1027') AND email LIKE '%.goal070.1027@example.test')<>3 THEN RAISE EXCEPTION 'Fixture user mismatch'; END IF;
 IF EXISTS(SELECT 1 FROM memberships WHERE user_id IN ({ids(users)}) AND organization_id NOT IN ({ids(orgs)})) THEN RAISE EXCEPTION 'Unexpected external membership'; END IF;
 IF (SELECT count(*) FROM organization_applications WHERE id='{app}' AND preferred_slug='saba-acceptance-070-1027' AND provisioned_organization_id='{orgs[0]}')<>1 THEN RAISE EXCEPTION 'Fixture application mismatch'; END IF;
 IF EXISTS(SELECT 1 FROM commercial_smart_actions WHERE organization_id IN ({ids(orgs)})) OR EXISTS(SELECT 1 FROM assist_cases WHERE organization_id IN ({ids(orgs)})) THEN RAISE EXCEPTION 'Unexpected commercial usage; manual review required'; END IF;
END $$;
DELETE FROM organization_applications WHERE id='{app}';
DELETE FROM tickets WHERE organization_id IN ({ids(orgs)});
DELETE FROM memberships WHERE organization_id IN ({ids(orgs)});
DELETE FROM organizations WHERE id IN ({ids(orgs)});
DELETE FROM users WHERE id IN ({ids(users)});
INSERT INTO audit_logs(actor_user_id,action,target_type,metadata) VALUES('{admin}','test.goal070_fixture_cleaned','acceptance_test','{{"goal":"GOAL-070","temporaryOrganizations":2,"temporaryUsers":3,"normalForeignKeys":true}}');
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM organizations WHERE id IN ({ids(orgs)})) OR EXISTS(SELECT 1 FROM users WHERE id IN ({ids(users)})) OR EXISTS(SELECT 1 FROM memberships WHERE organization_id IN ({ids(orgs)})) THEN RAISE EXCEPTION 'Cleanup incomplete'; END IF;
END $$;
COMMIT;
"""
text=(root/'securedata/secureinfo.md').read_text(encoding='utf-8-sig')
record=re.search(r'Host:\s*172\.20\.190\.16\s*\nUsername:\s*root\s*\nPassword:\s*([^\r\n]+)',text)
assert record
client=paramiko.SSHClient();client.load_system_host_keys();client.load_host_keys(str(root/'securedata/deploy-known-hosts'));client.set_missing_host_key_policy(paramiko.RejectPolicy())
try:
    client.connect('172.20.190.16',username='root',password=record.group(1).strip().strip('`'),look_for_keys=False,allow_agent=False,timeout=15)
    if sys.argv[1]!='--execute':raise RuntimeError('Explicit --execute required after browser acceptance')
    stdin,stdout,stderr=client.exec_command('runuser -u postgres -- psql -X -v ON_ERROR_STOP=1 -d jupiter',timeout=45)
    stdin.write(sql);stdin.flush();stdin.channel.shutdown_write()
    output=stdout.read();error=stderr.read().decode()
    if stdout.channel.recv_exit_status():raise RuntimeError('Scoped fixture cleanup rolled back: '+error)
    receipt={key:value for key,value in state.items() if key!='users'}
    receipt.update(cleanup='PASS',removedUsers=3,removedOrganizations=2,helpPreserved=True,normalForeignKeys=True)
    (root/'.local/goal070/cleanup-receipt.json').write_text(json.dumps(receipt,indent=2),encoding='utf-8')
    path.unlink()
    print(json.dumps({'cleanup':'PASS','organizationsRemoved':2,'usersRemoved':3,'credentialFileRemoved':True,'auditPreserved':True}))
finally:client.close()
