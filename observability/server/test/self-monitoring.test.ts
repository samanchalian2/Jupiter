import {describe,it,expect,vi} from 'vitest';
import {SelfMonitoringService} from '../src/self-monitoring.js';
import type {HubDatabase} from '../src/database.js';
import {IngestionService} from '../src/ingestion.js';
const scope=()=>({applicationId:crypto.randomUUID(),environmentId:crypto.randomUUID()});
const ack={schemaVersion:'1.1' as const,acknowledgements:[{eventId:crypto.randomUUID(),status:'ACCEPTED' as const}]};
describe('bounded out-of-band self-metric buffer',()=>{
 it('rotates past a failed scope, shares concurrent passes and retries without inventing snapshots',async()=>{
  const a=scope(),b=scope(),rows=[{application_id:a.applicationId,id:a.environmentId},{application_id:b.applicationId,id:b.environmentId}],stored:string[]=[],cursors:unknown[]=[],logs:unknown[]=[];
  const database={worker:async(work:(c:unknown)=>Promise<unknown>)=>work({query:async(sql:string,args:unknown[]=[])=>{
   if(sql.includes('SELECT e.application_id')){cursors.push(args);const start=args[2]===a.environmentId?1:0;return{rows:[rows[start]]};}
   if(sql.includes('pg_try_advisory'))return{rows:[{locked:true}]};
   if(sql.startsWith('SELECT 1 FROM observability.storage_samples'))return{rowCount:0,rows:[]};
   if(sql.includes('sum(bytes)')){if(args[1]===a.environmentId)throw Error('private sampler outage');return{rows:[{total:'100'}]};}
   if(sql.startsWith('INSERT INTO observability.storage_samples'))stored.push(String(args[1]));return{rows:[],rowCount:1};
  }})} as unknown as HubDatabase;
  const metrics=new SelfMonitoringService(database,undefined,entry=>logs.push(entry));const first=metrics.sampleStorage(1),same=metrics.sampleStorage(1);expect(first).toBe(same);expect(await first).toEqual({sampled:0,failed:1,deferred:0});expect(await metrics.sampleStorage(1)).toEqual({sampled:1,failed:0,deferred:0});expect(stored).toEqual([b.environmentId]);expect(cursors[1]).toEqual([1,a.applicationId,a.environmentId]);expect(JSON.stringify(logs)).not.toContain('private');
 });
 it('skips contended scope locks without scanning and keeps successful scopes measurable',async()=>{
  const a=scope(),b=scope(),scanned:string[]=[];const database={worker:async(work:(c:unknown)=>Promise<unknown>)=>work({query:async(sql:string,args:unknown[]=[])=>{
   if(sql.includes('SELECT e.application_id'))return{rows:[{application_id:a.applicationId,id:a.environmentId},{application_id:b.applicationId,id:b.environmentId}]};
   if(sql.includes('pg_try_advisory'))return{rows:[{locked:!String(args[0]).includes(a.environmentId)}]};
   if(sql.startsWith('SELECT 1 FROM'))return{rowCount:0};if(sql.includes('sum(bytes)')){scanned.push(String(args[1]));return{rows:[{total:'12'}]};}return{rowCount:1,rows:[]};
  }})} as unknown as HubDatabase;
  expect(await new SelfMonitoringService(database).sampleStorage()).toEqual({sampled:1,failed:0,deferred:1});expect(scanned).toEqual([b.environmentId]);
 });
 it('starts no more scopes after the cooperative work budget and advances its cursor',async()=>{
  let elapsed=0;const clock=vi.spyOn(performance,'now').mockImplementation(()=>elapsed),a=scope(),b=scope();let scans=0;
  const database={worker:async(work:(c:unknown)=>Promise<unknown>)=>work({query:async(sql:string)=>{
   if(sql.includes('SELECT e.application_id'))return{rows:[{application_id:a.applicationId,id:a.environmentId},{application_id:b.applicationId,id:b.environmentId}]};
   if(sql.includes('pg_try_advisory'))return{rows:[{locked:true}]};if(sql.startsWith('SELECT 1 FROM'))return{rowCount:0};if(sql.includes('sum(bytes)')){scans++;elapsed=5001;return{rows:[{total:'10'}]};}return{rowCount:1,rows:[]};
  }})} as unknown as HubDatabase;
  try{expect(await new SelfMonitoringService(database).sampleStorage()).toEqual({sampled:1,failed:0,deferred:1});expect(scans).toBe(1);}finally{clock.mockRestore();}
 });
 it('does not multiply a storage outage timeout by every event in a batch',async()=>{
  let attempts=0;const database={scoped:async()=>{attempts++;throw Error('Controlled storage failure');}} as unknown as HubDatabase,metrics={record:()=>{}} as unknown as SelfMonitoringService,service=new IngestionService(database,metrics),s={...scope(),tenantReference:null,actorReference:null,source:'SERVER' as const};
  const events=Array.from({length:50},()=>({eventId:crypto.randomUUID(),schemaVersion:'1.1',applicationId:s.applicationId,environmentId:s.environmentId,occurredAt:new Date().toISOString(),source:'SERVER',category:'BACKEND',severity:'ERROR',eventCode:'controlled.failure',normalizedMessage:'Controlled event'}));
  const result=await service.ingest({events},s);expect(attempts).toBe(1);expect(result.acknowledgements).toHaveLength(50);expect(result.acknowledgements.every(item=>item.status==='RETRYABLE')).toBe(true);expect(result.acknowledgements.map(item=>item.eventId)).toEqual(events.map(item=>item.eventId));
 });
 it('recovers the same idempotent report after storage failure without logging raw errors',async()=>{
  const time=vi.spyOn(Date,'now').mockReturnValue(0),attempts:unknown[][]=[],logs:unknown[]=[];let failed=true;
  const database={worker:async(work:(c:unknown)=>Promise<unknown>)=>work({query:async(_sql:string,args:unknown[])=>{attempts.push(args);if(failed)throw Error('controlled private failure text');return{rowCount:1};}})} as unknown as HubDatabase;
  try{const metrics=new SelfMonitoringService(database,undefined,entry=>logs.push(entry));metrics.record(scope(),ack);await metrics.flush();expect(logs).toEqual([{event:'observability.diagnostic',code:'METRICS_STORAGE_UNAVAILABLE',severity:'WARNING'}]);expect(JSON.stringify(logs)).not.toContain('private');await metrics.flush();expect(attempts).toHaveLength(1);failed=false;time.mockReturnValue(60001);await metrics.flush();expect(attempts).toHaveLength(2);expect(attempts[1]).toEqual(attempts[0]);}finally{time.mockRestore();}
 });
 it('does not get stuck after flushing an empty buffer and continues measuring later ingestion',async()=>{
  const reports:unknown[][]=[],database={worker:async(work:(c:unknown)=>Promise<unknown>)=>work({query:async(_sql:string,args:unknown[])=>{reports.push(args);return{rowCount:1};}})} as unknown as HubDatabase,metrics=new SelfMonitoringService(database);
  await metrics.flush();metrics.record(scope(),ack);await metrics.flush();await metrics.flush();metrics.record(scope(),ack);await metrics.flush();expect(reports).toHaveLength(2);
 });
 it('bounds cardinality during outages and reports metric loss out-of-band rather than growing indefinitely',async()=>{
  const time=vi.spyOn(Date,'now').mockReturnValue(0),logs:unknown[]=[],reports:unknown[][]=[];let failed=true;
  const database={worker:async(work:(c:unknown)=>Promise<unknown>)=>work({query:async(_sql:string,args:unknown[])=>{if(failed)throw Error('controlled outage');reports.push(args);return{rowCount:1};}})} as unknown as HubDatabase;
  try{const metrics=new SelfMonitoringService(database,undefined,entry=>logs.push(entry));for(let i=0;i<1000;i++)metrics.record(scope(),ack);await metrics.flush();expect(logs).toContainEqual({event:'observability.diagnostic',code:'METRICS_BUFFER_FULL',severity:'WARNING'});failed=false;time.mockReturnValue(60001);await metrics.flush();await metrics.flush();expect(reports.length).toBeLessThanOrEqual(200);expect(reports.length).toBeGreaterThan(0);}finally{time.mockRestore();}
 });
});
