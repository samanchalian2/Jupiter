import { useEffect, useState, type ReactNode } from 'react';
import { BrowserSdk, routeTemplate, type Credential } from '@observability/browser-sdk';
import { ObservabilityErrorBoundary, ObservabilityProvider } from '@observability/react-adapter';
type Scope=Credential['scope'];
type Configuration={enabled:boolean;applicationId:string;environmentId:string;releaseVersion?:string;};
const api=import.meta.env.VITE_API_URL??'/api/v1';
const originalFetch=globalThis.fetch.bind(globalThis);
let sdk:BrowserSdk|null=null,configuration:Configuration|null=null,initialization:Promise<BrowserSdk|null>|undefined,cachedCredential:Credential|undefined;
const validId=(value:unknown):value is string=>typeof value==='string'&&/^[0-9a-f-]{36}$/i.test(value);
const readSession=()=>{try{return JSON.parse(sessionStorage.getItem('jupiter.session')??'null') as {accessToken:string;user:{id?:string;memberships:{organization_id:string;organization_slug?:string;workspace_type?:string}[]}}|null;}catch{return null;}};
function currentScope():Scope{
 const session=readSession(),match=/^\/o\/([a-z0-9-]+)(?:\/|$)/.exec(location.pathname);
 const membership=match?session?.user.memberships.find(m=>m.organization_slug===match[1]):location.pathname.startsWith('/personal')?session?.user.memberships.find(m=>m.workspace_type==='PERSONAL'):undefined;
 return{applicationId:configuration!.applicationId,environmentId:configuration!.environmentId,actorReference:session?.user.id??null,tenantReference:membership?.organization_id??null};
}
export async function authenticatedHubFetch(path:string,init?:RequestInit):Promise<Response>{
 let session=readSession();if(!session)throw new Error('برای ثبت و پیگیری گزارش وارد حساب کاربری شوید.');
 let response=await originalFetch(`${api}${path}`,{...init,credentials:'include',headers:{'content-type':'application/json',authorization:`Bearer ${session.accessToken}`,...init?.headers}});
 if(response.status===401){const refresh=await originalFetch(`${api}/auth/refresh`,{method:'POST',credentials:'include'});if(refresh.ok){session=await refresh.json();sessionStorage.setItem('jupiter.session',JSON.stringify(session));window.dispatchEvent(new Event('jupiter:session-refreshed'));response=await originalFetch(`${api}${path}`,{...init,credentials:'include',headers:{'content-type':'application/json',authorization:`Bearer ${session!.accessToken}`,...init?.headers}});}else{cachedCredential=undefined;sessionStorage.removeItem('jupiter.session');await sdk?.logout();window.dispatchEvent(new Event('jupiter:session-expired'));}}
 return response;
}
async function credential(scope:Scope):Promise<Credential|null>{
 if(!readSession()||!scope.actorReference)return null;
 if(cachedCredential&&cachedCredential.expiresAt>Date.now()+30_000&&JSON.stringify(cachedCredential.scope)===JSON.stringify(scope))return cachedCredential;
 const response=await authenticatedHubFetch('/observability/jupiter/browser-credential',{method:'POST',body:'{}',headers:scope.tenantReference?{'x-organization-id':scope.tenantReference}:{}});
 if(!response.ok)return null;const value=await response.json();if(typeof value.token!=='string'||value.token.length<32||!Number.isFinite(Date.parse(value.expiresAt))||JSON.stringify(value.scope)!==JSON.stringify(scope))return null;
 cachedCredential={token:value.token,scope:value.scope,expiresAt:Date.parse(value.expiresAt)};return cachedCredential;
}
export function instrumentJupiterFetch(transport:typeof fetch,observer:Pick<BrowserSdk,'capture'|'trace'|'reportApiFailure'>,base:string,identityKey?:()=>string):typeof fetch{
 return async(input,init)=>{
  let url:URL;try{url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.origin);}catch{return transport(input,init);}
  const apiBase=new URL(base,location.origin);
  if(url.origin!==apiBase.origin||!url.pathname.startsWith(apiBase.pathname+'/')||url.pathname.includes('/observability/'))return transport(input,init);
  const trace=observer.trace(),requestId=crypto.randomUUID(),method=init?.method??(input instanceof Request?input.method:'GET'),headers=new Headers(input instanceof Request?input.headers:undefined);
  new Headers(init?.headers).forEach((value,key)=>headers.set(key,value));headers.set('traceparent',trace.traceparent);headers.set('x-request-id',requestId);
  const started=performance.now(),operationName=`${method} ${routeTemplate(url.pathname)}`,identity=identityKey?.();
  try{const response=await transport(input,{...init,headers});if(identity===identityKey?.())void observer.capture({category:'PERFORMANCE',severity:response.status>=500?'ERROR':'INFO',eventCode:'api.operation',normalizedMessage:'API operation completed',operationName,routeTemplate:routeTemplate(url.pathname),httpStatus:response.status,durationMs:Math.round(performance.now()-started),requestId,traceId:trace.traceId,spanId:trace.spanId,safeMetadata:{outcome:response.ok?'SUCCESS':response.status<500?'REJECTED':'FAILURE'}});return response;}
  catch(error){if(identity===identityKey?.())void observer.reportApiFailure({operationName,url:url.href,durationMs:Math.round(performance.now()-started),requestId,traceId:trace.traceId});throw error;}
 };
}
export async function ensureJupiterObservability():Promise<BrowserSdk|null>{
 if(initialization)return initialization;
 initialization=(async()=>{
  let value:Configuration|null=null;
  try{const response=await originalFetch(`${api}/observability/jupiter/config`,{signal:AbortSignal.timeout(2000)});if(response.ok){const next=await response.json();if(!next.enabled){localStorage.removeItem('jupiter.observability.public');return null;}if(validId(next.applicationId)&&validId(next.environmentId)){value=next;localStorage.setItem('jupiter.observability.public',JSON.stringify(next));}}}catch{try{value=JSON.parse(localStorage.getItem('jupiter.observability.public')??'null');}catch{}}
  if(!value?.enabled||!validId(value.applicationId)||!validId(value.environmentId))return null;configuration=value;
  sdk=new BrowserSdk({applicationId:value.applicationId,environmentId:value.environmentId,endpoint:new URL(`${api}/observability`,location.origin).href,contextProvider:currentScope,authProvider:credential,transport:originalFetch,release:value.releaseVersion??'development',sampling:{PERFORMANCE:1},onFeedbackAcknowledged:(feedbackId,trackingId)=>window.dispatchEvent(new CustomEvent('jupiter:feedback-acknowledged',{detail:{feedbackId,trackingId}}))});
  globalThis.fetch=instrumentJupiterFetch(originalFetch,sdk,api,()=>JSON.stringify(currentScope()));
  window.addEventListener('jupiter:session-ended',()=>{cachedCredential=undefined;void sdk?.logout();});
  window.addEventListener('jupiter:session-expired',()=>{cachedCredential=undefined;void sdk?.logout();});
  window.addEventListener('jupiter:session-refreshed',()=>{cachedCredential=undefined;void sdk?.setContext();});
  return sdk;
 })().catch(()=>null);return initialization;
}
const captureBridge:Pick<BrowserSdk,'capture'>={capture:async input=>sdk? sdk.capture(input):null};
export function JupiterObservability({children}:{children:ReactNode}){
 const[observer,setObserver]=useState<BrowserSdk|null>(null);
 useEffect(()=>{let current=true;void ensureJupiterObservability().then(value=>{if(current)setObserver(value);});return()=>{current=false;};},[]);
 const content=observer?<ObservabilityProvider sdk={observer}>{children}</ObservabilityProvider>:children;
 return <ObservabilityErrorBoundary sdk={captureBridge} fallback={<main className="page" dir="rtl"><h1>نمایش این بخش با مشکل روبه‌رو شد</h1><p>می‌توانید صفحه را دوباره بارگذاری کنید.</p><button onClick={()=>location.reload()}>بارگذاری دوباره</button></main>}>{content}</ObservabilityErrorBoundary>;
}
export async function feedbackRequest(path:string,init?:RequestInit){const observer=await ensureJupiterObservability();if(!observer||!configuration)throw new Error('گزارش مشکل در این محیط هنوز فعال نشده است.');const auth=await credential(currentScope());if(!auth)throw new Error('برای ارسال گزارش دوباره وارد حساب شوید.');const response=await originalFetch(`${api}/observability${path}`,{...init,headers:{'content-type':'application/json',authorization:`Bearer ${auth.token}`,...init?.headers}});if(!response.ok){cachedCredential=undefined;throw new Error(response.status===401?'نشست گزارش پایان یافته است؛ دوباره تلاش کنید.':'دریافت گزارش‌ها انجام نشد؛ دوباره تلاش کنید.');}return response.json();}
