# GOAL-069 — Observability Hub Evidence

Status: IN PROGRESS. Owner-approved plan supersedes the stale GOAL-060 identifier
in the supplied specification. GOAL-060 Personal Service history is preserved.
GOAL-059 remains BLOCKED; LOCAL evidence is not staging acceptance.

## 2026-10-18 — Bounded retention checkpoint (LOCAL)

- Migration `069_observability_retention.sql` adds environment maintenance state,
  RLS, explicit worker state permissions and targeted parent/expiry indexes.
  Full forward chain now has 80 migrations and 25 Hub tables. No business-table
  query/delete or permission expansion to business/security Audit is introduced.
- Existing per-Application policy defaults remain raw 30, aggregate 365,
  terminal Incident 180 and closed Feedback 180 days. Whole-Application ADMIN
  configures validated limits/reason with actual actor Audit; environment-only
  ADMIN cannot shorten Application-wide data windows.
- `RetentionService` enqueues hourly environment jobs (100 per sweep, hard cap
  500). The host checks each minute and claims one RETENTION job per tick. Each
  batch deletes at most 100 rows per category normally (hard cap 1,000), including
  bounded children, with uniquely keyed continuations when a category hits bound.
  Pending/running aggregation protects its raw source; source→Issue deletion has
  at most one association per event, not unlimited cascade fanout.
- Terminal parents are locked before bounded child deletion. Active histories,
  recent replies/notes, recent/pending alert delivery and pending target Incident
  investigations are protected. Same feedback UUID in another Application or
  environment is explicitly verified to remain. Aggregates expire independently.
- Receipts persist at least eight days and while the event remains, beyond the
  seven-day accepted event age. An eligible same-ID retry after raw removal still
  returns DUPLICATE. Terminal jobs retain dedupe; alert delivery's job remains
  while its alert exists. No AI attempts, findings, Issue/history or Audit are
  purged by this policy. Expired raw references cannot be reconstructed as facts.
- Policy edit/batch share Application lock; alert enqueue/delivery/retention share
  environment lock. Alert existence is rechecked under lock before enqueue.
  Complete/fail now require persisted scope, kind, event/dedupe and valid lease.
  Tampered-scope work is denied. Batch deletion, counts, automatic Audit and job
  completion are one transaction. Controlled Audit failure rolls back every
  deletion; parallel execution then commits once with one Audit.
- Added GET/PUT `/operations/applications/{id}/retention-policy` and GET
  `/maintenance?environmentId={env}`. OpenAPI/schema/real HTTP parity now includes
  all 44 operations. Maintenance reports retained queue counts, oldest aggregation
  lag, failed alert delivery, unresolved Issues, raw retention lag and last batch.
  It explicitly returns `coverage=QUEUE_AND_RETENTION_ONLY`; this is not full
  ingest/rejection/drop/offline-recovery/storage-growth self-monitoring.
- Console “نگه‌داری داده و صف” exposes explicit independent windows, reason,
  irreversible-effect acknowledgement and disabled unconfirmed save; it does not
  pretend tenant filters affect Application policy. Commands have range/confirmation
  tests. Authenticated responsive acceptance of this new panel is STILL PENDING;
  this checkpoint provides no replacement claim based on SSR/API checks.
- Local preflight found zero expired raw/aggregate/terminal Incident/closed
  Feedback rows. After isolated migration/security tests, 069 was applied only
  locally. The owned API/Web were restarted on 3000/5174 after confirming the
  old listeners were absent. Worker recorded one SUCCEEDED RETENTION batch with
  zero deletions in every category. All destructive acceptance scenarios use
  disposable PostgreSQL only; no live tenant or target host was purged.
- See DEC-040 and `observability/RETENTION_RUNBOOK.md`. Browser maintenance,
  complete self-monitoring/external probe runbook, missing alert sources, richer
  workflows, independent Browser/offline, runtime Help and final Goal QC remain
  required. GOAL-069 is IN PROGRESS; no next Goal/deployment/completion claim.
