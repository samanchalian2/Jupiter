import {expect,it,vi} from 'vitest';
import {OrganizationApplicationService} from '../src/organization-applications/organization-application.service.js';

it('approves with an omitted slug using the application identity, with distinct platform/tenant Audit contexts',async()=>{
  const id='00000000-0000-4000-8000-000000000001';
  const app={id,applicant_user_id:'owner',organization_name:'Test',status:'UNDER_REVIEW',details:{}};
  let scope='',insertedSlug='';const audits:string[]=[];
  const client={query:vi.fn(async(sql:string,args:unknown[]=[])=>{
    if(sql.includes('set_config')){scope=String(args[1]);return {rows:[]};}
    if(sql.includes('FROM organization_applications WHERE'))return {rows:[app]};
    if(sql.includes('FROM organization_application_transitions'))return {rows:[]};
    if(sql.includes('SELECT id FROM users'))return {rows:[{id:'owner'}]};
    if(sql.includes('INSERT INTO organizations')){insertedSlug=String(args[1]);return {rows:[{id:'tenant',slug:insertedSlug,status:'setup'}]};}
    if(sql.includes('INSERT INTO memberships')){expect(scope).toBe('tenant');return {rows:[{id:'membership'}]};}
    if(sql.includes('INSERT INTO membership_roles'))return {rows:[],rowCount:2};
    if(sql.includes('UPDATE organization_applications'))return {rows:[{...app,status:'APPROVED'}]};
    if(sql.includes('INSERT INTO audit_logs'))audits.push(scope);
    return {rows:[]};
  })};
  const database={query:vi.fn(async()=>({rows:[{is_platform_admin:true}]})),transaction:async(work:(c:typeof client)=>unknown)=>work(client)};
  const service=new OrganizationApplicationService(database as never,{deliver:async()=>({status:'PENDING_CONFIGURATION'})});
  const result=await service.approveApplication('admin',id,undefined,'00000000-0000-4000-8000-000000000002');
  expect(insertedSlug).toBe('org-'+id);
  expect(result).toMatchObject({status:'APPROVED',assignedSlug:'org-'+id});
  expect(audits).toEqual(['tenant','','tenant']);
});
