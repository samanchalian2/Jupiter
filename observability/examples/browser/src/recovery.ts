import {BrowserSdk,IndexedDbQueue} from '@observability/browser-sdk';
import type {IdentityScope} from '@observability/contracts';

const response=await fetch('/reference/session');
if(!response.ok)throw Error('Verified fixture session required');
const session=await response.json() as {scope:IdentityScope;endpoint:string};
const storage=new IndexedDbQueue(),mode=new URL(location.href).searchParams.get('trigger');
const sdk=new BrowserSdk({applicationId:session.scope.applicationId,environmentId:session.scope.environmentId,endpoint:session.endpoint,contextProvider:()=>session.scope,storage,reportMetrics:false,authProvider:async scope=>{
 const response=await fetch('/reference/browser-credential',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:'{}'});
 if(!response.ok)return null;const value=await response.json();if(JSON.stringify(value.scope)!==JSON.stringify(scope))return null;
 return{token:value.token,scope:value.scope,expiresAt:Date.parse(value.expiresAt)};
}});
// Deliberately do NOT start the SDK: no startup flush, ten-second timer,
// online/visibility listeners or manual flush can explain this acceptance.
const eventId=await sdk.capture({category:'FRONTEND',severity:'ERROR',eventCode:'reference.recovery',normalizedMessage:'Controlled named recovery trigger'});
const result=document.getElementById('result')!,button=document.getElementById('recover') as HTMLButtonElement;
const display=(state:string)=>{result.textContent=JSON.stringify({mode,eventId,state});};
display('READY');button.disabled=false;
button.onclick=()=>{void(async()=>{
 if(mode==='probe'){
  const response=await fetch('/reference/session');
  if(!response.ok){sdk.notifyApiConnectivity(session.scope,false);display('PROBE_FAILED');return;}
  const verified=await response.json();if(JSON.stringify(verified.scope)!==JSON.stringify(session.scope)){display('SCOPE_CHANGED');return;}
  sdk.notifyApiConnectivity(session.scope,true);
 }else sdk.notifyAuthenticatedActivity(session.scope);
 display('NOTIFIED');
})().catch(()=>display('PROBE_FAILED'));};
