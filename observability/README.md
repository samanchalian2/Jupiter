# Observability Hub

Product-independent packages and PostgreSQL server adapters for GOAL-069.
Implementation is IN PROGRESS; no complete platform claim is made.

## Host monitoring cadence

The Jupiter adapter accepts deployment-owned
`OBSERVABILITY_RULE_EVALUATION_INTERVAL_MS` (integer milliseconds, 10000–300000,
default 60000). Invalid/omitted values use the default without blocking product
boot. Restart the host to apply a change. The existing two-second worker drain
is non-overlapping, so this is a target cadence, not a real-time deadline.
First drain evaluates rules immediately; failed evaluations remain throttled
and do not stop other maintenance. Alerts, retention, self-monitoring, storage
sampling and Investigator scheduling keep their separate one-minute cadence.
This setting does not change AI budgets, rule thresholds/cooldowns, queue or
commercial metering. No live host setting is changed by acceptance fixtures.

The [self-metric subsystem](SELF_MONITORING.md) has scoped immutable counters,
hourly logical storage snapshots, automatic Browser/Node reporting and a Persian
ADMIN Console with actual replay/source/RTL acceptance. Server measurement and
reported SDK deltas remain separate. SCOPED_DIAGNOSTIC_METRICS is not overall
host health or whole-Goal acceptance; full performance/host audit remains.
Jupiter's eleven public educational Help guides are runtime-published through
its own Help engine; the reusable packages have no dependency on that engine.
See [LOCAL performance methodology](PERFORMANCE.md) for executed service/SDK
measurements and explicit remaining scale/workflow coverage.

Trusted critical-event detection and scoped terminal pipeline warnings use the
existing rule/inbox engines. Public health/readiness have an executable external
probe and [integration runbook](EXTERNAL_MONITORING_RUNBOOK.md), complemented by
bounded fixed-field host logs. These are not full self-metrics or installed
Staging monitoring. See DEC-042 for compatibility and recursion boundaries.

Per-Application operational retention now uses the existing durable queue,
bounded child/history batches and immutable automation Audit. See the
[retention runbook](RETENTION_RUNBOOK.md). The Console maintenance panel and
API expose queue/retention status only; they explicitly do not claim full
Hub self-monitoring or external host monitoring coverage.

The public OpenAPI 3.0.3 document is served at
`GET /api/v1/observability/openapi.json` and exported as `openApiDocument` by
`@observability/server`. Real HTTP/PostgreSQL tests exercise every documented
operation and validate requests/responses against the dereferenced schema.
Executable standard-library [Python/C# examples](examples/README.md) cover
backend authentication, batch ACKs, bounded retry and safe errors without a
Jupiter cookie or domain dependency. Actual external-client acceptance is
explicitly opt-in and must be executed before claiming that evidence.

Operational AI now has a host-injected provider/vault, Application-bound AES-GCM
credential storage, combined monthly token reservation/settlement, curated
evidence validation, deduplicated scheduler and independent Console panel.
Unknown provider usage remains held. Human reconciliation and independent
real-Browser reference/offline acceptance are implemented. Full scale/performance,
remaining host/Worker breadth and the final specification audit are unfinished; inspect Evidence, not this inventory,
before claiming complete platform delivery.

- `packages/contracts`: versioned JSON event/feedback/AI contracts and limits.
- `packages/core`: privacy, canonical digest, fingerprint, trace and lifecycle.
- `packages/browser-sdk`: bounded IndexedDB queue, memory degradation, identity
  partitioning, ACK/retry and framework-independent capture.
- `packages/react-adapter`: consumer-configured boundary/provider/route hook.
- `packages/node-sdk`: AsyncLocalStorage context, bounded batching and safe
  structured fallback.
- `packages/nestjs-adapter`: generic identity resolver/interceptor and job capture.
- `server`: independent PostgreSQL Registry/credentials/ingestion/leased queue.
- `console`: independent React Operations UI; host injects authenticated fetch
  and semantic CSS tokens. No Jupiter role/session imports.
- `examples/browser`: independent Browser/React/Node/Console reference and
  [real-browser acceptance instructions](examples/browser/README.md).

No package imports Jupiter business modules. Each package has independent
build/typecheck/test commands. Build workspace dependencies before testing a
package from a fresh checkout:

```sh
pnpm install --frozen-lockfile
pnpm prepare:observability
pnpm --filter '@observability/*' test
```

Server integration tests require a PostgreSQL administrator connection through
`OBSERVABILITY_TEST_DATABASE_URL`, `DATABASE_URL`, or local standard PG settings.
They create and remove a uniquely named `obs069_*` database, not the business
database. PostgreSQL roles created by the migration are shared cluster roles
with NOLOGIN and no business-table privileges; test databases are cleaned up.

Full requirements: `docs/GOAL_069_SPECIFICATION.md`. Actual evidence and remaining
acceptance: `docs/GOAL_069_EVIDENCE.md`.

## Explicit local Jupiter acceptance

After applying the existing forward migrations to the authorized local
database, the host adapter can be provisioned explicitly:

```sh
pnpm --filter @jupiter/api bootstrap:observability --local-acceptance --user=<existing-local-account> --local-origin=http://127.0.0.1:5174
pnpm --filter @jupiter/api dev
pnpm --filter @jupiter/web dev --host 127.0.0.1 --port 5174 --strictPort
```

The bootstrap creates no password/account, never infers a super-admin from a
product role, and writes only public Application/environment IDs to ignored
`.local/observability.json`. The command is loopback/nonproduction-only and
idempotent; its explicit authority changes are audited. AI stays disabled.
An optional `OBSERVABILITY_WORKER_ENABLED=true` in the local API process runs
the Hub aggregation/rule drain without enabling unrelated product workers.
Production uses explicit configuration and independent secret/role provisioning,
not this local convenience file. CJS Nest-to-ESM package interoperability was
tested on the local Node 24 runtime; target runtime validation remains required
before any later deployment. This Goal does not authorize deployment.

The local owner-selected provider allowlist is stored without credentials in
ignored `.local/observability-ai.json`. Production uses explicit
`OBSERVABILITY_AI_ALLOWED_HOSTS`; loopback fakes are nonproduction-only and
require `OBSERVABILITY_AI_ALLOW_LOCAL_FAKE=true`. Provider plaintext is accepted
only for encryption, never returned. A local configuration utility accepts a
bounded JSON object through stdin; never put a key in argv, tracked files or
documentation. `--monthly-budget=<units> --activate` is explicit and requires
a positive budget. Customer Commercial and Personal accounting is not involved.
