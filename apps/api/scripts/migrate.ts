import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Client } from 'pg';
import { databaseUrl, loadLocalEnvironment } from '../src/config.js';
async function main() {
loadLocalEnvironment();
const client = new Client({ connectionString: databaseUrl() });
await client.connect();
try {
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const directory = join(import.meta.dirname, '../migrations');
  for (const file of (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort()) {
    if ((await client.query('SELECT 1 FROM schema_migrations WHERE name=$1', [file])).rowCount) continue;
    await client.query('BEGIN');
    try { await client.query(await readFile(join(directory, file), 'utf8')); await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [file]); await client.query('COMMIT'); console.log('Applied ' + file); }
    catch (error) { await client.query('ROLLBACK'); throw error; }
  }
} finally { await client.end(); }
}
void main();
