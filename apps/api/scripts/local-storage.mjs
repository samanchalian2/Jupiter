import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { CreateBucketCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';

const root = resolve(import.meta.dirname, '..', '..', '..');
const envFile = resolve(root, '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const endpoint = process.env.S3_ENDPOINT;
const bucket = process.env.S3_BUCKET;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) throw new Error('Local S3 settings are incomplete. Configure S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY in .env.');

const address = new URL(endpoint);
if (!['127.0.0.1', 'localhost', '::1'].includes(address.hostname)) throw new Error('The local storage helper only supports a loopback S3 endpoint.');
const healthUrl = new URL('/minio/health/live', address).toString();
const healthy = async () => {
  try { return (await fetch(healthUrl)).ok; } catch { return false; }
};

if (!await healthy()) {
  const minio = process.env.MINIO_BIN || resolve(homedir(), '.local', 'bin', process.platform === 'win32' ? 'minio.exe' : 'minio');
  if (!existsSync(minio)) throw new Error('MinIO is not available. Set MINIO_BIN to its executable path before running pnpm dev:storage.');
  const dataDir = process.env.LOCAL_MINIO_DATA_DIR || resolve(root, '.local', 'minio-data');
  const port = address.port || (address.protocol === 'https:' ? '443' : '80');
  const numericPort = Number(port);
  const child = spawn(minio, ['server', dataDir, '--address', `:${port}`, '--console-address', `:${numericPort + 1}`], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    env: { ...process.env, MINIO_ROOT_USER: process.env.MINIO_ROOT_USER || accessKeyId, MINIO_ROOT_PASSWORD: process.env.MINIO_ROOT_PASSWORD || secretAccessKey },
  });
  child.unref();
  for (let attempt = 0; attempt < 30 && !await healthy(); attempt += 1) await new Promise((done) => setTimeout(done, 250));
  if (!await healthy()) throw new Error('MinIO did not become healthy on the configured S3 endpoint.');
}

const client = new S3Client({ region: process.env.S3_REGION || 'us-east-1', endpoint, forcePathStyle: true, credentials: { accessKeyId, secretAccessKey } });
try { await client.send(new HeadBucketCommand({ Bucket: bucket })); }
catch (error) {
  const status = error?.$metadata?.httpStatusCode;
  if (status !== 404 && status !== 400) throw error;
  await client.send(new CreateBucketCommand({ Bucket: bucket }));
}
console.log(`Local object storage is ready for bucket ${bucket}.`);