- Complete `pnpm verify:release` with actual external-client flag passes 150 API,
  28 Web and 124 Hub tests (40 SDK/core/adapters, 75 server/contract/provider,
  nine Console). All builds/lint/typechecks and the 80-migration rehearsal pass.
  Final strict maintenance-query validation also passed the full 75-test server
  suite, server build/typecheck and all nine Console tests. Anonymous/other actor,
  unexpected/duplicate query and tenant-filter injection checks deny access.
  Existing Vite >500 KiB chunk advisory remains explicit. Final workspace cleanup
  uses the existing local-only dry-run; no automatic broad cleanup is introduced.

## 2026-10-18 — Public OpenAPI and external-language clients (LOCAL)

- `observability/server/src/openapi.ts` is the canonical OpenAPI 3.0.3 document,
  exported by the independent server package and served without authentication at
  `GET /api/v1/observability/openapi.json`, under the normal request limiter.
  Relative mount paths are host-independent. No actual identity/configuration/
  credential is embedded. CORS remains auxiliary, not authentication.
- All 41 implemented operations are documented: health/readiness/document,
  ingestion/browser exchange, own Feedback, Application/environment/credential/
  origin management, overview/list/detail/export, human Issue/Incident/Feedback
  commands, rules, recipient inbox/read and Investigator configuration/request/
  report/usage/reconciliation. Trusted service-only bootstrap/grant/rotation
  ports are explicitly not invented as HTTP endpoints.
- Schemas specify shared event enums/allowlisted primitive metadata, byte/time
  and paging limits, snake/camel-case actual projections, nullable fields and
  decimal-string PostgreSQL bigint counters. Distinct ingestion/server/browser/
  operational bearer schemes, per-event partial ACKs, idempotency, manual-only
  mutation, safe errors and bounded retry behavior are explained.
- Swagger Parser validates the structure/references without external resolution.
  Ajv checks actual JSON payloads after dereference; a documented test-only
  adapter translates OAS 3.0 boolean exclusive bounds to draft-7 numeric bounds
  without changing their validation meaning. Tests verify strict-positive bounds.
- The contract integration test executes EVERY documented method/path over a
  real Node HTTP listener and disposable PostgreSQL, validates request and
  response schemas, and compares covered operations with the full document.
  This includes populated details/relations, nullable AI output, decimal counts,
  credential issue/exchange, CSV and read/management/AI mutations in fixtures.
- `observability/examples/python/ingest.py` uses Python's standard library;
  `observability/examples/csharp` compiles with .NET SDK 10.0.400, zero warnings/
  errors and no NuGet or Jupiter dependency. Both are backend-only, memory-queue
  examples, not production SDKs. Adoption/auth/retry instructions are in
  `observability/examples/README.md`.
- Actual external-client acceptance was enabled with
  `OBSERVABILITY_REFERENCE_CLIENTS=true` and an explicitly configured bundled
  Python executable. The integration harness provisions an independent App in
  its disposable DB and launches BOTH real processes. A loopback fault proxy
  commits the first event upstream but drops its ACK and returns 503. Each
  program retries with the same event ID/payload, receives DUPLICATE and replays
  it once more; exactly one Python and one C# event persist. Both reject invalid
  credentials, log only a generic safe failure, refuse a 302 and make zero
  requests to the redirect sink. No external provider or live tenant is used.
- Listener/process/database cleanup runs in finally blocks. Child environments
  exclude parent DB/provider secrets. .NET build and Python cache artifacts are
  explicitly ignored. Without the external-client flag, the ordinary test suite
  does not claim these executable-language results.
- Defects found during QC: bigint projection types, nullable AI output, PUT
  configuration's actual `updated` response, credential-response versus request
  writeOnly semantics, equivalent templated detail paths and dialect-specific
  numeric bounds were corrected in the contract/tests. Existing runtime APIs
  were not weakened to make the document pass.
