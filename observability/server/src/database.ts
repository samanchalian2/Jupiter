import { Pool, type PoolClient, type PoolConfig } from 'pg';
import type { IdentityScope } from '@observability/contracts';
export interface DataScope extends IdentityScope {tenantAll?:boolean;actorAll?:boolean;}
/** A generic DB adapter: the caller supplies configuration, not a Jupiter service. */
export class HubDatabase {
  readonly pool:Pool;
  constructor(configuration:PoolConfig){this.pool=new Pool({...configuration,max:configuration.max??4,connectionTimeoutMillis:configuration.connectionTimeoutMillis??5000});}
  async control<T>(work:(client:PoolClient)=>Promise<T>):Promise<T>{return this.transaction(work);}
  async scoped<T>(scope:DataScope,work:(client:PoolClient)=>Promise<T>):Promise<T>{
    return this.transaction(async client=>{await client.query('SET LOCAL ROLE observability_runtime');await client.query("SELECT set_config('obs.applications',$1,true),set_config('obs.environment',$2,true),set_config('obs.tenant',$3,true),set_config('obs.tenant_all',$4,true),set_config('obs.actor',$5,true),set_config('obs.actor_all',$6,true)",[scope.applicationId,scope.environmentId,scope.tenantReference??'',scope.tenantAll?'true':'false',scope.actorReference??'',scope.actorAll?'true':'false']);return work(client);});
  }
  async worker<T>(work:(client:PoolClient)=>Promise<T>):Promise<T>{return this.transaction(async client=>{await client.query('SET LOCAL ROLE observability_worker');return work(client);});}
  private async transaction<T>(work:(client:PoolClient)=>Promise<T>):Promise<T>{const client=await this.pool.connect();try{await client.query('BEGIN');await client.query("SET LOCAL statement_timeout='10s'");const result=await work(client);await client.query('COMMIT');return result;}catch(error){await client.query('ROLLBACK').catch(()=>undefined);throw error;}finally{client.release();}}
  async close(){await this.pool.end();}
}
