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
Browser full-limit persistence/memory and main Jupiter workflow overhead remain
required before complete section-64 acceptance. Keep these limits in reports.
