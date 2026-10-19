# LOCAL performance acceptance

This is repeatable measurement, not a production capacity/SLO certificate.
Actual measurements and remaining scope live in `docs/GOAL_069_EVIDENCE.md`.

## Node capture hot path

From the repository root, with workspace dependencies installed:

```powershell
pnpm --filter @jupiter/api exec tsx ../../observability/packages/node-sdk/test/performance.ts
```

The executable imports only the independent Node SDK. It fills its normal
500-event queue, then measures 1,000 saturated capture calls with a no-op fallback
and no network/provider. It records nearest-rank p50/p95/max, process CPU and
heap/RSS deltas; GC and machine contention affect deltas. This does not measure
the application's logging sink, Browser IndexedDB or main-product latency.

## Real PostgreSQL/HTTP service load

First verify the configured connection targets your intended LOCAL PostgreSQL
instance; never print or paste its credentials into results. The existing server
test harness needs create/drop-database authority and uses only its uniquely
named disposable `obs069_*` database for migrations and synthetic load.

```powershell
$env:OBSERVABILITY_PERFORMANCE_ACCEPTANCE='true'
pnpm --filter @observability/server exec vitest run test/persistence.integration.test.ts -t 'measures actual HTTP batch'
```

This focused invocation executes one measurement case, not the filtered-out
regression cases. For full release acceptance keep this flag enabled alongside
the existing real Browser/reference-client flags and run `pnpm verify:release`.
Do not count optional cases as executed when their flags are disabled.

The case sends 1,000 actual HTTP events in batches of 50 at concurrency two,
checks every ACK, drains real aggregation leases sequentially in claims of 25,
checks the dashboard cohort across 20 HTTP queries, samples scoped logical row
bytes, ages/deletes 100 fixture events with real retention, and measures AI
scheduling/idempotency. Its in-process provider must receive zero calls. No live
provider, commercial allowance or business data is loaded. No credential, payload
or generated synthetic identity is printed in the numeric result.

Measured worker CPU/memory belongs to the shared test Node process, not a separate
worker or PostgreSQL. Ingestion and aggregation are separate phases; aggregation
wall time is not concurrent arrival-to-Issue latency. Logical byte scanning is
not physical disk/index measurement. Larger-scale scan cost/fairness/deadlines,
main Jupiter workflow overhead remain required before complete section-64
acceptance. Keep these limits in reports.

## Full-limit offline Browser fixture

Enable both flags for the actual installed Browser flow:

```powershell
$env:OBSERVABILITY_PERFORMANCE_ACCEPTANCE='true'
$env:OBSERVABILITY_BROWSER_ACCEPTANCE='true'
$env:OBSERVABILITY_BROWSER_CHANNEL='msedge'
pnpm --filter @observability/server exec vitest run test/persistence.integration.test.ts -t 'real independent Browser acceptance'
```

The opt-in flow serves development-only `examples/browser/performance.html` on
the random authenticated reference origin. It uses the normal default count and
byte caps, real IndexedDB and actual browser offline mode; no `.start()` hooks
or automated background flush are included in the microbenchmark. Explicit
capture/manual flush isolates that SDK path. Both a 500-event small-payload
queue and a byte-limited large UTF-8 payload queue survive reload/renewal and
must deliver every original ID exactly once to the disposable database.

All outbound batch attempts are inspected for the existing count AND UTF-8 byte
limits, including failures. Observing only successful responses can conceal an
oversized batch that eventually splits by retry timing. Exact data-envelope and
separate diagnostic-journal caps are checked before/after replay.

Reported capture times include asynchronous IndexedDB waits. CDP heap is a point
sample, not peak/retained memory or browser process RSS. CDP task/script duration
differences include the fixture UI during fill, not isolated SDK CPU. This adds
bounded full-limit Browser evidence, not Jupiter workflow latency, automatic
handler overhead or proof of larger-scale storage sampling safety.
