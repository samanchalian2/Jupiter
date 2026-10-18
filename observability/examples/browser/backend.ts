import type {IncomingMessage,ServerResponse} from 'node:http';
import {NodeSdk} from '@observability/node-sdk';
import {isUuid} from '@observability/contracts';
/** The consumer supplies its existing verified session. No Hub/Jupiter DB or
 * membership implementation is imported; browser-supplied scope is never trusted. */
export interface ReferenceIdentity {actorReference:string;tenantReference:string|null;}
export interface ReferenceAuth {
 current(request:IncomingMessage):Promise<ReferenceIdentity|null>;
 switchTenant(request:IncomingMessage,tenant:string|null):Promise<ReferenceIdentity>;
 logout(request:IncomingMessage):Promise<void>;
}
export function referenceBackend(config:{applicationId:string;environmentId:string;hubEndpoint:string;serverCredential:string},auth:ReferenceAuth){
 const sdk=new NodeSdk({...config,endpoint:config.hubEndpoint,credentialProvider:async()=>config.serverCredential}).start();
 const json=(res:ServerResponse,status:number,value:unknown)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(value));};
 const scope=(identity:ReferenceIdentity)=>({applicationId:config.applicationId,environmentId:config.environmentId,...identity});
 return {close:()=>sdk.shutdown(),middleware:async(req:IncomingMessage,res:ServerResponse,next:()=>void)=>{
  const path=(req.url??'').split('?')[0];if(!path.startsWith('/reference/')){next();return;}
  try{
   const identity=await auth.current(req);if(!identity){json(res,401,{reasonCode:'REFERENCE_LOGIN_REQUIRED'});return;}
   if(path==='/reference/session'&&req.method==='GET'){json(res,200,{scope:scope(identity),endpoint:config.hubEndpoint});return;}
   if(req.method!=='POST'){json(res,404,{reasonCode:'NOT_FOUND'});return;}
   // Session-authenticated commands require same-origin Fetch Metadata/Origin,
   // not just possession of a browser cookie on an arbitrary cross-origin form.
   const origin=req.headers.origin,protocol=(req.socket as typeof req.socket&{encrypted?:boolean}).encrypted?'https:':'http:';if(origin!==`${protocol}//${req.headers.host}`){json(res,403,{reasonCode:'REFERENCE_ORIGIN_DENIED'});return;}
   let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>2048){json(res,413,{reasonCode:'REFERENCE_BODY_TOO_LARGE'});return;}}
   const value=JSON.parse(body||'{}');if(!value||typeof value!=='object'||Array.isArray(value)){json(res,400,{reasonCode:'INVALID_REQUEST'});return;}
   if(path==='/reference/browser-credential'){
    if(Object.keys(value).length){json(res,400,{reasonCode:'CLIENT_SCOPE_FORBIDDEN'});return;}
    const response=await fetch(`${config.hubEndpoint}/credentials/browser`,{method:'POST',headers:{authorization:`Bearer ${config.serverCredential}`,'content-type':'application/json'},body:JSON.stringify(scope(identity)),redirect:'error',signal:AbortSignal.timeout(10000)});
    if(!response.ok){json(res,503,{reasonCode:'REFERENCE_HUB_UNAVAILABLE'});return;}json(res,201,await response.json());return;
   }
   if(path==='/reference/switch-tenant'){
    if(Object.keys(value).some(key=>key!=='tenantReference')||value.tenantReference!==null&&(typeof value.tenantReference!=='string'||value.tenantReference.length>160)){json(res,400,{reasonCode:'INVALID_TENANT'});return;}json(res,200,{scope:scope(await auth.switchTenant(req,value.tenantReference)),endpoint:config.hubEndpoint});return;
   }
   if(path==='/reference/logout'){await auth.logout(req);json(res,200,{loggedOut:true});return;}
   if(path==='/reference/backend-failure'){
    const requestId=isUuid(req.headers['x-request-id'])?req.headers['x-request-id']:crypto.randomUUID(),trace=sdk.trace(typeof req.headers.traceparent==='string'?req.headers.traceparent:undefined);
    sdk.run({...scope(identity),requestId,...trace},()=>sdk.captureException(new Error('Controlled reference backend failure'),{eventCode:'reference.backend_failed',operationName:'reference.backend'}));
    await sdk.flush();json(res,500,{reasonCode:'CONTROLLED_REFERENCE_FAILURE',requestId});return;
   }
   json(res,404,{reasonCode:'NOT_FOUND'});
  }catch{json(res,403,{reasonCode:'REFERENCE_COMMAND_DENIED'});}
 }};
}
