import { createServer } from 'node:http';
import { expect, vi } from 'vitest';
import { NodeSdk } from '@observability/node-sdk';
import type { HubBindingService } from '../../src/observability/hub-binding.service.js';

/** Actual 10-second Node SDK timer + loopback HTTP 503, never a fake fetch. */
export async function withAutomaticHubOutage(input:{
 applicationId:string;environmentId:string;hubOrigin:string;credential:string;
 binding:HubBindingService;originalSdk:NodeSdk;work:(afterFirstRetry:()=>Promise<void>)=>Promise<void>;
}){
 let unavailable=true,failures=0,delivered=0;
 const fallbackCodes:string[]=[];
 const proxy=createServer();
 proxy.on('request',async(request,response)=>{
  const chunks:Buffer[]=[];for await(const chunk of request)chunks.push(Buffer.from(chunk));
  if(unavailable){failures++;response.writeHead(503,{'content-type':'application/json'});response.end('{"reasonCode":"FIXTURE_HUB_UNAVAILABLE"}');return;}
  try{
   const upstream=await fetch(`${input.hubOrigin}${request.url}`,{method:'POST',headers:{authorization:request.headers.authorization??'','content-type':'application/json'},body:Buffer.concat(chunks),signal:AbortSignal.timeout(5000)});
   const body=await upstream.text();response.writeHead(upstream.status,{'content-type':'application/json'});response.end(body);if(upstream.ok)delivered++;
  }catch{response.writeHead(502);response.end();}
 });
 let sdk:NodeSdk|undefined;
 try{
  await new Promise<void>(done=>proxy.listen(0,'127.0.0.1',done));const address=proxy.address();if(!address||typeof address==='string')throw Error('Missing outage listener');
  sdk=new NodeSdk({applicationId:input.applicationId,environmentId:input.environmentId,endpoint:`http://127.0.0.1:${address.port}/api/v1/observability`,credentialProvider:async()=>input.credential,reportMetrics:false,fallback:entry=>{fallbackCodes.push(String(entry.code));}}).start();
  Object.assign(input.binding,{sdk});
  await input.work(async()=>{
   expect(sdk!.stats().queued).toBeGreaterThan(0);
   // Wait for the REAL existing timer, without calling flush or changing cadence.
   await vi.waitFor(()=>expect(failures).toBeGreaterThan(0),{timeout:15000,interval:50});
   expect(sdk!.stats().queued).toBeGreaterThan(0);expect(sdk!.stats().queued).toBeLessThanOrEqual(500);
   expect(fallbackCodes).toContain('INGESTION_UNAVAILABLE');expect(delivered).toBe(0);
  });
  // All intake settlements and explicit ticket submission have completed while
  // Hub remained unavailable. Reconnect and let the next real timer deliver.
  expect(delivered).toBe(0);unavailable=false;
  await vi.waitFor(()=>{expect(delivered).toBeGreaterThan(0);expect(sdk!.stats().queued).toBe(0);},{timeout:15000,interval:50});
  expect(sdk.stats().dropped).toBe(0);
  console.log(JSON.stringify({event:'observability.local_automatic_flush_outage',result:'PASS',http503Attempts:failures,recoveredBatches:delivered,cadenceMs:10000,explicitFlushCalls:0,dropped:0,businessWork:'COMPLETED_WHILE_HUB_UNAVAILABLE',limits:'Actual SDK timer and product QueueWorker/services in disposable DB; loopback HTTP proxy. Not full AppModule/process boot or browser business flow.'}));
 }finally{
  Object.assign(input.binding,{sdk:input.originalSdk});await sdk?.shutdown();proxy.closeAllConnections();await new Promise<void>(done=>proxy.close(()=>done()));
 }
}
