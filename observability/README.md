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
