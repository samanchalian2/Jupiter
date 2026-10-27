"""Read-only Preview snapshot. Never connects to another application's database."""
from pathlib import Path
import json, re, sys
import paramiko

root = Path(__file__).resolve().parent.parent
records = []
current = {}
for line in (root / 'securedata/secureinfo.md').read_text(encoding='utf-8-sig').splitlines():
    if not line.strip():
        if current.get('host'):
            records.append(current)
        current = {}
        continue
    match = re.match(r'\s*(Host|Username|Password|Purpose)\s*:\s*(.*?)\s*$', line, re.I)
    if not match:
        continue
    key, value = match.group(1).lower(), match.group(2).strip('`')
    if key == 'host':
        if current.get('host'):
            records.append(current)
        current = {}
    current[key] = value
if current.get('host'):
    records.append(current)
# App credential entries occur after the SSH entries; take the explicit root host.
record = next(item for item in records if item.get('host') == '172.20.190.16' and item.get('username') == 'root')
remote = r'''
import subprocess,json,hashlib,pathlib,re
def query(sql):
    return subprocess.check_output(['runuser','-u','postgres','--','psql','-X','-v','ON_ERROR_STOP=1','-d','jupiter','-Atc',sql],text=True).strip()
tenant_ids="SELECT id FROM organizations WHERE slug IN ('azla','azlaa-fanavari-saba')"
def fingerprint(table,predicate):
    sql="SELECT count(*)::int,encode(digest(COALESCE(string_agg(row::text,E'\\n' ORDER BY row::text),''),'sha256'),'hex') FROM (SELECT to_jsonb(t)-ARRAY['legal_name','must_change_password','credential_version'] AS row FROM "+table+" t WHERE "+predicate+") rows"
    count,digest=query(sql).split('|')
    return {'count':int(count),'sha256':digest}
primary={}
primary['organizations']=fingerprint('organizations','id IN ('+tenant_ids+')')
primary['memberships']=fingerprint('memberships','organization_id IN ('+tenant_ids+')')
primary['membership_roles']=fingerprint('membership_roles','membership_id IN (SELECT id FROM memberships WHERE organization_id IN ('+tenant_ids+'))')
primary['users']=fingerprint('users','id IN (SELECT user_id FROM memberships WHERE organization_id IN ('+tenant_ids+'))')
tables=query("SELECT table_name FROM information_schema.columns WHERE table_schema='public' AND column_name='organization_id' AND table_name IN ('departments','locations','disciplines','categories','subcategories','teams','team_members','tickets','ticket_messages','ticket_notes','ticket_activities','ticket_sla_clocks','business_calendars','sla_policies','assignment_rules','organization_setup_progress') ORDER BY table_name").splitlines()
for table in tables:primary[table]=fingerprint(table,'organization_id IN ('+tenant_ids+')')
services={}
for name in ['jupiter-ip-preview-api','jupiter-ip-preview-worker','arandi-platform']:
    result=subprocess.check_output(['systemctl','show',name,'-p','ActiveState','-p','ExecMainStartTimestamp','-p','NRestarts'],text=True)
    services[name]=dict(line.split('=',1) for line in result.strip().splitlines())
environment=pathlib.Path('/opt/jupiter/secrets/ip-preview.env').read_text()
delivery=re.search(r'^PUBLIC_ACCOUNT_VERIFICATION_DELIVERY=(.*)$',environment,re.M)
result={'release':str(pathlib.Path('/opt/jupiter/ip-preview').resolve()),'migrations':int(query('SELECT count(*) FROM schema_migrations')),'emailDeliveryMode':delivery.group(1).strip() if delivery else 'UNSET','services':services,'originalSaba':primary,'originalTicketNumbers':query('SELECT string_agg(ticket_number::text,\',\' ORDER BY ticket_number) FROM tickets WHERE ticket_number IN (5140,5141)'),'activeAiReservations':int(query("SELECT count(*) FROM commercial_smart_actions WHERE status='RESERVED'")),'databases':query("SELECT string_agg(datname,',' ORDER BY datname) FROM pg_database WHERE NOT datistemplate"),'freeBytes':__import__('shutil').disk_usage('/opt/jupiter').free}
print(json.dumps(result))
'''
client = paramiko.SSHClient()
client.load_system_host_keys()
client.load_host_keys(str(root / 'securedata/deploy-known-hosts'))
client.set_missing_host_key_policy(paramiko.RejectPolicy())
try:
    client.connect('172.20.190.16', username='root', password=record['password'], timeout=15, look_for_keys=False, allow_agent=False)
    stdin, stdout, stderr = client.exec_command('python3 -', timeout=45)
    stdin.write(remote); stdin.flush(); stdin.channel.shutdown_write()
    output = stdout.read().decode('utf-8')
    error = stderr.read().decode('utf-8')
    if stdout.channel.recv_exit_status():
        raise RuntimeError('Read-only Preview snapshot failed: ' + error)
    result = json.loads(output)
    if len(sys.argv) > 1:
        destination = (root / sys.argv[1]).resolve()
        if not destination.is_relative_to(root / '.local/goal070'):
            raise RuntimeError('Snapshot output must stay inside ignored .local/goal070')
        destination.parent.mkdir(parents=True, exist_ok=True)
        with destination.open('x', encoding='utf-8') as stream:
            json.dump(result, stream, ensure_ascii=False, indent=2)
    print(json.dumps(result, ensure_ascii=False))
finally:
    client.close()
