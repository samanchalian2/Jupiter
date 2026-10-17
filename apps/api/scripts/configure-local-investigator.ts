import { Pool } from 'pg';
import { HubDatabase, RegistryService, InvestigatorService, AesCredentialVault } from '@observability/server';
import { databaseUrl, aiCredentialEncryptionKey } from '../src/config.js';
import { mkdir,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/** Explicit local configuration; secret arrives through stdin, never argv/logs. */
async function main() {
  const args=process.argv.slice(2),user=args.find(value=>value.startsWith('--user='))?.slice(7);
  if(!args.includes('--local-only')||!user||process.env.NODE_ENV==='production')throw Error();
  const connectionString=databaseUrl(),url=new URL(connectionString);
  if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname))throw Error();
  const key=aiCredentialEncryptionKey();if(!key)throw Error();
  let raw='';for await(const chunk of process.stdin){raw+=chunk;if(Buffer.byteLength(raw)>8192)throw Error();}
  const input=JSON.parse(raw||'{}') as {credential?:string;endpoint?:string;model?:string};raw='';
  const budget=Number(args.find(value=>value.startsWith('--monthly-budget='))?.slice(17)??0),enabled=args.includes('--activate');
  if(!Number.isSafeInteger(budget)||budget<0||budget>1_000_000_000||enabled&&!budget)throw Error();
  const product=new Pool({connectionString}),hub=new HubDatabase({connectionString});
  try {
    const account=(await product.query<{id:string;display_name:string}>('SELECT id,display_name FROM users WHERE lower(email)=lower($1) AND is_active AND is_platform_admin',[user])).rows[0];
    const app=await hub.control(async c=>(await c.query<{id:string}>('SELECT id FROM observability.applications WHERE slug=$1',['jupiter'])).rows[0]);
    if(!account||!app)throw Error();
    const registry=new RegistryService(hub),principal=await registry.principal({issuer:'jupiter',subject:account.id,displayName:account.display_name});
    const service=new InvestigatorService(hub,registry,new AesCredentialVault(key),{analyze:async()=>{throw Error('LIVE_CALL_NOT_ALLOWED');}},{allowedHosts:['api.gapgpt.app']});
    const existing=await service.configuration(principal,app.id);
    const model=input.model??existing.model,endpoint=input.endpoint??existing.endpoint;
    await service.configure(principal,app.id,{enabled,externalProcessingAllowed:true,endpoint,model,credential:input.credential,monthlyTokenBudget:budget,reason:enabled?'Owner approved local GapGPT activation with explicit monthly token budget':'Owner supplied local GapGPT configuration; activation awaits explicit token budget'});
    const directory=resolve(process.cwd(),'../../.local');await mkdir(directory,{recursive:true});
    await writeFile(resolve(directory,'observability-ai.json'),JSON.stringify({allowedHosts:['api.gapgpt.app'],requestedTranscriptionModel:'gapgpt/whisper-1',transcriptionEnabled:false})+'\n',{mode:0o600});
    input.credential='';
    console.log(JSON.stringify({configured:true,application:'jupiter',environment:'local',enabled,budget,providerHost:'api.gapgpt.app',model,credentialEncrypted:true}));
  } finally {await product.end();await hub.close();}
}
void main().catch(()=>{console.error('LOCAL_INVESTIGATOR_CONFIGURATION_FAILED');process.exitCode=1;});
