import { Client } from 'pg';
import { databaseUrl, loadLocalEnvironment } from '../src/config.js';
import { hashPassword } from '../src/auth/password.js';
async function main() {
  loadLocalEnvironment();
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@jupiter.local';
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? process.env.POSTGRES_PASSWORD;
  if (!password) throw new Error('Set BOOTSTRAP_ADMIN_PASSWORD in local .env.');
  const client = new Client({ connectionString: databaseUrl() }); await client.connect();
  try { const username = email.toLowerCase().split('@')[0]; await client.query('INSERT INTO users(email,username,display_name,password_hash,is_platform_admin) VALUES($1,$2,$3,$4,true) ON CONFLICT(email) DO UPDATE SET username=COALESCE(users.username,EXCLUDED.username),password_hash=EXCLUDED.password_hash,is_platform_admin=true', [email, username, 'Jupiter Platform Admin', await hashPassword(password)]); console.log('Bootstrap platform admin is ready.'); }
  finally { await client.end(); }
}
void main();
