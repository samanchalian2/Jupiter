import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { expect } from 'vitest';
import { HubDatabase, RegistryService, IssueEngine, RetentionService, InvestigatorService, AesCredentialVault, SelfMonitoringService, type InvestigationProvider } from '../src/index.js';
import type { TelemetryEvent } from '@observability/contracts';
const summary = (values: number[]) => {
  const sorted = [...values].sort((a,b) => a-b);
  return { samples: sorted.length, p50Ms: sorted[Math.ceil(sorted.length*.5)-1], p95Ms: sorted[Math.ceil(sorted.length*.95)-1], maxMs: sorted.at(-1) };
};
/** Invoked only inside the disposable PostgreSQL acceptance fixture. */
export async function performanceAcceptance(database: HubDatabase, registry: RegistryService, root: string, endpoint: string) {
  const app = (await registry.createApplication(root, { slug: `performance-${randomUUID()}`, name: 'LOCAL measured load' })).id;
  const env = (await registry.createEnvironment(root, app, { key: 'performance', kind: 'TEST' })).id;
  const credential = await registry.issueServerCredential(root, app, env, 'Disposable local performance acceptance');
  const count = 1000, batchSize = 50, concurrency = 2;
  const batches: TelemetryEvent[][] = Array.from({ length: count/batchSize }, (_, batch) => Array.from({ length: batchSize }, (_, offset) => {
    const index = batch*batchSize+offset, failed = index%10===0;
    return { schemaVersion:'1.1',eventId:randomUUID(),applicationId:app,environmentId:env,occurredAt:new Date().toISOString(),source:'SERVER',category:'BACKEND',severity:failed?'ERROR':'INFO',eventCode:'http.operation',normalizedMessage:'Controlled local performance operation',operationName:`GET /measured/${index%10}`,httpStatus:failed?500:200,durationMs:5,actorReference:`synthetic-user-${index%50}`,tenantReference:`synthetic-tenant-${index%5}` };
  }));
  try {
    const batchTimes: number[] = []; let next = 0;
    const ingestStart = performance.now();
    await Promise.all(Array.from({ length:concurrency }, async () => {
      for (let index=next++;index<batches.length;index=next++) {
        const started=performance.now();
        const response=await fetch(`${endpoint}/events/batch`,{method:'POST',headers:{authorization:`Bearer ${credential.token}`,'content-type':'application/json'},body:JSON.stringify({events:batches[index]})});
        expect(response.status).toBe(200);const ack=await response.json();expect(ack.acknowledgements).toHaveLength(batchSize);
        expect(ack.acknowledgements.every((row:{status:string})=>row.status==='ACCEPTED')).toBe(true);batchTimes.push(performance.now()-started);
      }
    }));
    const ingestMs=performance.now()-ingestStart,engine=new IssueEngine(database,registry),workerId=randomUUID(),cpuBefore=process.cpuUsage(),memoryBefore=process.memoryUsage();
    const aggregateStart=performance.now();let aggregated=0;
    for(let jobs=await engine.queue.claim(workerId,25,['AGGREGATE']);jobs.length;jobs=await engine.queue.claim(workerId,25,['AGGREGATE']))for(const job of jobs){expect(job.application_id).toBe(app);expect(await engine.aggregate(job)).toBe(true);aggregated++;}
    const aggregationMs=performance.now()-aggregateStart,cpu=process.cpuUsage(cpuBefore),memory=process.memoryUsage();expect(aggregated).toBe(count);
    const dashboardTimes:number[]=[];
    for(let index=0;index<20;index++){
      const started=performance.now(),response=await fetch(`${endpoint}/operations/applications/${app}/overview?environmentId=${env}`,{headers:{authorization:'Bearer root-identity-placeholder'}});
      expect(response.status).toBe(200);const dashboard=await response.json();expect(dashboard.operations).toBe(count);expect(dashboard.failures).toBe(100);dashboardTimes.push(performance.now()-started);
    }
    const metrics=new SelfMonitoringService(database,registry),storageStarted=performance.now();await metrics.sampleStorage(100);
    const storageMs=performance.now()-storageStarted,health=await metrics.status(root,app,env);expect(health.storage.logical_bytes).toBeGreaterThan(0);
    await database.worker(c=>c.query("UPDATE observability.events SET received_at=now()-interval '40 days' WHERE application_id=$1 AND environment_id=$2 AND event_id=ANY($3::uuid[])",[app,env,batches.flat().slice(0,100).map(event=>event.eventId)]));
    const retention=new RetentionService(database,registry);await retention.enqueue();let retentionMs=0;
    for(const job of await retention.queue.claim(workerId,50,['RETENTION'])){const started=performance.now();expect(await retention.execute(job,100)).toBe(true);if(job.application_id===app)retentionMs=performance.now()-started;}
    const retained=await retention.status(root,app,env);expect(retained.last_counts.events).toBe(100);
    let providerCalls=0;const provider:InvestigationProvider={analyze:async()=>{providerCalls++;throw Error('Scheduling must not call provider');}};
    const ai=new InvestigatorService(database,registry,new AesCredentialVault(new Uint8Array(32).fill(7)),provider,{allowedHosts:[],allowLoopback:true});
    await ai.configure(root,app,{enabled:true,externalProcessingAllowed:true,endpoint:'http://127.0.0.1:1/v1',model:'controlled-benchmark',credential:randomUUID(),monthlyTokenBudget:100000,reason:'Disposable scheduling performance fixture'});
    const schedulingStart=performance.now(),scheduled=await ai.schedule(100),schedulingMs=performance.now()-schedulingStart;
    const repeatedStart=performance.now(),repeated=await ai.schedule(100),repeatedMs=performance.now()-repeatedStart;
    expect(scheduled.scheduled).toBeGreaterThan(0);expect(repeated.scheduled).toBe(0);expect(providerCalls).toBe(0);
    console.log(JSON.stringify({event:'observability.local_performance',isolation:'DISPOSABLE_DATABASE',count,batchSize,concurrency,ingestion:{wallMs:ingestMs,eventsPerSecond:count/(ingestMs/1000),batch:summary(batchTimes)},aggregation:{events:aggregated,wallMs:aggregationMs,processCpuMs:(cpu.user+cpu.system)/1000,rssBeforeBytes:memoryBefore.rss,rssAfterBytes:memory.rss,heapBeforeBytes:memoryBefore.heapUsed,heapAfterBytes:memory.heapUsed},dashboard:summary(dashboardTimes),logicalSampling:{wallMs:storageMs,bytes:health.storage.logical_bytes,basis:health.storage.basis},retention:{wallMs:retentionMs,deletedEvents:retained.last_counts.events},aiScheduling:{wallMs:schedulingMs,scheduled:scheduled.scheduled,repeatedMs,repeatScheduled:repeated.scheduled,providerCalls},limits:'In-process HTTP/service measurements, not PostgreSQL CPU, production SLO, Browser offline or whole-product workflow acceptance.'}));
  }finally{await database.control(c=>c.query('UPDATE observability.applications SET enabled=false WHERE id=$1',[app]));}
}