- This completes the public-contract and example-client artifacts for currently
  implemented HTTP routes. Future remaining Goal routes must extend the same
  document/parity tests. Mandatory independent Browser reference, real IndexedDB
  offline/identity acceptance, missing alert sources, retention/self-monitoring,
  runtime Help and final full Goal audit remain unfinished. No host promotion.
- QC: complete `pnpm verify:release` with external-client flag enabled passes
  150 API, 28 Web and 117 Hub tests (40 SDK/core/adapters, 70 server/contract/provider,
  seven Console), all builds/lint/typechecks and 79-migration rehearsal. C# build
  passes with zero warnings/errors; bundled Python 3.12.14 executes the example.
  Client retry inputs are deep snapshots; mid-stream failures preserve those
  snapshots. Python socket timeout is not advertised as a hard whole-operation
  deadline; production supervision is explicitly documented.
- Running-host check: anonymous/no-cookie GET on local API 3000 returns 200,
  OpenAPI 3.0.3, 41 operations and 44 schemas. PostgreSQL checks find zero remaining
  `obs069_*` temporary databases and one non-archived workspace (`jupiter-demo`);
  cleanup dry-run reports no targets. Only the owned local API was restarted.
  No additional migration or deployment was performed; pre-existing Vite chunk
  advisory remains. Diff/secret checks precede the checkpoint commit/push.

## 2026-10-18 — Durable operational alert checkpoint (LOCAL)

- Migration 068 adds `observability.alert_inbox` with composite
  Application/environment/tenant alert FK, recipient-principal RLS and restricted
  update of `read_at`. Runtime cannot insert or change recipients.
- A bounded repair sweep finds alerts without an outbox job. `ALERT_DELIVERY`
  uses the existing lease/retry queue; authorized-recipient insertion and job
  completion commit atomically. Unique Alert/principal delivery is replay-safe.
  Batch limits: at most 100 alerts per regular sweep (hard cap 500), five leased
  deliveries per host tick, at most 100 inbox rows per read. More than 1,000
  recipients explicitly fails/retries rather than silently dropping recipients;
  scalable recipient pagination/flood policy remains a follow-up in this Goal.
- Only active scoped ADMIN/OPERATOR and explicit Hub super-admin principals are
  recipients. VIEWER/ANALYST and ordinary tenant users are excluded. Revocation
  blocks subsequent access to history. A super-admin reads/acknowledges its own
  delivered copy, not another person's inbox row.
- `GET /operations/applications/{id}/alert-inbox` and corresponding
  `POST /alert-inbox/{inboxId}/read` use explicit environment/optional tenant
  scope. Acknowledgement preserves the first read timestamp; it does not resolve
  or otherwise mutate Incident state.
- The independent Console provides Persian “هشدارهای من”, refresh, scoped
  selection and read acknowledgement. Irrelevant event search/date filters are
  not shown for this inbox. Host notifications remain account-scoped and use
  Jupiter NotificationService's source port, with current identity/grant checks.
  No alert is copied into business tenant notification rows or localStorage.
- Real PostgreSQL/HTTP tests cover anonymous denial, duplicate delivery/read,
  duplicate query rejection, wrong environment, wrong recipient, excluded viewer,
  revoked scope, raw RLS and cross-tenant FK enforcement. Three focused host
  tests cover source identity, unregister/outage and invalid/disabled sessions.
- Still pending: additional required alert sources (important feedback and
  pipeline self-failure), full flood/self-monitoring policy and final live
  notification workflow acceptance. Durable inbox delivery alone does not
  complete all Alerts or the overall A–I Definition of Done.
- Local migration 068 was applied after the isolated forward rehearsal (79
  migrations, 24 Hub tables). The owned Jupiter services run API 3000/Web 5174;
  no Preview/main host or separate local application was changed.
- Authenticated browser verified a real alert was delivered, acknowledged once
  and then rendered read/disabled. The associated Incident remained `NEW`
  before/after; no ticket or business lifecycle changed. The same delivered copy
  appeared in Jupiter's operational notification menu and linked to the Console.
