import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueueWorker } from '../src/jobs/queue.worker.js';
import { HubBindingService } from '../src/observability/hub-binding.service.js';
import { NodeSdk } from '@observability/node-sdk';

afterEach(()=>vi.restoreAllMocks());
const orgA=crypto.randomUUID(),orgB=crypto.randomUUID();
function fixture(fail?:string){
 const operations:{name:string;tenant:string|null}[]=[],business:string[]=[],warnings:unknown[]=[];
 vi.spyOn(Logger.prototype,'warn').mockImplementation(value=>{warnings.push(value);});
 const outcomes:{name:string;tenant:string|null;status:string}[]=[];
 const observation={observeBackgroundOperation:async<T>(name:string,tenant:string|null,work:()=>Promise<T>)=>{operations.push({name,tenant});if(name===fail)throw Error('password=fixture-sensitive-value');return work();},reportBackgroundOutcome:(name:string,tenant:string|null,status:string)=>{outcomes.push({name,tenant,status});}};
 const database={query:vi.fn(async(sql:string)=>sql.startsWith('SELECT status')?{rows:[{status:'SUCCEEDED',next_attempt_at:null}]}:sql.includes('ai_requests')?{rows:[{id:'ai-1',organization_id:orgA}]}:{rows:[{id:'voice-1',organization_id:orgB}]})};
 const ai={process:vi.fn(async()=>{business.push('ai');})},transcription={process:vi.fn(async()=>{business.push('voice');})};
 const intakes={pending:vi.fn(async()=>[{id:'intake-1',organization_id:orgA}]),process:vi.fn(async()=>{business.push('intake');}),cleanupExpired:vi.fn(async()=>{business.push('cleanup');return{expired:0};})};
 const worker=new QueueWorker(database as never,ai as never,transcription as never,intakes as never,observation as never);
 return{worker,operations,business,warnings,database,ai,transcription,intakes,outcomes};
}
const drain=(worker:QueueWorker)=>(worker as unknown as {drain():Promise<void>}).drain();

describe('actual AI/transcription/intake queue worker observation boundary',()=>{
 it('does not stop later jobs when a diagnostics-only outcome read fails',async()=>{const f=fixture();const query=f.database.query.getMockImplementation()!;f.database.query.mockImplementation(async(sql:string)=>{if(sql.startsWith('SELECT status'))throw Error('password=private-outcome');return query(sql);});await drain(f.worker);expect(f.business).toEqual(['ai','voice','intake','cleanup']);expect(f.outcomes).toEqual([]);expect(f.warnings).toEqual(['Queue worker outcome observation unavailable','Queue worker outcome observation unavailable']);});
 it('reports persisted caught failures without changing retries or successful job flow',async()=>{const f=fixture();f.database.query.mockImplementation(async(sql:string)=>sql.startsWith('SELECT status')?{rows:[{status:'FAILED',next_attempt_at:null}]}:sql.includes('ai_requests')?{rows:[{id:'ai-1',organization_id:orgA}]}:{rows:[{id:'voice-1',organization_id:orgB}]});f.transcription.process.mockResolvedValue({status:'DEAD_LETTER'} as never);await drain(f.worker);expect(f.business).toEqual(['ai','intake','cleanup']);expect(f.outcomes).toEqual([{name:'queue.ai.process',tenant:orgA,status:'FAILED'},{name:'queue.transcription.process',tenant:orgB,status:'DEAD_LETTER'},{name:'queue.intake.process',tenant:orgA,status:'FAILED'}]);expect(f.warnings).toEqual([]);});
 it('actual host outcome reports pass the contract and never include job content or a human actor',async()=>{const app=crypto.randomUUID(),env=crypto.randomUUID(),events:any[]=[];const sdk=new NodeSdk({applicationId:app,environmentId:env,endpoint:'http://127.0.0.1:1',reportMetrics:false,credentialProvider:async()=> 'fixture',transport:async(_url,init)=>{const batch=JSON.parse(String(init?.body));events.push(...batch.events);return Response.json({schemaVersion:'1.1',acknowledgements:batch.events.map((e:{eventId:string})=>({eventId:e.eventId,status:'ACCEPTED'}))});}});const host=new HubBindingService(undefined as never,undefined as never,undefined as never);Object.assign(host,{configuration:{applicationId:app,environmentId:env,enabled:true},sdk});for(const outcome of ['RETRY','FAILED','DEAD_LETTER'] as const)host.reportBackgroundOutcome('queue.ai.process',orgA,outcome);expect(sdk.stats().queued).toBe(3);await sdk.flush();expect(events.map(e=>e.safeMetadata.failureCode)).toEqual(['RETRY','FAILED','DEAD_LETTER']);expect(events.map(e=>e.safeMetadata.retryExhausted)).toEqual([false,true,true]);expect(events.every(e=>e.actorReference===null&&e.tenantReference===orgA)).toBe(true);await sdk.shutdown();});
 it('preserves stage order and uses trusted job tenant with no human actor',async()=>{const f=fixture();await drain(f.worker);expect(f.operations).toEqual([
  {name:'queue.providers.initialize',tenant:null},{name:'queue.ai.enumerate',tenant:null},{name:'queue.ai.process',tenant:orgA},{name:'queue.transcription.enumerate',tenant:null},{name:'queue.transcription.process',tenant:orgB},{name:'queue.intake.enumerate',tenant:null},{name:'queue.intake.process',tenant:orgA},{name:'queue.intake.cleanup',tenant:null}
 ]);expect(f.business).toEqual(['ai','voice','intake','cleanup']);expect(f.warnings).toEqual([]);});
 it('does not overlap drains or duplicate business effects',async()=>{const f=fixture();let release:(()=>void)|undefined;f.database.query.mockImplementationOnce(()=>new Promise(resolve=>{release=()=>resolve({rows:[{id:'ai-1',organization_id:orgA}]});}));const first=drain(f.worker);await vi.waitFor(()=>expect(release).toBeTypeOf('function'));const second=drain(f.worker);await second;release!();await first;expect(f.ai.process).toHaveBeenCalledTimes(1);expect(f.intakes.process).toHaveBeenCalledTimes(1);});
 it('keeps provider/job failure retry semantics and logs no raw error',async()=>{const f=fixture('queue.transcription.process');await drain(f.worker);expect(f.business).toEqual(['ai']);expect(f.intakes.process).not.toHaveBeenCalled();expect(f.warnings).toEqual(['Queue worker cycle failed']);expect(JSON.stringify(f.warnings)).not.toContain('fixture-sensitive-value');await drain(f.worker);expect(f.ai.process).toHaveBeenCalledTimes(2);});
 it('does not advance the cleanup cadence when cleanup fails',async()=>{const f=fixture('queue.intake.cleanup');await drain(f.worker);await drain(f.worker);expect(f.operations.filter(row=>row.name==='queue.intake.cleanup')).toHaveLength(2);});
});
