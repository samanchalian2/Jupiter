import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { expect } from 'vitest';
import { HubDatabase, RegistryService, IssueEngine } from '../src/index.js';
import type { TelemetryEvent } from '@observability/contracts';

/** Disposable fixture only: real ingestion HTTP and a simultaneously polling worker. */
export async function concurrentPerformance(database:HubDatabase,registry:RegistryService,root:string,endpoint:string){
 const app=(await registry.createApplication(root,{slug:`concurrent-${randomUUID()}`,name:'LOCAL concurrent latency'})).id;
 const env=(await registry.createEnvironment(root,app,{key:'concurrent',kind:'TEST'})).id;
 const credential=await registry.issueServerCredential(root,app,env,'Disposable concurrent ingestion measurement');
 const engine=new IssueEngine(database,registry),worker=randomUUID(),count=200,latencies:number[]=[],startedById=new Map<string,number>();
 let producerDone=false,aggregatedWhileProducing=0,aggregated=0,emptyPolls=0;const started=performance.now();
 try{
  const producer=(async()=>{try{
   for(let offset=0;offset<count;offset+=25){
    const events:TelemetryEvent[]=Array.from({length:25},(_,index)=>({schemaVersion:'1.1',eventId:randomUUID(),applicationId:app,environmentId:env,occurredAt:new Date().toISOString(),source:'SERVER',category:'BACKEND',severity:'ERROR',eventCode:'concurrent.failure',normalizedMessage:'Controlled concurrent failure',operationName:`operation-${(offset+index)%5}`,tenantReference:null,actorReference:null}));
    const dispatchAt=performance.now();events.forEach(event=>startedById.set(event.eventId,dispatchAt));
    const response=await fetch(`${endpoint}/events/batch`,{method:'POST',headers:{authorization:`Bearer ${credential.token}`,'content-type':'application/json'},body:JSON.stringify({events})});
    expect(response.status).toBe(200);const ack=await response.json();expect(ack.acknowledgements).toHaveLength(25);expect(ack.acknowledgements.every((row:{status:string})=>row.status==='ACCEPTED')).toBe(true);
    // A stated, repeatable arrival cadence, not an altered production worker timer.
    await new Promise(done=>setTimeout(done,50));
   }
  }finally{producerDone=true;}})();
  const consumer=(async()=>{
   while(true){
    if(performance.now()-started>60000)throw Error('Concurrent fixture deadline exceeded');
    const jobs=await engine.queue.claim(worker,25,['AGGREGATE']);
    if(!jobs.length){if(producerDone)return;emptyPolls++;await new Promise(done=>setTimeout(done,10));continue;}
    for(const job of jobs){expect(job.application_id).toBe(app);const dispatched=startedById.get(job.event_id!);expect(dispatched).toBeDefined();expect(await engine.aggregate(job)).toBe(true);latencies.push(performance.now()-dispatched!);aggregated++;if(!producerDone)aggregatedWhileProducing++;}
   }
  })();
  const settled=await Promise.allSettled([producer,consumer]);for(const result of settled)if(result.status==='rejected')throw result.reason;
  expect(aggregated).toBe(count);expect(aggregatedWhileProducing).toBeGreaterThan(0);latencies.sort((a,b)=>a-b);
  const rows=await database.worker(async c=>{
   const jobs=(await c.query(`SELECT count(*)::int total,count(*) FILTER(WHERE status='SUCCEEDED')::int completed,count(DISTINCT event_id)::int distinct_events FROM observability.jobs WHERE application_id=$1 AND environment_id=$2 AND kind='AGGREGATE'`,[app,env])).rows[0];
   const issues=(await c.query('SELECT count(*)::int total,sum(occurrence_count)::int occurrences FROM observability.issues WHERE application_id=$1 AND environment_id=$2',[app,env])).rows[0];
   return{jobs,issues};
  });
  expect(rows.jobs).toEqual({total:count,completed:count,distinct_events:count});expect(rows.issues).toEqual({total:5,occurrences:count});
  console.log(JSON.stringify({event:'observability.local_concurrent_aggregation',count,batchSize:25,producerCount:1,workerCount:1,pollMs:10,interBatchDelayMs:50,claimSize:25,wallMs:performance.now()-started,aggregatedWhileProducing,emptyPolls,dispatchToCommittedAggregation:{samples:latencies.length,p50Ms:latencies[99],p95Ms:latencies[189],maxMs:latencies[199]},jobs:rows.jobs,issues:rows.issues,limits:'LOCAL synthetic HTTP dispatch to aggregate commit; one event in a batch shares dispatch time. Includes serialization/network/auth/DB/polling/backlog. Not the Jupiter two-second worker cadence, separate-process CPU or production SLO.'}));
 }finally{await database.control(c=>c.query('UPDATE observability.applications SET enabled=false WHERE id=$1',[app]));}
}
