import { join } from 'node:path';
import { Pool } from 'pg';
import { databaseUrl, loadLocalEnvironment } from '../src/config.js';
import { seedHelpRepository } from '../src/help/help-seed.js';

async function main() {
  loadLocalEnvironment();
  const pool = new Pool({ connectionString: databaseUrl() });
  try {
    const results = await seedHelpRepository(pool, join(import.meta.dirname, '../../../docs/help'));
    console.log(`Product Help seed complete: ${results.filter(item => item.created).length} created, ${results.filter(item => !item.created).length} unchanged.`);
  } finally { await pool.end(); }
}
void main();
