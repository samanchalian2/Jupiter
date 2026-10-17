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
| B | independent packages, registry/auth/contracts/OpenAPI | packages/registry/auth and HTTP operational APIs implemented; full OpenAPI pending |
| C | schema/RLS, atomic ingestion, browser/API/worker capture | PostgreSQL and Jupiter Browser/API adapters implemented; product Worker execution coverage pending |
| D | IndexedDB/replay/backoff/logout/scope isolation | SDK protocol verified; real-browser IndexedDB/replay pending |
| E | fingerprint, issues/incidents/rules/alerts | all rule scenarios verified; issue management and incident transitions implemented; full incident workspace/delivery pending |
| F | feedback/user tracking, Console/live/analytics/export | own Feedback and operational Console/live/filter/CSV implemented; richer analytics and final workflow acceptance pending |
| G | evidence-grounded AI, opt-in/budget/schedule/security | implemented; real GapGPT findings/usage and SQL isolation/budget/scheduler tests verified; reconciliation UI/final breadth QC pending |
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

## Investigator / owner-requested local administration checkpoint — 2026-10-17

- Provider blocker resolved by owner-supplied GapGPT endpoint/model/credential
  and explicit 100,000-token monthly input+output budget. Secret was sent only
  through local process input to Application-bound encrypted DB storage; neither
  repository, Evidence, Audit nor application stdout contains plaintext.
- `/models` returned 200 and listed `gpt-6-luna` and `gapgpt/whisper-1`. Hub does
  not have a transcription operation; the latter is recorded only as a disabled
  local preference, not a falsely advertised active feature. Tenant customer
  settings/provider credentials were not overwritten.
- Local migration 067 adds isolated AI configuration, Investigation and attempt
  ledger tables. Forward rehearsal now has 78 migrations/23 Hub tables. Runtime
  cannot read encrypted configuration; terminal attempts are immutable.
- Input/context/output and response-body bounds, exact endpoint allowlist,
  encrypted credential/Application binding, no redirects/tools, safe failures,
  citation allowlist/schema validation, per-tenant findings and usage isolation
  are tested. Budget reservations share an Application advisory lock; attempts
  across environments compete for the same monthly budget. Unknown usage stays
  held. Explicit ADMIN-only human reconciliation now settles only UNKNOWN
  attempts with provider-verified counts, mandatory reason and real-actor Audit;
  replay is idempotent and conflicting terminal counts cannot be rewritten.
  Cross-tenant denial and ledger/Audit behavior have real DB tests. Console
  reconciliation controls remain to be completed.
- Five initial real provider investigations completed with validated persisted
  output and settled counts (11,935 input + 2,845 output tokens at the first
  snapshot); subsequent runs were also visible in the local Console. The real
  output explicitly reported insufficient evidence where appropriate and cited
  only supplied IDs. No model-driven mutation or customer allowance consumption.
- Actual schedule supports deduplicated UTC daily/weekly summaries, configured
  periodic unresolved Issue review and critical Incident review. Scheduler,
  HTTP authentication/configuration/projections and parallel budget denial have
  real PostgreSQL acceptance, not only mocked SQL assertions.
- Local authenticated AI UI displayed checked activation/external-processing,
  correct GapGPT URL/model, 100000 budget, empty credential input with a
  has-credential notice, real usage and persisted results. At widths
  375/768/1024/1440 document widths were <= viewport and direction was RTL.
- Human workspace-management/cleanup amendment is separately documented in
  `docs/LOCAL_WORKSPACE_ADMIN_EVIDENCE.md` and DEC-039. No target host touched.
- Full GOAL-069 remains IN PROGRESS: maintenance/retention, alert delivery,
  richer analytics/incident workspaces, reconciliation, complete OpenAPI,
  second-consumer/real offline/identity/Help/final QC are not waived.
- Final regression exposed an existing inter-file API integration race: the
  personal-support test temporarily suspends the shared singleton catalog while
  personal-capacity concurrently requests support. API test files now execute
  serially against their shared database. Within-test parallel reservation and
  acceptance tests remain concurrent; no product authorization/capacity rule
  was weakened. Other independent packages still test in parallel.
- Final checkpoint `pnpm verify:release` completed successfully after removing
  overlapping invocations: API 147, Web 28, Hub 105 (40 SDK/core/adapters,
  62 server/provider tests and 3 Console tests). All builds/lint/typechecks and
  staged diff validation passed. The 78-migration rehearsal passed; temporary
  test database/role cleanup completed. The existing Vite size warning remains.

## Host/operational Console checkpoint — LOCAL, 2026-10-17

- Migrations 065–066 add Issue activity, scoped mutation grants/Audit and a
  restricted control-plane role, plus managed host grants distinct from manual
  grants. The real rehearsal applies all 77 migrations to a disposable DB.
