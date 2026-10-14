# GOAL-069 — Observability Hub Evidence

Status: IN PROGRESS. Owner-approved plan supersedes the stale GOAL-060 identifier
in the supplied specification. GOAL-060 Personal Service history is preserved.
GOAL-059 remains BLOCKED; LOCAL evidence is not staging acceptance.

## Architecture inventory (Phase A)

| Surface | Actual implementation | Integration decision |
| --- | --- | --- |
| API | NestJS modular monolith, `/api/v1`, Express middleware | additive Hub host/adapters |
| Web | React 19/Vite, App request wrapper, additional direct fetch clients | generic Browser SDK and explicit instrumentation |
| Logging | JSON request completion stdout; raw originalUrl | sanitize route/query; preserve business responses |
| Exceptions | Nest default handling; no global Hub filter | additive capture filter/interceptor |
| Request correlation | x-request-id or UUID | validate and add W3C context |
| React boundary | no global Error Boundary | reusable React adapter |
| Worker | QueueWorker polls PostgreSQL; lifecycle interval | isolated Hub leased jobs |
| Redis/BullMQ | mentioned in architecture, absent from dependencies/executable workers | no added service; PostgreSQL queue |
| Database | pg Pool; migration runner; SET LOCAL ROLE jupiter_app | dedicated Hub schema/RLS/role |
| Identity | global User/JWT; tenant membership resolution | generic principal adapter, no core User FK |
| Notifications | persistent tenant inbox + process-local RxJS stream | delivery port; operational inbox for tenant-free operators |
| AI | OpenAI-compatible HTTP adapters with ticket-specific schemas | distinct Investigator schema/port and budget |
| Commercial | delivered Smart Actions; organization/personal capacity | no operations charge to either customer pool |
| Help | versioned runtime catalog + difference-aware publication | local published Hub/domain guides |
| UI | DS V2, Lavender/Beige, Shabnam, RTL shell/drawer | theme/component injection |
| Tests | Vitest API/Web; no Browser offline suite | SDK tests + real network-intercepted E2E |

## Acceptance ledger

Every requirement remains pending unless actual execution evidence is recorded.

| Phase | Required delivery | State |
| --- | --- | --- |
| A | inventory, ADR, approved specification | initial inventory/DEC-038/source recorded |
| B | independent packages, registry/auth/contracts/OpenAPI | package/registry/auth foundation implemented; HTTP/OpenAPI pending |
| C | schema/RLS, atomic ingestion, browser/API/worker capture | PostgreSQL foundation verified; product capture integration pending |
| D | IndexedDB/replay/backoff/logout/scope isolation | SDK protocol verified; real-browser IndexedDB/replay pending |
| E | fingerprint, issues/incidents/rules/alerts | pending |
| F | feedback/user tracking, Console/live/analytics/export | pending |
| G | evidence-grounded AI, opt-in/budget/schedule/security | pending |
| H | independent second application, C#/Python clients | pending |
| I | retention, self-health/runbook, Help, full QC/cleanup | pending |

## Required evidence sections

1. Architecture inventory; 2. Product-agnostic architecture; 3. Package
boundaries; 4. Registry; 5. Event contract; 6. OpenAPI; 7. SDK authentication;
8. Database model; 9. Migrations; 10. Scope isolation; 11. Browser SDK;
12. React adapter; 13. Node SDK; 14. Nest adapter; 15. C#/Python examples;
16. IndexedDB; 17. Retry/idempotency; 18. Privacy; 19. Correlation;
20. Ingestion reliability; 21. Fingerprinting; 22. Issues; 23. Incidents;
24. Rules; 25. Console; 26. Feedback; 27. Analytics; 28. Investigator;
29. AI security; 30. Budget; 31. Alerts; 32. Retention; 33. Self-health;
34. Reference client; 35. Reusability acceptance; 36. Cross-Application denial;
37. Real offline browser tests; 38. Security tests; 39. LOCAL performance;
40. Responsive RTL acceptance; 41. Help publication; 42. Limitations;
43. Defects found; 44. Defects fixed; 45. Cleanup; 46. Quality gates;
47. Final verdict.

## Owner decisions

- GOAL-069; PostgreSQL existing infrastructure.
- Bootstrap only the parameter-selected existing local admin; auditable,
  idempotent, no hard-coded identity, no automatic super-admin expansion.