- Inbox acceptance passed Persian RTL at 375/768/1024/1440 with no document
  overflow. Visual inspection found mobile popover clipping despite a passing
  document-width check; fixed with a viewport-bound compact panel. Actual panel
  bounds were then inside the viewport at all four widths. Temporary viewport
  overrides are reset after acceptance.
- After regression, five retained known organization fixtures were identified. The
  existing local-only utility explicitly enumerated them, then used supported
  suspension/archive services under the existing authorized administrator.
  They remain recoverable; zero physical rows/users were deleted and
  `jupiter-demo` remains retained. This is not a scheduled cleanup policy.
- Final `pnpm verify:release` passes: 150 API, 28 Web, 111 Hub tests (40
  SDK/core/adapters, 64 server/provider, seven Console), all builds/lint/typechecks
  and 79-migration rehearsal. `git diff --check` passes. Existing Vite >500 KiB
  chunk-size advisory remains explicit. A final cleanup dry-run reports zero
  targets. No credentials or raw provider content enter Evidence or Git.

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
| B | independent packages, registry/auth/contracts/OpenAPI | packages/registry/auth, HTTP operations and real OpenAPI parity implemented; future Goal routes must extend the contract |
| C | schema/RLS, atomic ingestion, browser/API/worker capture | PostgreSQL and Jupiter Browser/API adapters implemented; product Worker execution coverage pending |
| D | IndexedDB/replay/backoff/logout/scope isolation | SDK protocol verified; real-browser IndexedDB/replay pending |
| E | fingerprint, issues/incidents/rules/alerts | all rule scenarios verified; issue management and incident transitions implemented; full incident workspace/delivery pending |
| F | feedback/user tracking, Console/live/analytics/export | own Feedback and operational Console/live/filter/CSV implemented; richer analytics and final workflow acceptance pending |
| G | evidence-grounded AI, opt-in/budget/schedule/security | implemented; real GapGPT findings/usage, SQL isolation/budget/scheduler and reconciliation UI verified; final breadth QC pending |
| H | independent second application, C#/Python clients | actual Python/C# backend execution/retry/replay/denial verified against independent fixture App; mandatory separate Browser reference still pending |
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

## Human operational controls checkpoint — LOCAL, 2026-10-17

- `GET .../ai/unknown-attempts` is bounded to 100 safe rows, ADMIN-only and
  Application/environment/tenant RLS scoped. It returns safe attempt references,
  model/outcome and held bound, never credential/prompt/evidence content.
- Console has a human reconciliation form with empty input/output counts,
  mandatory provider-verification acknowledgement and 10–500-character reason.
  Invalid, fractional, negative or over-reserved counts are rejected. Zero is
  permitted only when explicitly verified, not prefilled as a release shortcut.
  Scope changes invalidate pending UI results; no automatic reconciliation.
- Browser acceptance used the real local authenticated admin and two existing
  UNKNOWN attempts: list resolved, counts were empty, submit was disabled until
  acknowledgement. No settlement was submitted because provider records had
  not been independently inspected. The form was cancelled without DB changes.
  At 375/768/1024/1440 document width stayed <= viewport and direction was RTL.
- Incident API now accepts explicit assignment/null-unassignment and human
  notes independently of the canonical status-transition operation. Actor and
  assignee require operator authority; writes plus sanitized activity/Audit
  share one authorized RLS transaction. Detail returns related Issue/Feedback
  and separately labeled persisted AI findings. No automatic AI mutation.
- Real PostgreSQL tests cover unauthorized actor, unauthorized assignee,
  wrong-tenant target, secret redaction, real-actor Audit, related projections
  and unassignment. Console count-validation tests are executable. Full real
  Incident end-to-end acceptance and remaining overall Goal gates still apply.

Final checkpoint gate passes: 147 API, 28 Web, 109 Hub (40 SDK/core/adapters,
63 server/provider and 6 Console tests), builds/lint/typechecks, 78-migration
rehearsal and diff validation. Existing Vite chunk-size advisory remains.

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
  reconciliation controls are covered by the later human-controls checkpoint.
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
