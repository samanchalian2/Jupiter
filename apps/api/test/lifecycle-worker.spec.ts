import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NodeSdk } from '@observability/node-sdk';
import { runLifecycleWorkerCycle } from '../src/lifecycle-worker.js';
import { HubBindingService } from '../src/observability/hub-binding.service.js';
afterEach(()=>vi.restoreAllMocks());
const applicationId=crypto.randomUUID(),environmentId=crypto.randomUUID(),orgA=crypto.randomUUID(),orgB=crypto.randomUUID();
function fixture(fail?:string,enabled=true){
 const events:Record<string,unknown>[]=[],steps:string[]=[],errors:unknown[]=[],logs:unknown[]=[];
 vi.spyOn(Logger.prototype,'warn').mockImplementation(value=>{logs.push(value);});
 const sdk=new NodeSdk({applicationId,environmentId,endpoint:'http://127.0.0.1:1',reportMetrics:false,credentialProvider:async()=> 'fixture-only',fallback:()=>undefined,transport:async(_url,init)=>{const batch=JSON.parse(String(init?.body));events.push(...batch.events);return Response.json({schemaVersion:'1.1',acknowledgements:batch.events.map((row:{eventId:string})=>({eventId:row.eventId,status:'ACCEPTED'}))});}});
 const binding=new HubBindingService(undefined as never,undefined as never,undefined as never);
 if(enabled)Object.assign(binding,{configuration:{applicationId,environmentId,enabled:true},sdk});
 const stage=async(name:string)=>{steps.push(name);if(name===fail){const error=Error('Controlled worker failure password=fixture-sensitive-value');errors.push(error);throw error;}};
 const services={lifecycle:{expireDue:()=>stage('expire')},commercial:{provisionCurrent:async(id:string)=>{await stage(id);return{};}},database:{query:async()=>{await stage('enumerate');return{rows:[{id:orgA},{id:orgB}]};}},directory:{scheduleDue:()=>stage('schedule'),evaluateHealth:()=>stage('health')},observation:binding} as unknown as Parameters<typeof runLifecycleWorkerCycle>[0];
 return{sdk,binding,events,steps,errors,logs,services};
}
describe('actual product lifecycle worker observation boundary',()=>{
 it('keeps the real stage order and no failure events on success',async()=>{const f=fixture();expect(await runLifecycleWorkerCycle(f.services)).toBe(true);expect(f.steps).toEqual(['expire','enumerate',orgA,orgB,'schedule','health']);expect(f.sdk.stats().queued).toBe(0);expect(f.logs).toEqual([]);});
 it.each([['expire','subscription.expire_due',null],['enumerate','commercial.enumerate_organizations',null],[orgB,'commercial.provision_current',orgB],['schedule','directory.schedule_due',null],['health','directory.evaluate_health',null]])('captures stage %s once with trusted automation scope',async(stage,operation,tenant)=>{
  const f=fixture(stage!);expect(await runLifecycleWorkerCycle(f.services)).toBe(false);expect(f.steps.at(-1)).toBe(stage);await f.sdk.flush();expect(f.events).toHaveLength(1);expect(f.events[0]).toMatchObject({source:'WORKER',category:'WORKER',eventCode:'worker.job_failed',operationName:operation,actorReference:null,tenantReference:tenant,applicationId,environmentId});expect(JSON.stringify(f.events)).not.toContain('fixture-sensitive-value');expect(JSON.stringify(f.logs)).not.toContain('fixture-sensitive-value');expect(f.logs).toHaveLength(1);
 });
 it('retains failure/retry-next-cycle and safe throttled fallback when Hub is disabled',async()=>{const f=fixture(orgA,false);expect(await runLifecycleWorkerCycle(f.services)).toBe(false);expect(await runLifecycleWorkerCycle(f.services)).toBe(false);expect(f.steps).toEqual(['expire','enumerate',orgA,'expire','enumerate',orgA]);expect(f.sdk.stats().queued).toBe(0);expect(f.logs).toHaveLength(1);expect(JSON.stringify(f.logs)).toContain('PRODUCT_WORKER_FAILED');expect(JSON.stringify(f.logs)).not.toContain('fixture-sensitive-value');});
 it('does not borrow a human actor from an enclosing async request context',async()=>{const f=fixture(orgA);await f.sdk.run({applicationId,environmentId,actorReference:'request-actor',tenantReference:orgB},()=>runLifecycleWorkerCycle(f.services));await f.sdk.flush();expect(f.events[0]).toMatchObject({actorReference:null,tenantReference:orgA});});
 it('does not rerun successful business work or hide its original failure if instrumentation breaks',async()=>{const f=fixture();vi.spyOn(f.sdk,'run').mockImplementation(()=>{throw Error('Observer unavailable');});expect(await runLifecycleWorkerCycle(f.services)).toBe(true);expect(f.steps).toEqual(['expire','enumerate',orgA,orgB,'schedule','health']);const original=Error('Original worker failure');await expect(f.binding.observeBackgroundOperation('subscription.expire_due',null,async()=>{throw original;})).rejects.toBe(original);});
});
