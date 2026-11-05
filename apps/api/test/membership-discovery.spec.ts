import {expect,it,vi} from 'vitest';
import {readSessionMemberships} from '../src/auth/membership-discovery.js';

it('discovers only the authenticated user memberships with RLS context per tenant, restoring prior scope',async()=>{
  let context='caller';const scopes:string[]=[];
  const client={query:vi.fn(async(sql:string,args:unknown[]=[])=>{
    if(sql.includes('current_setting'))return {rows:[{value:context}]};
    if(sql.includes('SELECT id FROM organizations')){expect(sql).toContain("status<>'archived'");return {rows:[{id:'personal'},{id:'foreign'},{id:'own'}]};}
    if(sql.includes('set_config')){expect(sql).toContain('true');context=String(args[1]);scopes.push(context);return {rows:[]};}
    expect(sql).toContain('m.organization_id=$1 AND m.user_id=$2');
    expect(sql).toContain("m.status='active'");expect(args).toEqual([context,'authenticated']);
    return {rows:context==='foreign'?[]:[{organization_id:context,organization_name:context,workspace_type:context==='personal'?'PERSONAL':'ORGANIZATION',role_codes:['ORG_OWNER']}]};
  })};
  const database={transaction:vi.fn(async work=>work(client))};
  const result=await readSessionMemberships(database as never,'authenticated');
  expect(result.map(r=>r.organization_id)).toEqual(['personal','own']);
  expect(scopes).toEqual(['personal','foreign','own','caller']);
  expect(context).toBe('caller');
  expect(client.query.mock.calls.map(c=>c[0]).join('\n')).not.toMatch(/DISABLE|BYPASSRLS|SET ROLE/i);
});

it('reuses the caller transaction instead of nesting transactions',async()=>{
  const client={query:vi.fn(async(sql:string)=>({rows:sql.includes('current_setting')?[{value:null}]:[]}))};
  const database={transaction:vi.fn()};
  expect(await readSessionMemberships(database as never,'user',client as never)).toEqual([]);
  expect(database.transaction).not.toHaveBeenCalled();
  expect(client.query).toHaveBeenLastCalledWith('SELECT set_config($1,$2,true)',['app.organization_id','']);
});
