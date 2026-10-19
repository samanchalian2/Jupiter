import { BrowserSdk, IndexedDbQueue } from '@observability/browser-sdk';
import { encodedBytes, type IdentityScope } from '@observability/contracts';
type Session = { scope: IdentityScope; endpoint: string };
const mode = new URL(location.href).searchParams.get('mode') === 'bytes' ? 'bytes' : 'count';
const storage = new IndexedDbQueue(`observability-performance-${mode}`);
const sessionResponse = await fetch('/reference/session');
if (!sessionResponse.ok) throw Error('Verified reference session required');
const session = await sessionResponse.json() as Session;
const sdk = new BrowserSdk({ applicationId:session.scope.applicationId,environmentId:session.scope.environmentId,endpoint:session.endpoint,storage,contextProvider:()=>session.scope,authProvider:async scope=>{
  const response=await fetch('/reference/browser-credential',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:'{}'});
  if(!response.ok)return null;const credential=await response.json();
  if(JSON.stringify(credential.scope)!==JSON.stringify(scope))return null;
  return{token:credential.token,scope:credential.scope,expiresAt:Date.parse(credential.expiresAt)};
} });
const output = document.getElementById('result')!;
const buttons = ['fill','flush','replay'].map(id=>document.getElementById(id) as HTMLButtonElement);
const report = async (action:string,extra:object={}) => {
  const entries=await storage.list(),data=entries.filter(row=>row.kind!=='METRICS'),metrics=entries.filter(row=>row.kind==='METRICS');
  output.textContent=JSON.stringify({action,mode,queued:data.length,dataBytes:data.reduce((total,row)=>total+encodedBytes(row),0),metricCount:metrics.length,metricBytes:metrics.reduce((total,row)=>total+encodedBytes(row),0),status:await sdk.getStatus(),...extra});
};
const run = (work:()=>Promise<void>) => {buttons.forEach(button=>button.disabled=true);void work().catch(()=>{output.textContent=JSON.stringify({error:'PERFORMANCE_FIXTURE_FAILED'});}).finally(()=>buttons.forEach(button=>button.disabled=false));};
buttons[0].onclick=()=>run(async()=>{
  const times:number[]=[];let accepted=0;const started=performance.now();
  for(let index=0;index<501;index++){
    const start=performance.now();
    const id=await sdk.capture({category:'FRONTEND',severity:'ERROR',eventCode:`reference.performance.${mode}`,normalizedMessage:mode==='bytes'?'آزمون '.repeat(300):'Controlled offline count measurement',...(mode==='bytes'?{sanitizedStack:' at controlledFrame in independent fixture\n'.repeat(200).slice(0,8000)}:{})});
    times.push(performance.now()-start);if(!id)break;accepted++;
  }
  const wallMs=performance.now()-started;times.sort((a,b)=>a-b);
  await report('fill',{accepted,attempts:times.length,wallMs,captureP50Ms:times[Math.ceil(times.length*.5)-1],captureP95Ms:times[Math.ceil(times.length*.95)-1],captureMaxMs:times.at(-1)});
});
buttons[1].onclick=()=>run(async()=>{const start=performance.now();await sdk.flush();await report('flush',{wallMs:performance.now()-start});});
buttons[2].onclick=()=>run(async()=>{const start=performance.now();let flushes=0;while((await sdk.getStatus()).queued&&flushes<30){await sdk.flush();flushes++;await new Promise(done=>setTimeout(done,20));}await report('replay',{flushes,wallMs:performance.now()-start});});
document.getElementById('ready')!.textContent='Verified session ready';buttons.forEach(button=>button.disabled=false);
await report('ready');
