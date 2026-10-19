import { performance } from 'node:perf_hooks';
import { NodeSdk } from '../src/index.js';
export function measureNodeCapture() {
  const sdk = new NodeSdk({ endpoint: 'http://127.0.0.1:1', applicationId: '11111111-1111-4111-8111-111111111111', environmentId: '22222222-2222-4222-8222-222222222222', credentialProvider: async () => null, fallback: () => undefined, reportMetrics: false });
  const input = { category: 'BACKEND', severity: 'ERROR', eventCode: 'benchmark.controlled', normalizedMessage: 'Controlled bounded SDK measurement', operationName: 'GET /benchmark' } as const;
  for (let index = 0; index < 500; index++) sdk.capture(input);
  const times: number[] = [];
  const before = process.memoryUsage(); const cpu = process.cpuUsage();
  for (let index = 0; index < 1000; index++) { const start = performance.now(); sdk.capture(input); times.push(performance.now() - start); }
  const after = process.memoryUsage(), used = process.cpuUsage(cpu);
  times.sort((a,b) => a-b);
  return { label: 'LOCAL_NODE_SDK_SATURATED_QUEUE', samples: times.length, queued: sdk.stats().queued, dropped: sdk.stats().dropped, captureP50Ms: times[499], captureP95Ms: times[949], captureMaxMs: times[999], cpuMs: (used.user + used.system) / 1000, heapDeltaBytes: after.heapUsed-before.heapUsed, rssDeltaBytes: after.rss-before.rss, note: 'Process memory deltas include allocation/GC noise; no provider or network calls.' };
}
console.log(JSON.stringify(measureNodeCapture()));
