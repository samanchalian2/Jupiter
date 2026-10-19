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
not physical disk/index measurement. The same case creates 120 additional empty
test environments after the existing current-hour cohort is sampled. Sampling
must make bounded progress in claims of 100 then 20, return zero on a third
call, and persist exactly one sample per environment within a 30-second local
regression deadline. This checks continuation/fairness beyond one claim; the
deadline is not a production SLO. Main Jupiter write/Browser workflow overhead
remains a separate acceptance boundary. Keep these limits in reports.

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

## Concurrent aggregation and Jupiter ticket-queue boundary

The same opt-in server performance case also runs a separate disposable App with
200 HTTP events: one producer, batches of 25, 50ms inter-batch delay; one worker
claims 25 jobs and polls every 10ms while arrivals are active. It asserts actual
overlap, all 200 distinct successful jobs and five Issues with 200 occurrences.
Latency is measured from each batch's HTTP dispatch timestamp through the actual
aggregation commit. It includes serialization, network/auth/storage and backlog,
not just the aggregator function. The explicit fixture polling cadence is NOT
Jupiter's two-second worker interval or a production throughput configuration.

The API's `ticket.service.integration.spec.ts` has an additional performance-flag
case. It creates/submits one synthetic ticket through the existing supported test
tenant, then starts a random loopback Nest HTTP wrapper. The wrapper invokes the
actual TicketController, TicketActorService and TicketService. It alternates 20
baseline/observed request pairs after warming both paths. The observed path uses
the actual HubInterceptor, host requestContext resolver, JWT verification, active
user/profile and membership queries, trace creation and Node SDK queue capture.
The fixture config supplies only synthetic App/environment IDs, never a fake
actor or a replacement authorization resolver. No normal tenant guard is bypassed.

Both paths must return identical nonempty business responses. A full telemetry
queue must still allow the same authorized read, and absent/foreign membership
must still deny. The SDK has no timer, provider, credential or network flush in
this microbenchmark; it does not initialize/alter live Hub settings or authority.
Only the normal test tenant is used and existing teardown removes its data;
listeners/SDK close in finally. Ephemeral JWT signing material never leaves the
process or appears in numeric results.

This measures an actual product read-path boundary over HTTP, not every AppModule
middleware, write lifecycle, main Browser interactions or outage scenario. Point
estimates/differences are local samples, not statistically established production
overhead limits. Use the complete release gate with the performance flag enabled
to run the new case and all original ticket lifecycle/isolation regressions.
