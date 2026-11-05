import {expect,it,vi} from 'vitest';
import {provisionSetupOrganization} from '../src/organization/setup-provisioning.js';

it('sets transaction-local new tenant context before owner membership writes without disabling RLS',async()=>{
  let context='previous-tenant';
  const query=vi.fn(async(sql:string,args:unknown[])=>{
    if(sql.includes('SELECT id FROM users'))return {rows:[{id:'owner'}]};
    if(sql.includes('INSERT INTO organizations'))return {rows:[{id:'new-tenant',slug:'test',status:'setup'}]};
    if(sql.includes('set_config')){expect(args).toEqual(['app.organization_id','new-tenant']);expect(sql).toContain('true');context=String(args[1]);return {rows:[]};}
    if(sql.includes('INSERT INTO memberships')){expect(context).toBe('new-tenant');return {rows:[{id:'membership'}]};}
    if(sql.includes('INSERT INTO membership_roles'))return {rows:[],rowCount:2};
    return {rows:[]};
  });
  await provisionSetupOrganization({query} as never,{name:'Test',slug:'test',ownerUserId:'owner',actorUserId:'admin'});
  expect(query.mock.calls.map(call=>call[0]).join('\n')).not.toMatch(/DISABLE|BYPASSRLS|SET ROLE/i);
});
