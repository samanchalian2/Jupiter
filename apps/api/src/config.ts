import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
let loaded = false;
export function loadLocalEnvironment() { if (loaded) return; for (const file of [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')]) if (existsSync(file)) process.loadEnvFile(file); loaded = true; }
export function databaseUrl() { loadLocalEnvironment(); return process.env.DATABASE_URL ?? 'postgresql://postgres:' + encodeURIComponent(process.env.POSTGRES_PASSWORD ?? '') + '@127.0.0.1:5433/jupiter'; }
export function jwtSecret() { loadLocalEnvironment(); return process.env.JWT_SECRET ?? randomBytes(48).toString('base64url'); }
