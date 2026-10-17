import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { HubDatabase, RegistryService, MonitoringEngine } from '@observability/server';
import { databaseUrl } from '../src/config.js';
async function main(){
 const args=process.argv.slice(2),user=args.find(x=>x.startsWith('--user='))?.slice(7);
 if(!args.includes('--local-acceptance')||!user||process.env.NODE_ENV==='production')throw new Error('Explicit --local-acceptance --user=<existing account> is required outside production');
 const connectionString=databaseUrl(),url=new URL(connectionString);if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))throw new Error('Local bootstrap requires the local PostgreSQL host');
 const product=new Pool({connectionString}),hub=new HubDatabase({connectionString});
 try{
  const account=(await product.query<{id:string;display_name:string}>('SELECT id,display_name FROM users WHERE (lower(email)=lower($1) OR lower(username)=lower($1)) AND is_active=true',[user])).rows[0];if(!account)throw new Error('Active local account not found');
  const registry=new RegistryService(hub);const bootstrap=await registry.bootstrap({issuer:'jupiter',subject:account.id,displayName:account.display_name},'Explicit local acceptance bootstrap');
  let app=(await hub.control(async c=>(await c.query<{id:string}>('SELECT id FROM observability.applications WHERE slug=$1',['jupiter'])).rows[0]));
  if(!app)app=await registry.createApplication(bootstrap.principalId,{slug:'jupiter',name:'Jupiter',description:'Jupiter application telemetry',allowedOrigins:(process.env.WEB_ORIGIN??'http://127.0.0.1:5173,http://localhost:5173').split(',').map(s=>s.trim())});
  const localOrigin=args.find(x=>x.startsWith('--local-origin='))?.slice(15);
  if(localOrigin){const originUrl=new URL(localOrigin);if(!['127.0.0.1','localhost','[::1]'].includes(originUrl.hostname)||originUrl.origin!==localOrigin)throw new Error('Acceptance origin must be an exact loopback origin');const origins=await hub.control(async c=>(await c.query<{allowed_origins:string[]}>('SELECT allowed_origins FROM observability.applications WHERE id=$1',[app!.id])).rows[0].allowed_origins);if(!origins.includes(localOrigin))await registry.configureApplication(bootstrap.principalId,app.id,{allowedOrigins:[...origins,localOrigin],reason:'Explicit additional local acceptance origin'});}
  let environment=await hub.control(async c=>(await c.query<{id:string}>('SELECT id FROM observability.environments WHERE application_id=$1 AND key=$2',[app.id,'local'])).rows[0]);
  if(!environment)environment=await registry.createEnvironment(bootstrap.principalId,app.id,{key:'local',kind:'DEVELOPMENT'});
  await new MonitoringEngine(hub,registry).ensureDefaults(app.id);
  const directory=resolve(process.cwd(),'../../.local');await mkdir(directory,{recursive:true});
  await writeFile(resolve(directory,'observability.json'),JSON.stringify({applicationId:app.id,environmentId:environment.id,enabled:true},null,2)+'\n',{mode:0o600});
  console.log(JSON.stringify({event:'observability.local_bootstrap',principalId:bootstrap.principalId,created:bootstrap.created,applicationId:app.id,environmentId:environment.id,aiEnabled:false}));
 }finally{await product.end();await hub.close();}
}
void main().catch(()=>{console.error('OBSERVABILITY_BOOTSTRAP_FAILED: verify local account, migration and database configuration');process.exitCode=1;});
