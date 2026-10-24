import {expect} from 'vitest';
import {createServer,request} from 'node:https';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,readFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,basename} from 'node:path';
import {createHubNodeHandler,type HubHttpApi} from '../src/index.js';

/** A synthetic localhost certificate is trusted ONLY by the individual client.
 * No OS trust store, target server or committed private key is involved. */
export async function httpsAcceptance(api:HubHttpApi,token:string,body:unknown){
 const directory=await mkdtemp(join(tmpdir(),'obs069-tls-'));let server:ReturnType<typeof createServer>|undefined;
 try{
  await promisify(execFile)(process.env.OBSERVABILITY_OPENSSL??'openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',join(directory,'key.pem'),'-out',join(directory,'cert.pem'),'-days','1','-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost,IP:127.0.0.1'],{timeout:15000,maxBuffer:65536,windowsHide:true});
  const cert=await readFile(join(directory,'cert.pem')),key=await readFile(join(directory,'key.pem')),handler=createHubNodeHandler(api);let received=0;
  server=createServer({key,cert,minVersion:'TLSv1.2'},(req,res)=>{received++;void handler(req,res);});server.on('tlsClientError',()=>undefined);
  await new Promise<void>(done=>server!.listen(0,'127.0.0.1',done));const address=server.address();if(!address||typeof address==='string')throw Error('TLS fixture unavailable');
  const post=(trusted:boolean,credential=token,servername?:string)=>new Promise<{status:number;value:any;authorized:boolean}>((done,fail)=>{
   const payload=JSON.stringify(body),call=request({hostname:'127.0.0.1',port:address.port,path:'/api/v1/observability/events/batch',method:'POST',rejectUnauthorized:true,...(trusted?{ca:cert}:{}),...(servername?{servername}:{}),headers:{'content-type':'application/json',...(credential?{authorization:`Bearer ${credential}`}:{})}},response=>{
    const authorized=(response.socket as import('node:tls').TLSSocket).authorized;let data='';response.setEncoding('utf8');response.on('data',chunk=>{data+=chunk;if(data.length>65536)call.destroy(Error('TLS fixture response bound'));});response.on('end',()=>{try{done({status:response.statusCode!,value:JSON.parse(data),authorized});}catch(error){fail(error);}});
   });call.setTimeout(5000,()=>call.destroy(Error('TLS fixture timeout')));call.on('error',fail);call.end(payload);
  });
  await expect(post(false)).rejects.toMatchObject({code:'DEPTH_ZERO_SELF_SIGNED_CERT'});expect(received).toBe(0);
  await expect(post(true,token,'wrong.example.test')).rejects.toMatchObject({code:'ERR_TLS_CERT_ALTNAME_INVALID'});expect(received).toBe(0);
  expect((await post(true,'')).status).toBe(401);
  const first=await post(true),duplicate=await post(true);expect(first.authorized).toBe(true);expect(first.status).toBe(200);expect(first.value.acknowledgements[0].status).toBe('ACCEPTED');expect(duplicate.value.acknowledgements[0].status).toBe('DUPLICATE');expect(received).toBe(3);
 }finally{
  try{if(server){server.closeAllConnections();if(server.listening)await new Promise<void>((done,fail)=>server!.close(error=>error?fail(error):done()));}}
  finally{const target=resolve(directory);if(dirname(target)!==resolve(tmpdir())||!basename(target).startsWith('obs069-tls-'))throw Error('Unsafe TLS fixture cleanup target');await rm(target,{recursive:true,force:true});await expect(stat(target)).rejects.toMatchObject({code:'ENOENT'});}
 }
 console.log(JSON.stringify({event:'observability.https_handler_acceptance',result:'PASS',tls:'VERIFIED_LOCAL_CERTIFICATE_AND_HOSTNAME',negative:'UNTRUSTED_AND_WRONG_HOST_REJECTED_BEFORE_HTTP',ingestion:'REAL_AUTHORIZED_ACK_DUPLICATE',cleanup:'EPHEMERAL_KEY_CERT_REMOVED_NO_OS_TRUST_CHANGE',limits:'Existing generic Node handler mounted on local HTTPS; not staging/target-host TLS deployment.'}));
}
