import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../src/database/database.service.js';
import { OrganizationService } from '../src/organization/organization.service.js';
import { databaseUrl } from '../src/config.js';
/** Local only, explicit retained slugs; no physical deletes or identity changes. */
async function main(){
 const args=process.argv.slice(2),user=args.find(x=>x.startsWith('--user='))?.slice(7),keep=args.filter(x=>x.startsWith('--keep=')).map(x=>x.slice(7));
 if(!args.includes('--local-only')||!user||!keep.length||process.env.NODE_ENV==='production')throw Error('Explicit local-only user and keep list required');
 if(!['localhost','127.0.0.1','[::1]'].includes(new URL(databaseUrl()).hostname))throw Error('Only local database allowed');
 const database=new DatabaseService(),service=new OrganizationService(database,{} as never);
 try{
  const actor=(await database.query<{id:string}>('SELECT id FROM users WHERE lower(email)=lower($1) AND is_active AND is_platform_admin',[user])).rows[0];if(!actor)throw Error('Active Platform Admin required');
  const rows=(await database.query<{id:string;slug:string;status:string}>('SELECT id,slug,status FROM organizations ORDER BY slug')).rows;
  if(keep.some(slug=>!rows.some(row=>row.slug===slug)))throw Error('Retained workspace missing');
  const targets=rows.filter(row=>!keep.includes(row.slug)&&row.status!=='archived');
  if(!args.includes('--apply')){console.log(JSON.stringify({dryRun:true,keep,targets:targets.map(row=>row.slug)}));return;}
  let archived=0;
  for(const row of targets){if(row.status!=='suspended')await service.setOrganizationStatus(actor.id,row.id,'suspended');await service.archiveWorkspace(actor.id,row.id,{slug:row.slug,reason:'Owner requested local workspace cleanup; data retained for reversible recovery'},randomUUID());archived++;}
  console.log(JSON.stringify({applied:true,kept:keep,archived,physicalRowsDeleted:0,usersDeleted:0,retention:'preserved',scope:'local-only'}));
 }finally{await database.onModuleDestroy();}
}
void main().catch(()=>{console.error('LOCAL_WORKSPACE_CLEANUP_FAILED');process.exitCode=1;});