- Migrations 063–066 were also explicitly applied to the local Jupiter DB for
  host acceptance. Earlier statements saying the business DB was not migrated
  describe those historical checkpoints, not the current local state. Neither
  target host has received these changes.
- Real server tests now exercise every rule, meaningful release baseline and
  no-release-change negative scenario; issue assignment/notes/status/Audit,
  filtered lists/detail, permission-checked CSV, HTTP preflight and origin
  updates. Control role cannot directly read raw event tables. Host-managed
  admin revocation preserves independent manual grants.
- Jupiter resolves the authenticated account and requested membership itself;
  the Browser cannot nominate an actor. Five-minute ingestion credentials are
  memory-only. Browser ingestion rechecks active account/membership. Logout and
  password updates revoke actor credentials. No-super-admin automatic mapping.
- Explicit idempotent local bootstrap selected the existing local admin account
  by CLI argument, recorded its real principal and saved only public IDs to an
  ignored local configuration file. No credential is recorded in this Evidence
  or bootstrap output. External AI remains disabled.
- Browser capture wraps only known Jupiter API traffic, propagates W3C trace
  and request correlation, preserves original response/body and error, excludes
  Hub recursion and unrelated/signed file URLs, and drops late old-user capture.
  Four focused Web tests verify these guarantees.
- `/feedback` is available after authentication, before tenant routing, so
  absence of membership does not block the route. It supports explicit queued
  submission, stable ACK tracking, own list/detail and public replies, with the
  approved AI notice and logout warning. Memory fallback wording does not claim
  durable storage. Full real offline replay/identity acceptance is still pending.
- The reusable Operations Console consumes only an injected HTTP port. Current
  sections: Overview, Live Monitor (10-second visible-page polling/pause),
  Issues, Incidents, Feedback, Analytics/CSV, Application creation and Rules.
  Human issue/incident/feedback actions call authorized APIs; tenant scope is
  explicit. AI and maintenance sections and richer analytics remain required.
- Fixed a misleading overview defect: impact/trend/operation denominator now
  share the exact date/search/severity/category/release event cohort. Active
  state counters are explicitly labeled current-state, not period metrics.
- Full release gate: 146 API, 27 Web and 93 Hub tests (40 SDK/core/adapters,
  50 real PostgreSQL server and 3 independent Console client tests), builds,
  lint and typecheck passed. Existing Vite >500kB advisory remains; it is not
  hidden or treated as an acceptance pass for performance budgets.
- Live local API started successfully and health/Registry/authenticated
  credential exchange worked. In-app browser authenticated `/operations`
  rendered real persisted measurements in Persian RTL at 375/768/1024/1440;
  document widths were <= viewport. `/feedback` rendered own empty state and
  notice without browser warning/error; 375px also had no document overflow.
  No human mutation/feedback fixture was submitted in this smoke check.
- Local Web port 5173 was identified as the separate legal-case application.
  It was not stopped or changed. Jupiter acceptance uses 5174, API uses 3000.
  This is a smoke checkpoint, not complete final Browser acceptance or proof
  of the required offline/reference/AI workflows.

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

## Operational persistence and feedback checkpoint — LOCAL

- Migration 064 adds Issues, scope-safe event associations, Incidents/activity,
  Feedback/public and internal replies, rules, alerts and minute aggregates.
  Tenant scope keys in composite FKs prevent attaching another tenant's event
  to an Issue. Feedback IDs are Application/environment scoped; Tracking IDs
  remain globally unique.
- `FeedbackService` and HTTP routes require authenticated actor but no tenant.
  Replay returns the same tracking reference, content conflicts are rejected,
  targeted secret masking preserves technical description and users only read
  their own reports. Internal replies are excluded by RLS and projection.
- Owner feedback visibility allows its own tenant history only within the
  credential's Application/environment. A test found the need for an explicit
  environment predicate and verifies both environment and Application denial.
- `IssueEngine.aggregate` shares the leased job completion transaction. Tests
  verify one increment, distinct affected-actor counts and no Issue for normal
  HTTP 403 even with a client CRITICAL claim. Browser severity is capped at
  ERROR before operational classification. Measured-operation counters are
  separate from raw event counters to supply a legitimate error-rate denominator.
- `MonitoringEngine` persists configurable rule defaults and initial detection.
  The burst test produces one Incident and one durable Alert after repeated
  evaluation. Human Incident transitions reject NEW → RESOLVED and record the
  authenticated principal for triage/investigation/resolution.
- Full rule validation, release-change baseline behavior, issue management,
  separate mutation Audit, reporting/exports and delivery are still pending.
  The existence of all rule codes is not acceptance of every rule scenario.
- Latest complete `pnpm verify:release`: 146 API, 23 Web, 73 Hub tests
  (40 SDK/core/adapter and 33 server integration). Builds/lint/typechecks pass;
  75-migration rehearsal passes and temporary database/role cleanup completes.
  Business DB migrations and target-server publications were not performed.
