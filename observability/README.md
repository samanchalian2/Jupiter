# Observability Hub

Product-independent packages and PostgreSQL server adapters for GOAL-069.
Implementation is IN PROGRESS; no complete platform claim is made.

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