- Jupiter Platform Admin scope is Jupiter; other application grants explicit.
- All authenticated users can submit/track their own feedback without tenant
  membership; Application B identities come from its trusted backend.
- No anonymous feedback in V1; API authentication adapter remains extensible.
- Technical feedback may be AI analyzed with the approved notice and targeted
  redaction; application can forbid external AI.
- AI defaults disabled. Explicit provider/model/budget/activation; atomic input
  plus output token budget, autonomous schedules after activation; independent
  accounting, no credential disclosure.
- Commit and push only this Goal's changes, verify remote SHA; no host promotion.

## Final verdict

IN PROGRESS. Full implementation and acceptance are not yet established.

## Foundation checkpoint — LOCAL, 2026-10-14

- Six independently built/tested packages: contracts, core, browser-sdk,
  node-sdk, react-adapter, nestjs-adapter. React depends only on Browser SDK;
  runtime packages import no Jupiter business code.
- `observability/server` implements generic Registry/principals/application
  grants, super-admin bootstrap/transfer/revocation protection, scoped hashed
  server credentials, browser minting, immediate parent revocation and rotation.
- Migration `063_observability_foundation.sql` introduces typed event storage,
  receipts and outbox jobs with composite scopes, dedicated NOLOGIN runtime/
  worker roles and RLS. The business database has not received this migration.
- Real PostgreSQL acceptance creates an isolated `obs069_*` database, applies
  the migration, verifies behavior and terminates/drops only that database.
  The cluster-level NOLOGIN roles remain for reuse and have no business-table
  grants. No target server or co-hosted application was changed.
- Eight simultaneous deliveries of one event produce exactly one event,
  receipt and job; changed payload conflicts. Partial ACK, scope impersonation,
  cross-Application/tenant isolation and immutable runtime data are tested.
- Queue tests verify parallel claim exclusivity, stale lease denial, crash
  recovery and transactional aggregation-completion rollback.
- SDK protocol tests cover targeted redaction, stable fingerprint/correlation,
  bounded parallel queue insertion, ACK validation, backoff, identity changes,
  logout, expiry, memory degradation and authenticated tenant-free feedback.
  Browser tests here use protocol fixtures, not real IndexedDB/network E2E;
  that mandatory acceptance remains pending.
- Defect discovered/fixed: Environment metadata RLS originally applied an
  event tenant filter to a tenant-free registry row, incorrectly denying
  eligible ingestion. Environment scope now checks only Application/environment;
  event/receipt/job RLS still requires tenant scope.
- Complete release gate: API 146, Web 23, Hub 59 (contracts 6, core 11,
  Browser 14, Node 5, React 2, Nest 2, PostgreSQL 19). All builds, lint and
  typechecks passed; pre-existing Vite chunk-size advisory remains.
- Subsequent server verification adds a full forward rehearsal through all
  74 SQL migrations, bringing the Hub suite to 60 tests (20 PostgreSQL).
  Legacy migration 001 unconditionally creates the cluster-wide jupiter_app
  role; rehearsal substitutes only that identifier with a unique disposable
  role. The original role is never changed. Both rehearsal database and
  disposable role are removed afterward. This substitution is harness-only;
  historical migration files remain unchanged.
- This checkpoint does not provide public HTTP endpoints, final AI/Console,
  published Help or an independent reference-client acceptance. All are still
  required before COMPLETE.

## Public HTTP foundation — LOCAL

- Generic `HubHttpApi` and Node HTTP host implement real batch ingestion,
  short-lived credential exchange, public health/readiness and authenticated
  Application/Environment/credential management. Operational authentication is
  a generic verified identity port, not a Jupiter cookie assumption.
- Real HTTP tests use a loopback server and the isolated PostgreSQL fixture.
  They verify cookie-free ingestion, accepted/duplicate replay, origin plus
  credential checks, anonymous denial, scoped registry discovery, bounded body
  parsing and malformed JSON. Server suite now has 25 tests, Hub total 65.
- Origin is auxiliary: even a registered origin cannot ingest without a valid
  credential. Unauthorized origin with a browser credential is also denied.
- HTTP errors expose safe reason codes, never SQL or credential/provider data.
- Still required: full public OpenAPI, deployment host/Jupiter adapters, feedback
  routes, operational data/engines/AI/UI and full independent-browser acceptance.
