import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient, QueryResultRow } from 'pg';
import { databaseUrl } from '../config.js';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool = new Pool({ connectionString: databaseUrl() });
  query<T extends QueryResultRow>(text: string, values: unknown[] = []) { return this.pool.query<T>(text, values); }
  async transaction<T>(work: (client: PoolClient) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  async withOrganization<T>(organizationId: string, work: (client: PoolClient) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET LOCAL ROLE jupiter_app');
      await client.query('SELECT set_config($1, $2, true)', ['app.organization_id', organizationId]);
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  async onModuleDestroy() { await this.pool.end(); }
}
