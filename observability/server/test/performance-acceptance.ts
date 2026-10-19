import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { expect } from 'vitest';
import { HubDatabase, RegistryService, IssueEngine, RetentionService, InvestigatorService, AesCredentialVault, SelfMonitoringService, type InvestigationProvider } from '../src/index.js';
import type { TelemetryEvent } from '@observability/contracts';
import { concurrentPerformance } from './concurrent-performance.js';
const summary = (values: number[]) => {
  const sorted = [...values].sort((a,b) => a-b);
  return { samples: sorted.length, p50Ms: sorted[Math.ceil(sorted.length*.5)-1], p95Ms: sorted[Math.ceil(sorted.length*.95)-1], maxMs: sorted.at(-1) };
};
/** Invoked only inside the disposable PostgreSQL acceptance fixture. */
export async function performanceAcceptance(database: HubDatabase, registry: RegistryService, root: string, endpoint: string) {
  const app = (await registry.createApplication(root, { slug: `performance-${randomUUID()}`, name: 'LOCAL measured load' })).id;
  const env = (await registry.createEnvironment(root, app, { key: 'performance', kind: 'TEST' })).id;
  let samplingApp: string | undefined,comparisonApp:string|undefined;
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
    comparisonApp=(await registry.createApplication(root,{slug:`comparison-load-${randomUUID()}`,name:'LOCAL empty comparison'})).id;const comparisonEnv=(await registry.createEnvironment(root,comparisonApp,{key:'comparison',kind:'TEST'})).id,analyticsTimes:number[]=[],comparisonTimes:number[]=[];
    for(let index=0;index<10;index++){
      let started=performance.now();const analyticsResponse=await fetch(`${endpoint}/operations/applications/${app}/analytics?environmentId=${env}`,{headers:{authorization:'Bearer root-identity-placeholder'}});expect(analyticsResponse.status).toBe(200);const analytics=await analyticsResponse.json();expect(analytics.operationImpact.reduce((sum:number,row:any)=>sum+row.errors,0)).toBe(100);analyticsTimes.push(performance.now()-started);
      started=performance.now();const comparisonResponse=await fetch(`${endpoint}/operations/analytics/products`,{method:'POST',headers:{authorization:'Bearer root-identity-placeholder','content-type':'application/json'},body:JSON.stringify({targets:[{applicationId:app,environmentId:env},{applicationId:comparisonApp,environmentId:comparisonEnv}]})});expect(comparisonResponse.status).toBe(200);const comparison=await comparisonResponse.json();expect(comparison.items.map((row:any)=>[row.errors,row.operations,row.failures,row.errorRate])).toEqual([[100,1000,100,.1],[0,0,0,null]]);comparisonTimes.push(performance.now()-started);
    }
    expect(Math.max(...analyticsTimes,...comparisonTimes)).toBeLessThan(5000);console.log(JSON.stringify({event:'observability.local_analytics_performance',events:count,singleApplication:summary(analyticsTimes),twoProductComparison:summary(comparisonTimes),limits:'LOCAL actual HTTP/PostgreSQL, one 1000-event App plus empty App, not 10 loaded products, production SLO or complete performance acceptance.'}));
    const metrics=new SelfMonitoringService(database,registry),storageStarted=performance.now();await metrics.sampleStorage(100);
    const storageMs=performance.now()-storageStarted,health=await metrics.status(root,app,env);expect(health.storage.logical_bytes).toBeGreaterThan(0);
    // Exercise the scheduler beyond one bounded claim. Existing enabled fixture
    // environments have already received their current-hour sample above.
    samplingApp=(await registry.createApplication(root,{slug:`sampling-${randomUUID()}`,name:'LOCAL sampling fairness'})).id;
    const samplingEnvironments:string[]=[];
    for(let index=0;index<120;index++)samplingEnvironments.push((await registry.createEnvironment(root,samplingApp,{key:`sample-${String(index).padStart(3,'0')}`,kind:'TEST'})).id);
    const samplingStarted=performance.now(),firstSampling=await metrics.sampleStorage(100),secondSampling=await metrics.sampleStorage(100),thirdSampling=await metrics.sampleStorage(100),samplingMs=performance.now()-samplingStarted;
    expect(firstSampling.sampled).toBe(100);expect(secondSampling.sampled).toBe(20);expect(thirdSampling.sampled).toBe(0);
    const sampled=await database.worker(c=>c.query<{environment_id:string,count:string}>("SELECT environment_id,count(*)::text count FROM observability.storage_samples WHERE application_id=$1 AND bucket_start=date_trunc('hour',now()) GROUP BY environment_id",[samplingApp!]));
    expect(sampled.rows).toHaveLength(120);expect(sampled.rows.every(row=>row.count==='1'&&samplingEnvironments.includes(row.environment_id))).toBe(true);
    // Local regression guard only; this is not a production SLO.
    expect(samplingMs).toBeLessThan(30_000);
    // The scale-only cohort must not expand later retention/AI measurements.
    await database.control(c=>c.query('UPDATE observability.applications SET enabled=false WHERE id=$1',[samplingApp!]));
    await database.worker(c=>c.query("UPDATE observability.events SET received_at=now()-interval '40 days' WHERE application_id=$1 AND environment_id=$2 AND event_id=ANY($3::uuid[])",[app,env,batches.flat().slice(0,100).map(event=>event.eventId)]));
    const retention=new RetentionService(database,registry);let retentionMs=0,deletedEvents=0,targetRetentionBatches=0,retentionDrained=false;
    // Retention deliberately includes disabled scopes too. The 120-scope load
    // must be really processed, not skipped or left leased for subsequent tests.
    for(let page=0;page<20;page++){
      await retention.enqueue(100);
      const jobs=await retention.queue.claim(workerId,50,['RETENTION']);if(!jobs.length){retentionDrained=true;break;}
      for(const job of jobs){const started=performance.now();expect(await retention.execute(job,100)).toBe(true);if(job.application_id===app){retentionMs+=performance.now()-started;targetRetentionBatches++;deletedEvents+=Number((await retention.status(root,app,env)).last_counts.events??0);}}
    }
    expect(retentionDrained).toBe(true);expect(deletedEvents).toBe(100);
    const retentionCoverage=await database.worker(async c=>(await c.query("SELECT (SELECT count(*)::int FROM observability.environments) environments,(SELECT count(DISTINCT environment_id)::int FROM observability.jobs WHERE kind='RETENTION') scheduled_scopes")).rows[0]);expect(retentionCoverage.scheduled_scopes).toBe(retentionCoverage.environments);
    let providerCalls=0;const provider:InvestigationProvider={analyze:async()=>{providerCalls++;throw Error('Scheduling must not call provider');}};
    const ai=new InvestigatorService(database,registry,new AesCredentialVault(new Uint8Array(32).fill(7)),provider,{allowedHosts:[],allowLoopback:true});
    await ai.configure(root,app,{enabled:true,externalProcessingAllowed:true,endpoint:'http://127.0.0.1:1/v1',model:'controlled-benchmark',credential:randomUUID(),monthlyTokenBudget:100000,reason:'Disposable scheduling performance fixture'});
    const schedulingStart=performance.now(),scheduled=await ai.schedule(100),schedulingMs=performance.now()-schedulingStart;
    const repeatedStart=performance.now(),repeated=await ai.schedule(100),repeatedMs=performance.now()-repeatedStart;
    expect(scheduled.scheduled).toBeGreaterThan(0);expect(repeated.scheduled).toBe(0);expect(providerCalls).toBe(0);
    await concurrentPerformance(database,registry,root,endpoint);
    console.log(JSON.stringify({event:'observability.local_performance',isolation:'DISPOSABLE_DATABASE',count,batchSize,concurrency,ingestion:{wallMs:ingestMs,eventsPerSecond:count/(ingestMs/1000),batch:summary(batchTimes)},aggregation:{events:aggregated,wallMs:aggregationMs,processCpuMs:(cpu.user+cpu.system)/1000,rssBeforeBytes:memoryBefore.rss,rssAfterBytes:memory.rss,heapBeforeBytes:memoryBefore.heapUsed,heapAfterBytes:memory.heapUsed},dashboard:summary(dashboardTimes),logicalSampling:{wallMs:storageMs,bytes:health.storage.logical_bytes,basis:health.storage.basis,scheduler:{environments:120,first:firstSampling.sampled,second:secondSampling.sampled,third:thirdSampling.sampled,wallMs:samplingMs,deadlineMs:30000}},retention:{wallMs:retentionMs,deletedEvents,targetBatches:targetRetentionBatches,fixtureQueueDrained:retentionDrained},aiScheduling:{wallMs:schedulingMs,scheduled:scheduled.scheduled,repeatedMs,repeatScheduled:repeated.scheduled,providerCalls},limits:'In-process HTTP/service measurements, not PostgreSQL CPU, production SLO, Browser offline or whole-product workflow acceptance.'}));
  }finally{await database.control(async c=>{if(samplingApp)await c.query('UPDATE observability.applications SET enabled=false WHERE id=$1',[samplingApp]);if(comparisonApp)await c.query('UPDATE observability.applications SET enabled=false WHERE id=$1',[comparisonApp]);await c.query('UPDATE observability.applications SET enabled=false WHERE id=$1',[app]);});}
}
