import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
let loaded = false;
export function loadLocalEnvironment() { if (loaded) return; for (const file of [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')]) if (existsSync(file)) process.loadEnvFile(file); loaded = true; }
export function databaseUrl() { loadLocalEnvironment(); return process.env.DATABASE_URL ?? 'postgresql://postgres:' + encodeURIComponent(process.env.POSTGRES_PASSWORD ?? '') + '@127.0.0.1:5432/jupiter'; }
export function jwtSecret() { loadLocalEnvironment(); return process.env.JWT_SECRET ?? randomBytes(48).toString('base64url'); }
export function attachmentStorageConfig() { loadLocalEnvironment(); return { endpoint: process.env.S3_ENDPOINT, region: process.env.S3_REGION ?? 'us-east-1', bucket: process.env.S3_BUCKET ?? '', accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY }; }
export function aiCredentialEncryptionKey() {
  loadLocalEnvironment();
  const encoded = process.env.AI_CREDENTIAL_ENCRYPTION_KEY?.trim();
  if (!encoded) return undefined;
  const key = Buffer.from(encoded, 'base64');
  return key.length === 32 && key.toString('base64').replace(/=+$/, '') === encoded.replace(/=+$/, '') ? key : undefined;
}

export function aiProviderAllowedHosts() {
  loadLocalEnvironment();
  return new Set((process.env.AI_PROVIDER_ALLOWED_HOSTS ?? 'api.openai.com').split(',').map((host) => host.trim().toLowerCase()).filter(Boolean));
}
