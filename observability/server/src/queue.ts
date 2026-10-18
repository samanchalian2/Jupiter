import type { PoolClient } from 'pg';
import { HubDatabase } from './database.js';
import { ContractError } from '@observability/contracts';
import { retryDelay } from '@observability/core';
export interface LeasedJob {id:string;application_id:string;environment_id:string;tenant_reference:string|null;event_id:string|null;kind:string;dedupe_key:string;attempts:number;lease_owner:string;}
export class DurableQueue {
  constructor(private readonly database:HubDatabase){}
  async claim(workerId:string,limit=10,kinds?:readonly string[]):Promise<LeasedJob[]>{
    if(!/^[0-9a-f-]{36}$/i.test(workerId))throw new ContractError('INVALID_WORKER_ID');limit=Math.min(50,Math.max(1,Math.trunc(limit)));
    return this.database.worker(async c=>{
      await c.query(`UPDATE observability.jobs SET status='FAILED',lease_owner=NULL,lease_until=NULL,completed_at=now(),failure_code='RETRY_EXHAUSTED' WHERE status='RUNNING' AND lease_until<=now() AND attempts>=12`);
      return (await c.query<LeasedJob>(`WITH candidate AS (SELECT id FROM observability.jobs WHERE ((status='PENDING' AND available_at<=now()) OR (status='RUNNING' AND lease_until<=now())) AND attempts<12 AND ($3::text[] IS NULL OR kind=ANY($3::text[])) ORDER BY available_at,created_at,id FOR UPDATE SKIP LOCKED LIMIT $1) UPDATE observability.jobs j SET status='RUNNING',lease_owner=$2,lease_until=now()+interval '2 minutes',attempts=attempts+1 FROM candidate WHERE j.id=candidate.id RETURNING j.*`,[limit,workerId,kinds??null])).rows;
    });
  }
  async complete(job:LeasedJob,work?:(client:PoolClient)=>Promise<void>):Promise<boolean>{
    return this.database.worker(async c=>{
      const owned=await c.query(`SELECT 1 FROM observability.jobs WHERE id=$1 AND lease_owner=$2 AND application_id=$3 AND environment_id=$4 AND tenant_reference IS NOT DISTINCT FROM $5 AND event_id IS NOT DISTINCT FROM $6 AND kind=$7 AND dedupe_key=$8 AND status='RUNNING' AND lease_until>now() FOR UPDATE`,[job.id,job.lease_owner,job.application_id,job.environment_id,job.tenant_reference,job.event_id,job.kind,job.dedupe_key]);if(!owned.rowCount)return false;
      // Consumer aggregation and job completion share a single transaction.
      if(work)await work(c);
      await c.query(`UPDATE observability.jobs SET status='SUCCEEDED',completed_at=now(),lease_owner=NULL,lease_until=NULL WHERE id=$1 AND lease_owner=$2`,[job.id,job.lease_owner]);return true;
    });
  }
  async fail(job:LeasedJob,failureCode:string):Promise<boolean>{
    if(!/^[A-Z0-9_]{1,100}$/.test(failureCode))throw new ContractError('INVALID_JOB_FAILURE_CODE');
    return this.database.worker(async c=>Boolean((await c.query(`UPDATE observability.jobs SET status=CASE WHEN attempts>=12 THEN 'FAILED' ELSE 'PENDING' END,available_at=now()+($3::int*interval '1 millisecond'),completed_at=CASE WHEN attempts>=12 THEN now() ELSE NULL END,lease_owner=NULL,lease_until=NULL,failure_code=$4 WHERE id=$1 AND lease_owner=$2 AND application_id=$5 AND environment_id=$6 AND tenant_reference IS NOT DISTINCT FROM $7 AND event_id IS NOT DISTINCT FROM $8 AND kind=$9 AND dedupe_key=$10 AND status='RUNNING' AND lease_until>now()`,[job.id,job.lease_owner,retryDelay(job.attempts),failureCode,job.application_id,job.environment_id,job.tenant_reference,job.event_id,job.kind,job.dedupe_key])).rowCount));
  }
}
