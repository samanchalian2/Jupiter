const baseUrl = process.env.JUPITER_BASE_URL ?? 'http://127.0.0.1:3000/api/v1';
const requests = Number(process.env.LOAD_SMOKE_REQUESTS ?? 40);
const concurrency = Number(process.env.LOAD_SMOKE_CONCURRENCY ?? 8);
if (!Number.isInteger(requests) || !Number.isInteger(concurrency) || requests < 1 || concurrency < 1) throw new Error('LOAD_SMOKE_REQUESTS and LOAD_SMOKE_CONCURRENCY must be positive integers');

const startedAt = performance.now();
let next = 0;
const failures = [];
async function worker() {
  while (next < requests) {
    const current = next++;
    const path = current % 2 === 0 ? '/health' : '/health/ready';
    try {
      const response = await fetch(`${baseUrl}${path}`);
      if (!response.ok) failures.push({ path, status: response.status });
    } catch (error) { failures.push({ path, error: error instanceof Error ? error.message : 'request failed' }); }
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, requests) }, worker));
const durationMs = Math.round(performance.now() - startedAt);
const result = { event: 'load.smoke', baseUrl, requests, concurrency, durationMs, requestsPerSecond: Math.round((requests / durationMs) * 1000), failures };
console.log(JSON.stringify(result));
if (failures.length) process.exitCode = 1;
