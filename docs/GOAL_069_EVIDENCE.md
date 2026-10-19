# GOAL-069 — Observability Hub Evidence

Status: IN PROGRESS. Owner-approved plan supersedes the stale GOAL-060 identifier
in the supplied specification. GOAL-060 Personal Service history is preserved.
GOAL-059 remains BLOCKED; LOCAL evidence is not staging acceptance.

## 2026-10-19 — Mounted React diagnostic isolation and evidence index (LOCAL)

- Implementation: `observability/packages/react-adapter/src/index.tsx`.
  Provider start/cleanup, route-change capture and ErrorBoundary capture use
  best-effort diagnostic boundaries. A synchronous throw or rejected promise
  never escapes into React; diagnostic promises are not awaited. Existing SDK
  cleanup is still invoked on unmount, with the same lifecycle contract. Normal
  event fields, redaction, component identification and dependency boundary are
  unchanged. No Jupiter business import, credential/API/provider/schema change.
- Red evidence: focused React suite first reports one failed assertion for
  throwing capture plus one actual unhandled asynchronous rejection. A mounted
  native Edge run additionally shows `start-throw` unmounts the child: starts=1,
  captures=1, uncaught=1 and textbox absent. Normal mode had passed first. The
  timeout is recorded as the reproduced startup defect, not a successful check.
- After the fix, all five focused tests and React/Web typechecks pass.
  `scripts/accept-observability-react-isolation.mjs` loads
  `apps/web/src/test-fixtures/observability-react.tsx` via local Vite, using real
  React createRoot/effects/ErrorBoundary with controlled SDK ports. The fixture
  is not imported by the production entrypoint and is not a new product route.
- Sixteen mounted Browser cases pass: normal, start throw/reject, cleanup
  throw/reject, capture throw/reject/stall at 375 and 1440. Each mounts once;
  normal cleanup is invoked once, failed startup has no returned cleanup to
  invoke. Route change preserves the typed input and increments state. Controlled
  child render failure shows a Persian RTL fallback; clicking reset restores
  the working child. No document overflow, uncaught React error, page error or
  unhandled promise rejection. Rejected startup is an adversarial runtime-port
  robustness case, not a change to the synchronous BrowserSdk.start contract.
- These mounted cases supplement the previous direct class-method tests; neither
  is represented as authenticated whole-Jupiter acceptance or actual event SQL
  persistence. A failed start cannot promise cleanup of resources allocated
  before it threw without returning a cleanup function. No recursive telemetry
  or raw diagnostic logging is used to hide that limitation.
- The required 47-section names-only list is now an explicit implementation /
  tests-executed / actual-result / limitations index. Existing historical
  checkpoints remain intact, including failures and superseded scope limits.
  The index is not a substitute for the remaining final requirement audit.
- Full LOCAL release gate and both real Browser isolation scripts exit zero:
  421 tests (173 API, 37 Web, 211 Hub: 87 SDK/core/adapters, 111 server,
  13 Console), builds/lint/typechecks, actual four-width reference Browser /
  offline/quota, Python/C# clients, performance and 83-migration rehearsal.
  Six native fetch writes still commit once and all sixteen mounted React cases
  pass after the full gate. No temporary acceptance databases or RESERVED AI
  attempts remain; owned API/Web PIDs 19440/49740, approved 100000 enabled
  monthly token budget and healthy local readiness remain unchanged. The existing
  Vite chunk advisory remains. Full authenticated host/process and
  requirement-by-requirement acceptance remain open. No target deployment.

## 2026-10-19 — Jupiter fetch diagnostic-failure isolation (LOCAL)

- Implementation: `apps/web/src/JupiterObservability.tsx`, specifically
  `instrumentJupiterFetch`; regressions in `JupiterObservability.test.ts`.
  Five newly executed tests first fail against the old adapter: trace failure,
  initial/final identity lookup failure, capture throw after a committed response,
  and reporter throw replacing the original network failure. This is a verified
  section-55 defect, not a claim inferred from a green normal-path suite.
- Diagnostic preparation is now isolated before one business dispatch. If it
  fails, original request arguments are forwarded unchanged exactly once.
  After dispatch, diagnostic callbacks cannot enter the transport error path;
  synchronous throws and rejected promises are contained without awaiting a
  stalled callback, recursive reporting or raw error logs. Response/body and
  the exact original transport exception remain unchanged. A failed/changed
  identity check suppresses capture, never relabels it under a newer account.
  Normal trace headers, request ID, safe operation metadata and Hub/external URL
  exclusion remain intact. No auth/provider/metering/API/schema change or new
  architecture is introduced; this restores the approved isolation invariant.
- Focused Web test execution passes 11/11: the previous four cases plus seven
  failure/stall regressions. Web typecheck passes. A stalled diagnostic promise
  does not delay resolution; asynchronous rejections produce no unhandled error.
- `scripts/accept-observability-fetch-isolation.mjs` loads the ACTUAL Jupiter
  module through local Vite in fresh Edge, then uses native fetch against an
  ephemeral loopback HTTP fixture. Six modes (trace throw, identity before/after,
  capture throw/reject/stall) each receive HTTP 201 and commit exactly once.
  A pre-cancelled native fetch preserves the exact AbortError despite a throwing
  reporter and produces zero server commits. Zero page errors and zero unhandled
  rejections; the fixture UI remains usable. It uses no credentials/tenant rows.
- Harness setup initially lacked the actual Vite React-refresh preamble; a
  subsequent attempt was blocked by Edge's local-network permission. Both were
  failed setup attempts, not acceptance passes. The final fixture initializes
  Vite's normal development preamble and grants local-network-access only in its
  isolated Browser context. No browser/server production policy is weakened,
  no launch-wide disabled-security flag or authenticated profile is used.
- Full LOCAL release gate exits zero: 418 tests (173 API, 37 Web, 208 Hub), all
  builds/lint/typechecks, actual four-width Edge/offline/quota, reference Python/
  C# clients, measured performance and 83-migration rehearsal. Real Browser
  integration takes 82.515s. The existing Vite >500-KiB advisory is unchanged.
  Zero temporary acceptance DBs/RESERVED AI attempts remain after cleanup;
  the enabled monthly budget remains 100000 and owned API/Web listeners remain
  PIDs 19440/49740 on 3000/5174. Public local health/readiness are healthy.
  This actual Browser proof covers the production
  fetch adapter with controlled observer faults, not authenticated AppModule,
  full shell or real ticket-service acceptance. Those remaining acceptance and
  the complete A–I/47-section audit stay open; preview/main remain untouched.
- Follow-up audit probe invokes the actual compiled React ErrorBoundary method
  with a throwing diagnostic port: the diagnostic exception escapes. Existing
  two React tests cover normal redaction/fallback return only; they do not mount
  the component or inject this failure. This is a verified method-level gap,
  not a claim that a full mounted fallback scenario was executed or fixed here.
  Provider start and route-effect fault behavior also remain to be tested.

## 2026-10-19 — Queued intake recovery and automatic-flush outage (LOCAL)

- Implementation/test paths: `apps/api/test/lifecycle-worker.integration.spec.ts`,
  `test/support/queued-intake-acceptance.ts` and
  `test/support/automatic-hub-outage-acceptance.ts` under `apps/api/`.
  Existing actual QueueWorker, HttpAiProvider/HttpTranscriptionProvider,
  TicketIntakeService, CommercialService, TicketService, NodeSdk and generic
  HTTP/SQL Hub run against the disposable 83-migration database. Production
  processing, provider/metering contracts and retry policies are not changed.
- Four real queued paths execute: text, text conversation, legacy voice and
  conversation voice. The loopback HTTP provider returns one invalid structured
  analysis per path, then a valid v6 response. The first failure retains one
  RESERVED action with no settlement; only the fixture's retry due timestamp is
  advanced. Each successful path settles exactly one unit despite duplicate
  analyze/drain calls. Each has exactly two chat calls; each voice path has one
  actual multipart transcription, not one per analysis retry. Duration telemetry
  is one second and belongs to that same AI_SMART_INTAKE action.
- Conversation voice retains TRANSCRIBING on analysis failure, while the saved
  message transcript prevents another transcription. This is existing behavior,
  not a renamed stage or modified production retry. Initial test assumptions
  about ledger FK shape, numeric text formatting and this state were corrected
  against actual schema/service behavior; none is claimed as a product defect.
- Analysis creates zero tickets. Only the explicit test caller creates a DRAFT
  and subsequently submits it to OPEN. Existing review recovery and terminal
  failure assertions remain intact. Stored operational events/warnings exclude
  the synthetic private input/transcript/provider marker, use null automation
  actor and the actual persisted job organization; real aggregation finds Issues.
- During all four recovery paths and explicit submit, the actual Node SDK's
  unchanged 10-second interval targets a loopback HTTP 503 outage proxy. No fake
  timer, transport mock or manual flush is used in this outage assertion. First
  timer dispatch fails, records fixed INGESTION_UNAVAILABLE fallback and retains
  the bounded queue. All business work finishes before the proxy is restored.
  The next real interval forwards to authenticated Hub HTTP; queue drains with
  zero drops. Focused execution observed one HTTP 503 attempt and one recovered
  batch. Final SQL assertions then inspect the actual persisted worker events.
- Executed focused integration: 3/3 pass (24.534s), including ~21.299s real
  timer/outage scenario; API typecheck passes. The subsequent full LOCAL release
  gate exits zero: 411 tests (173 API, 30 Web, 208 Hub), all builds/lint/typechecks,
  real four-width Edge/offline/quota, Python/C# clients, performance and migration
  rehearsal. Existing integration cases were expanded; the scenario matrix is
  not falsely added to the test count. The final queued integration takes
  24.992s, including 21.390s real timer/outage; Browser takes 81.518s. Vite's
  existing >500-KiB chunk advisory remains. Post-gate cleanup confirms zero
  disposable acceptance DBs and zero RESERVED AI attempts; owned API/Web remain
  PIDs 19440/49740 on 3000/5174. The approved budget stays enabled at 100000.
  These are stronger service/worker/automatic-flush proofs, not full AppModule
  bootstrap, process-crash, external provider or authenticated Browser business
  workflow acceptance. Those remaining scope items and the A–I/47-section audit
  are not marked complete. No shared business tenant or preview/main host changed.
- Next code-audit finding (not fixed or counted as accepted here): Jupiter's
  `instrumentJupiterFetch` directly calls observer.trace and unguarded diagnostic
  callbacks. Its existing four Web cases prove normal HTTP/network/identity
  behavior, not a throwing observer or rejected diagnostic promise. This is a
  concrete remaining section-55 failure-isolation target; green service/worker
  gates cannot establish that browser-host invariant.

## 2026-10-19 — Offline lifecycle and data-write isolation (LOCAL, DEC-048)

- `observability/server/test/offline-browser-acceptance.ts` extends actual Edge
  acceptance, using the independent consumer's verified session, real IndexedDB,
  network interception, actual authenticated HTTP ingestion/Feedback and SQL.
  No app business code, production tenant, credential or external provider is
  used. Reference UI's manual-flush completion counter avoids inferring promise
  completion merely from a click or a changing queue count.
- Offline Feedback survives a genuine failed offline static reload and subsequent
  reconnect with the SAME local envelope. The static reference document is not
  a PWA/cache: it cannot be fetched while disconnected. Journal persistence and
  recovery are proved; offline static-shell availability is not claimed or added.
- A real Feedback commit then lost network ACK retains the original ID; a flush
  before its persisted retry due time makes no extra Feedback request. After
  due, ACK yields the SAME tracking ID and one SQL row. Explicit replay of that
  acknowledged envelope also leaves one row. Event 49h/Feedback 25h fixture ages
  exercise the real SDK expiry path with zero corresponding server rows; this
  is controlled age metadata, not a claim of a days-long wall-clock test.
- A same-partition event whose payload actor is tampered receives an actual
  REJECTED/ACTOR_SCOPE_MISMATCH ACK and is removed without persistence. A separate
  previous-actor partition planted before reload must be purged before replay,
  with zero outbound requests containing its ID and zero SQL rows. The full
  release gate confirms the expanded assertion set.
- Actual storage quota is distinct from the SDK count/byte cap. CDP override is
  applied on an empty same-origin preflight document BEFORE IndexedDB opens;
  a real 8-MiB bounded probe transaction must abort with QuotaExceededError.
  Overrides applied after an opened bucket accepted earlier probes in this
  environment; those failed setup attempts were not counted as quota acceptance.
  The exact browser-internal allocation cause is not asserted. Official method:
  [Chrome DevTools Storage protocol](https://chromedevtools.github.io/devtools-protocol/tot/Storage/#method-overrideQuotaForOrigin).
- In the executed focused run, real quota causes SDK MEMORY fallback, the host's
  manual action completes with zero page errors, and a captured in-memory event
  persists once after quota/network recovery. Reload creates DURABLE storage
  again and a new durable event persists once. This does not claim memory data
  survives page loss or that an inaccessible old store was physically erased.
- A new regression test first proved a real defect: storage failure while writing
  RETRY metadata escaped flush's network-error handler into the consumer promise.
  SDK data writes/removals now use existing MemoryQueue fallback with generation/
  partition checks, same ID/body/expiry and unchanged retry/TTL/cap policy.
  Automatic diagnostic writes retain separate DEC-044 behavior; they do not
  trigger data fallback or recursive event reporting.
- Five new focused SDK cases plus the original 31 pass: retry-write failure,
  permanent denial/removal failure, identity switch during fallback, successful
  ACK with failed durable deletion/reload of same ID, and foreign cleanup/logout
  failure without relabeling old data. Failed clock-fixture/physical-erasure
  assumptions were corrected without weakening the actual isolation assertions:
  old inaccessible rows remain old-partitioned until a later available store
  purges them. No physical deletion is invented; active memory replay is blocked.
- Persian offline Help now explains temporary memory, unavailable static reload,
  best-effort physical cleanup versus authoritative credential/context isolation.
  Reference logout wording says sending stopped, not guaranteed physical wipe.
  Supported local slug-only runtime publication revised this one article, with
  no creation or unrelated article changes. The full LOCAL release gate exits
  zero: 411 tests (173 API, 30 Web, 208 Hub: 84 SDK/core/adapters, 111 server,
  13 Console), builds/lint/typechecks, real Edge/offline/Python/C#/performance
  and 83-migration rehearsal. Edge completes in 81.841s; all four widths remain
  RTL without document overflow. The actual quota transaction reports
  QuotaExceededError; MEMORY event and post-reload DURABLE event each persist
  once with zero page errors. Temporary acceptance databases and RESERVED AI
  attempts are zero after cleanup; the existing enabled configuration retains
  the owner-approved 100000 monthly input+output token budget. No provider call
  is made by these acceptance scenarios. The anonymous local runtime article
  check is separate from authenticated Jupiter reader acceptance; the latter
  has not been repeated for this particular revised wording.
  Full actual Jupiter host/process/cross-domain and A–I/47-section audit remain;
  this is not overall GOAL-069 completion or staging acceptance.

### Section 57 — twenty-case evidence map

BA = `server/test/browser-acceptance.ts`; OB =
`server/test/offline-browser-acceptance.ts`, both under `observability/`.
All entries below refer to actual Browser/HTTP/storage execution, not merely
function-call mocks. The expanded full release gate confirms these assertions.

| # | Required case | Actual assertion/path and boundary |
| --- | --- | --- |
| 1 | Normal event | BA captures and SQL finds reference.frontend |
| 2 | Disconnect | BA/OB actual context.setOffline(true) |
| 3 | IndexedDB persistence | BA/OB inspect real envelopes object store |
| 4 | Reload offline | OB real disconnected navigation fails; exact journal survives reconnect; no static-PWA claim |
| 5 | Reconnect | BA/OB restore network and authenticated host session |
| 6 | Batch replay | BA normal/lost-ACK and default-capacity Browser performance |
| 7 | ACK | BA SDK removes only corresponding acknowledged IDs |
| 8 | Idempotent persistence | BA commit/lost-ACK/reload leaves exactly one SQL event |
| 9 | Local cleanup | BA event ID and OB Feedback ID absent after valid ACK |
| 10 | Backoff | OB persisted attempts/due and no Feedback request before due |
| 11 | Tenant switch | BA verified host switch removes old-tenant ID |
| 12 | Logout | BA actual host revocation, queue empty and SDK stopped under available storage |
| 13 | Different login identity | BA host-authenticated next actor reuses Browser storage; old actor not replayed (not a Jupiter password-login test) |
| 14 | IndexedDB unavailable | BA controlled SecurityError at real Browser API boundary; UI memory fallback/HTTP remain usable |
| 15 | Storage quota | OB real CDP quota + actual QuotaExceededError, MEMORY and successful post-recovery delivery |
| 16 | Expiry | OB real stored Event/Feedback age metadata, removal and zero corresponding SQL rows |
| 17 | Offline Feedback | OB verified enqueue while disconnected, journal survives failed reload |
| 18 | Duplicate Feedback | OB real commit/lost ACK and explicit duplicate replay, same tracking/one row |
| 19 | Unauthorized replay | OB actual server ACTOR_SCOPE_MISMATCH rejection, no persisted forged event |
| 20 | Incompatible identity | OB planted foreign partition, fresh SDK purge, zero matching network requests/SQL rows |

## 2026-10-19 — Explicit multi-product comparison (LOCAL, DEC-047)

- `OperationsService.compareProducts` and read-only POST
  /operations/analytics/products accept 1–10 explicit distinct Applications,
  each with one environment and optional tenant. All targets are preauthorized;
  each read again uses current operational grants and runtime RLS. A denied or
  revoked target rejects the entire response, never a silently truncated/partial
  comparison. No global privilege, migration, worker bypass or AI call appears.
  Existing operational identity/rate limiter applies before this route.
- A single captured UTC window and validated <=31-day event filters apply to
  every target. Safe server registry names identify rows; client names/unknown
  target properties are rejected. Error-event count determines rank, measured
  HTTP rate has its actual denominator, and distinct affected actors/tenants
  are separate. Empty data yields zero counts and unknown rate, not invented
  quality scores. Application-wide, concrete-tenant and tenant-free coverage
  are distinct in the response. At most ten sequential scoped reads; existing
  pool/statement deadlines apply, not a whole-request production SLO.
- Two new actual PostgreSQL/HTTP scenarios prove same opaque tenant/actor IDs
  across Products do not mix, exact metrics 3/4=.75 and 1/2=.5, absent-version
  null rates, ten-target boundary without truncation, target duplication and
  shape/size/filter rejection, 401/403/400 and no partial items on denial.
  Coordinated real grant revocation between preflight and the later scoped read
  proves reauthorization. No mocked Event or bypassed grant substitutes for SQL.
  Public executable OpenAPI parity now exercises all 48 real HTTP operations.
- `ProductComparisonPanel.tsx` adds explicit add/remove/current scope controls
  INSIDE Analytics, not new navigation. Names/environment/tenant coverage remain
  visible; one scope per product prevents overlap/double counting. All target
  selections are client-session state, not new grants or commercial entities.
  Changing filters/selection invalidates and aborts pending results; a generation
  guard also discards obsolete replies if the transport ignores cancellation.
  Two Console tests prove one common window, display-label/pagination stripping,
  duplicate/empty/eleven-target rejection. All 13 Console tests pass focused.
- Actual authenticated independent Edge adds two Applications across real
  selectors and compares their authorized environments. A held real HTTP reply
  is released only after removing a target; the obsolete result never reappears.
  All four widths 375/768/1024/1440 retain RTL, a named keyboard-focusable inner
  table scroll region and no document overflow. Focused Browser scenario passes
  in 39,003ms; screenshots are inspected locally, not committed. Final wider
  name columns avoid breaking product names into fragments on mobile.
- Browser fixture isolation defect is fixed: Vite port=0 previously fell back
  to the preview port. Node now reserves an actual OS ephemeral port, closes
  that reservation and starts Vite on that exact port with strictPort. A race
  fails closed, never tries product ports 3000/5173/5174. Actual run used 53446;
  the owned local API/Web PIDs 49416/49740 stayed unchanged throughout.
- QC removes redundant analytics reads: changing between the ten single-App
  tables now reuses its complete filtered cohort. Entering/leaving product
  comparison, changing scope/filter or refresh still performs the required read.
  Real Browser request counting asserts no additional /analytics request during
  all ten table selections at every width; the final complete gate verifies it.
- First complete run exposed three OLD retention fixture failures after the new
  target scopes expanded the queue: helper wrongly expected its target in one
  50-job claim. The scoped-deletion suite now pages the real scheduler and advances
  ONLY its generated target's pending due time before a real one-job claim. It
  neither leases/deletes protected other-scope fixtures nor fabricates completion
  for unrelated jobs. Child batches use the same scoped helper. Global queue
  FIFO/lease tests remain separate and unchanged. Nine combined analytics/
  retention focused cases pass, including protected data and rollback assertions;
  the failed complete run is not counted as a pass. The final complete gate passes.
- Focused server scenarios plus HTTP/OpenAPI parity pass (three cases), server
  and Console typechecks pass. New performance measurement exercises actual HTTP
  reports against 1,000 events and comparison with a second empty product; final
  full gate passes below. This does not claim ten loaded products or production SLO.
- Executed LOCAL report timing (10 actual HTTP calls each, 1,000 events): single-
  Application analytics p50/p95/max 55.56/61.43/61.43ms; two-product comparison
  35.46/41.02/41.02ms. SQL-backed responses assert 100 errors/1,000 operations/
  100 failures/.1 rate and an empty second product with null rate. A 5s local
  maximum regression guard passes. These observations do not replace the full
  specification's host/concurrent performance acceptance or establish an SLO.
- Persian Console Help source now explains explicit comparison, shared filters,
  frozen per-product tenant scope, all-or-nothing authorization, rate denominator
  and stale-response behavior. Supported local slug-only runtime publication
  completes: 0 created/1 revised; public API lookup confirms the comparison
  heading, ten-program limit and unknown-rate explanation. History/unrelated
  guides are preserved; this is not a new Help article or a global republish.
  Full Jupiter host/cross-domain/browser breadth, bootstrap/process/security,
  representative loaded multi-product performance and A–I/47-section audit remain.
  No Preview/main-host promotion or overall GOAL-069 completion is claimed.
- Final `pnpm verify:release` exits 0 (durable local log records the exit):
  406 tests = 173 API + 30 Web + 203 Hub (79 SDK/core/adapters, 111 server,
  13 Console). All builds/lint/typechecks, 48-operation real HTTP/OpenAPI parity,
  actual Edge four-width analytics/comparison/cache/late-response/offline/default
  capacity, Python/C#, performance and 83-migration rehearsal execute. Existing
  Vite chunk-size advisory remains. `git diff --check` passes; skipped filtered
  focused cases are never counted as full-gate executions.
- Final LOCAL analytics timing with 1,000 events: single-App p50/p95/max
  62.67/77.51/77.51ms, two-product 29.22/33.22/33.22ms (10 calls each).
  Differences from the earlier measured run are reported, not normalized away.
  The Browser fixture uses port 54282 and owned product PIDs stay 49416/49740
  throughout tests. Post-gate preflight confirms zero temporary DBs/reserved AI
  attempts, 83 migrations and unchanged enabled 100,000-token configuration.
- Only the identity-verified owned LOCAL API is restarted after the build;
  product Worker remains explicitly false and Hub drain retains its prior flag.
  Web PID 49740 is untouched. Health/readiness pass; runtime public OpenAPI
  advertises compareProducts and 48 operations; revised public Help loads and
  Web /operations returns 200. No staging/main host or co-hosted app changes.

## 2026-10-19 — Real queued provider failure, metering and recovery (LOCAL)

- Implementation under test: actual QueueWorker, AiGatewayService,
  TicketIntakeService, TranscriptionService, CommercialService, TicketService,
  AttachmentService, HubBindingService and Node SDK/HTTP ingestion/IssueEngine.
  No production contract, retry, provider, lifecycle or commercial code changed.
- `apps/api/test/lifecycle-worker.integration.spec.ts` uses its generated,
  fully 83-migration PostgreSQL database and substituted generated product role.
  Fixture requester has a real membership/REQUESTER role, both capability gates
  and encrypted random fixture credential. The supported service enqueue paths
  create requests/reservations. A loopback HTTP server returns actual 503s;
  there is no external provider call or real key. Test storage is an explicit
  in-memory AttachmentStorage port, not an S3/filesystem acceptance claim.
- One review failure, three text-intake attempts and three voice-intake attempts
  make seven actual provider HTTP calls. The three voice requests are asserted
  as multipart /audio/transcriptions. Only fixture next-attempt timestamps are
  advanced to exercise real claim/retry logic without sleeping. After retries,
  SQL proves all three commercial actions RELEASED, zero settlements. During
  earlier retries the intake reservations remain held rather than recreated.
- A separately enqueued attachment transcription reaches RETRY then DEAD_LETTER
  through the actual legacy HttpTranscriptionProvider rejection path (no remote
  call for legacy attachments); it creates no commercial action. This does not
  claim an implemented independent attachment audio provider integration.
- With the same worker/services, manual ticket submission reaches OPEN. Switching
  the loopback provider to a valid review response recovers: one successful
  review and duplicate enqueue/drains yield exactly one settlement (-1 unit),
  one SETTLED action and just one further HTTP call. Failed intakes do not create
  tickets; automatic ticket submit is not introduced.
- SQL over actual ingested events proves AI FAILED, intake RETRY/FAILED and voice
  RETRY/DEAD_LETTER operations with real organization, null automation actor,
  WORKER source/category, WARNING versus ERROR and retryExhausted flags. A unique
  private provider-response marker is absent from events/warnings. The real
  aggregation engine produces an Issue. No manually injected outcome port calls
  substitute for these service outcomes. The older explicit-port test now uses
  a before-ID cohort so it cannot count another test's legitimate real events.
- Focused execution: three integration tests pass (new scenario 931ms); API
  typecheck passes. Temporary listener is closed, prior encryption environment
  restored, generated DB/role cleanup assertions remain mandatory. The later
  402-test full release gate below covers this scenario. No business tenant,
  pre-existing Help or approved 100,000-token
  monitoring configuration changed; Preview/main are untouched.
- Limits: this is real services/Worker/HTTP/SQL with loopback provider and an
  explicit drain call, not a full Browser/AppModule or cloud outage test. Intake
  success/retry-then-success breadth, process startup and final host/security/
  performance/A–I audit remain. Whole Goal is still IN PROGRESS.

## Historical analytics audit finding — section 43 (partially remediated below)

Current `observability/server/src/operations.ts` overview implements filtered
hourly event/error/operation trends, current state counts and affected users/
tenants; the shared Console analytics view reuses that overview plus safe CSV.
That does not yet satisfy all explicit section-43 reports: incidents over time,
issue recurrence, affected product/operation rankings, browser/device breakdown,
release regression, feedback trends, resolution time and recurring causes need
distinct bounded queries/projections and real UI/security acceptance. Green
overview/CSV tests are not proof of those missing reports. Preserve the full
requirement and implement it rather than treating overview as complete analytics.

## 2026-10-19 — Bounded analytical reports (LOCAL, DEC-046)

- `observability/server/src/operations.ts` adds the read-only analytics projection;
  `http-api.ts` exposes GET /operations/applications/{applicationId}/analytics.
  Executable `openapi.ts` documents strict request/response bounds and semantics;
  parity now requires all 47 operations to execute over actual HTTP/PostgreSQL.
  No migration, role relaxation, domain/provider/commercial change was made.
- Current operational grant revalidation and RLS guard every report. A single
  fixed SQL statement materializes only required safe columns from the validated
  received-at event cohort (max 31 days). Output is bounded at 50 ranked groups/
  750 hourly buckets; existing database statement timeout remains. This is not
  a claim that every large production dataset finishes within the timeout.
- Ten report projections cover Incident created/resolved trends, Feedback
  trends, matching Issue occurrences plus explicitly lifetime reopen count,
  affected operations, browser/OS/device, release measured-HTTP failure rates/
  observed deltas, Issue/Incident resolution mean/median/p95 seconds, recurring
  event fingerprint/type patterns, user impact and tenant impact. Missing
  dimensions remain null; unresolved resolution statistics remain unknown, not
  zero durations. Release comparison is not causal regression proof. Feedback
  with no linked event is excluded only by technical severity/category/release
  filters; its text search is on subject. UTC buckets do not depend on DB zone.
- Two real PostgreSQL scenarios prove exact rates (v1 0%, v2 50%, delta .5),
  known 120-second resolved Incident, recurrence, linked/unlinked Feedback,
  per-tenant/app denial, absent-version empty reports, 51 groups capped to 50,
  all-unknown device fields, public HTTP 401/403/400 and strict filters. Separate
  connection explicitly configured Asia/Tehran proves UTC-hour alignment. The
  same OpenAPI parity acceptance validates the real analytics JSON response.
- The Console replaces overview reuse with a named compact report selector,
  Persian column labels and honest filter/limit guidance. All ten selectors are
  exercised in actual authenticated independent Edge at 375/768/1024/1440, RTL
  and document width <= viewport. Screenshots are local output artifacts, not
  repository assets. Initial label lookup exposed an ambiguous implicit label;
  an explicit accessible name fixed it. Visual review then found narrow headers
  wrapping letter-by-letter: readable minimum table widths and a named,
  keyboard-focusable INNER scroll region fix that without document overflow.
- QC also found fixture cross-test queue backlog; the test drains bounded claim
  pages rather than assuming one claim covers every new event. A non-UTC fixture
  initially copied pg Pool.options, whose password is intentionally nonenumerable;
  it now reuses the original protected connection configuration and generated
  database name without printing credentials. Failed runs are not counted as
  passes. Subsequent focused analytics tests and the final full gate pass.
- Persian observability-console Help is revised through the supported local
  publication utility with the existing active Platform Admin and slug-only
  selection: 0 created/1 revised. Runtime history and unrelated articles remain.
  It explains reports, rates, unknowns, scope, limits, scrolling and CSV's actual
  event-export meaning. Public local API lookup confirms the slug and revised
  analytics/limits/cross-product limitation content after local startup.
- Remaining: cross-product ranking is NOT implemented by this single-App report;
  richer representative analytics performance and actual Jupiter host breadth,
  full security/process/A–I/47-section acceptance still require execution. This
  checkpoint cannot close the whole Analytics or GOAL-069 requirement.
- Final `pnpm verify:release` exits zero (durable local log records exit 0):
  402 tests = 173 API + 30 Web + 199 Hub (79 SDK/core/adapters, 109 server,
  11 Console). Build/lint/typechecks, real Edge/offline/default capacity,
  Python/C#, performance and 83-migration rehearsal all run. The three amended
  source/test SHA256 hashes match the pre-gate snapshot. Vite chunk advisory is
  unchanged; it is not a new failure. No filtered/skipped cases inflate totals.
- Post-gate local preflight: zero temporary databases, zero reserved AI attempts,
  unchanged 83 migrations and enabled 100,000-token monitoring configuration.
  The former API/Web listeners were absent. Verified free ports were started
  hidden with owned API/Web processes; product Worker explicitly false, only
  Hub drain enabled. Health/readiness passes and Web /operations returns 200.
- During tests a listener on 5174 belonged to the reference Vitest worker, not
  an assumed product process. Ownership guard prevented any replacement; it
  closed normally. Vite's port=0 fallback to a product preview port is now a
  concrete test-isolation follow-up: reserve a real OS ephemeral port and
  strictPort before the next Browser/full-suite run. No other app was stopped.

## 2026-10-19 — Queued AI/voice/intake observation and outcome QC (LOCAL)

- `apps/api/src/jobs/queue.worker.ts` now calls the existing host observation
  boundary for provider construction, job enumeration, AI/transcription/intake
  processing and cleanup. Persisted job rows provide organization IDs; the host
  supplies null automation actor and fixed operation names. The prior raw-stack
  logger is replaced by fixed-message logging. No migration, new provider, API
  route, commercial quota or retry-state changes are introduced.
- AI and intake services catch some terminal errors internally. The worker reads
  their persisted status with both job/session ID and organization predicate;
  it does NOT change AiGatewayService.process's existing return contract. Voice
  already returns persisted status. RETRY projects WARNING/retryExhausted=false;
  FAILED/DEAD_LETTER project ERROR/true. No prompt/transcript/file, provider error,
  raw job payload or secret is supplied to the monitoring outcome port.
- QC found an unsupported safeMetadata outcomeCode key, which would cause SDK
  rejection. It is replaced by existing allowed failureCode; actual SDK and
  HTTP/PostgreSQL tests require three persisted valid outcomes, not just a mocked
  method invocation. Diagnostic-only state read errors are caught locally with
  fixed warnings; subsequent jobs/cleanup still run and business outcome is not
  converted to failure because observation failed.
- Seven focused QueueWorker tests cover actual method stage order/tenant ports,
  non-overlap, thrown-stage continuation on next cycle, cleanup failure cadence,
  caught terminal outcomes, failed diagnostic read continuity and actual host/
  SDK metadata validation. Controlled service ports in these unit tests do not
  stand in for real provider/settlement acceptance.
- Extended disposable lifecycle-worker.integration.spec.ts instantiates the
  ACTUAL QueueWorker with real DatabaseService and HubBinding/Node SDK/HTTP Hub.
  Temporarily renaming ai_requests ONLY in the fully migrated generated DB
  triggers a genuine enumeration SQL failure. SQL proves a stored WORKER event
  for queue.ai.enumerate with null actor/tenant. The table is restored in finally.
  Later explicit outcome port calls persist three tenant-scoped RETRY/FAILED/
  DEAD_LETTER rows; these calls prove transport/contract, NOT real provider failure.
  The fail-fast path never reaches provider/service calls. Generated DB/role
  cleanup still asserts their absence. Distinct host reporter instances prevent
  legitimate one-minute warning dedupe from making unrelated test expectations
  order-dependent; throttling itself is unchanged.
- Existing lifecycle SQL→event→Issue→recovery and the original commercial/API
  suites remain required. Actual provider-failure outcomes/metering, process
  startup, remaining host/analytics/security and the complete specification/
  A–I/47-section audit are still outstanding. Sampling outage/fairness is a
  separate concrete open item below. No external host or provider call occurred.
- Full release gate exits zero with 394 tests: 171 API, 30 Web and 193 Hub
  (79 SDK/core/adapters, 103 server, 11 Console), all builds/lint/typechecks,
  real Edge/Python/C#, performance/offline acceptance and 83-migration rehearsal.
  Existing Vite chunk-size advisory remains. The earlier 167-API gate predates
  final outcome/read-isolation fixes and is not the acceptance result for them.
  No Goal completion follows from this checkpoint; requirements still pending
  above must be independently proved.
- Zero-active-AI preflight and zero temporary databases were verified after the
  gate. Only the previously verified owned local API was restarted with the
  rebuilt code; normal product queued Worker was NOT enabled against business
  data just to create evidence. Hub local drain remains as previously configured.
  External health/readiness passes and Web /operations returns HTTP 200. Normal
  Help and the encrypted 100,000-token provider configuration remain unchanged;
  no Preview/main host, co-hosted app, real AD or external provider was changed.

## Historical sampling failure-isolation finding — remediated by DEC-045 below

The 120-environment 100/20/0 measurement proved successful bounded continuation,
not per-scope outage/slow-query fairness. The prior `server/src/self-monitoring.ts`
awaited each scope sequentially; an exception escaped that loop before later
scopes ran. HubBinding awaited sampling within the shared periodic drain, so its
worker progress could be delayed even though ordinary API handling was separate.
Per-statement timeout alone is not a bounded whole-cycle deadline. The dedicated
remediation evidence below supersedes this concrete historical finding.
Do not infer whole GOAL-069 completion from the successful empty-scope fixture.

## 2026-10-19 — Failure-isolated sampling and host coordination (LOCAL, DEC-045)

- Implementation: independent server self-monitoring service and Jupiter host
  binding, without migration/API/RLS/table changes. One in-flight pass coalesces
  callers. A constant-size last-attempted App/environment UUID cursor rotates
  bounded ordered selection and wraps on subsequent passes. Failed/contended
  scopes cannot permanently occupy the first selection slot. Cursor is local
  best effort across process restart; persisted hourly samples stay authoritative.
- Each scope catches its own failure, emits fixed METRICS_STORAGE_UNAVAILABLE
  diagnostics and continues if budget remains. It uses try-advisory-lock rather
  than waiting for another sampler; contended scopes are deferred, not recorded
  as zero. SQL statements have a local 1s timeout. A pass starts no further
  scopes after a 5s cooperative work budget. Configured pool acquisition remains
  separately bounded; this is NOT a hard process wall-time/cancellation promise.
- Host's periodic shared drain starts sampling without awaiting it, prevents a
  second pass, and awaits pending work during shutdown before pool close. No
  orphaned Promise.race query, extra background scheduler or new service appears.
- Executed real PostgreSQL acceptance adds two environments to a disposable Hub
  App. A fixture-only BEFORE INSERT trigger sleeps two seconds for exactly one
  generated environment. The real 1s SQL deadline rolls back that snapshot; the
  healthy environment is still sampled in the same pass, broken scope remains
  null/unobserved, and elapsed is asserted below the explicit 6s test guard.
  Trigger/function are dropped in finally; the next pass measures the recovered
  scope. Focused actual run: 1,178ms for that scenario. No business DB trigger,
  global role or real tenant setting was changed.
- Unit tests prove same-Promise coalescing, cursor advancement after an actual
  controlled scope failure, no raw failure logs, nonblocking-lock deferral and
  cooperative budget stop. Host unit test proves immediate scheduling, one call
  while pending and pool-close-after-completion. Focused execution passes four
  server cases and one API case; filtered-out tests are not counted as executed.
- This remediates the concrete identified diagnostic starvation/coupling issue,
  not every possible host saturation or infrastructure failure. Exact logical
  scanning may still be unavailable for very large scopes within 1s; their state
  correctly remains unobserved and needs operational policy/scale assessment.
  Provider terminal outcomes, broader host/analytics/security and full A–I/
  47-section completion audit remain active. No Preview/main host promotion.
- Final `pnpm verify:release` exits zero with 399 tests: 172 API, 30 Web and
  197 Hub (79 SDK/core/adapters, 107 server, 11 Console). Builds, lint and
  typechecks pass. Real Edge four-width/reference/offline acceptance, Python/C#,
  measured performance and 83-migration rehearsal pass; temporary databases
  are absent after the gate. `git diff --check` passes. Existing Vite chunk
  advisory is unchanged. This is a LOCAL checkpoint, not complete Goal acceptance.
- Post-gate preflight confirms 83 migrations, zero reserved AI attempts, zero
  temporary databases and the existing enabled 100,000-token/month configuration.
  Only the identity-verified local API on port 3000 was restarted with this build;
  Hub drain is enabled, normal product Worker is not. External health/readiness
  probe passes and local Web /operations returns HTTP 200. No new provider call,
  credential change, Help republish, real AD or other-app/host change was needed.

## 2026-10-19 — HTTP adapter isolation and cross-domain classification (LOCAL)

- The reusable NestJS interceptor now treats context/capture failure as an
  observation failure only. Business Observables are subscribed exactly once
  even when context entry throws before or after invoking the subscription;
  successful results and the original expected/unexpected exceptions always
  reach the caller unchanged.
- Nine adapter tests cover successful capture failure, 403 and 500 capture
  failure, before/after-entry context failure, expected-rejection classification
  and controlled ticket/authentication/organization-configuration/AI/Assist/
  external-dependency operation routes. A 403 records a non-critical
  `REJECTED` performance outcome and no exception; unexpected failures retain
  their sanitized operation identity for server-side grouping.
- Browser React/render and connectivity paths are exercised by the independent
  real Browser acceptance; actual Jupiter Worker directory/lifecycle paths are
  covered separately by the product-cycle tests. Existing AI, Assist and
  Directory integration suites prove their business denial/failure semantics.
  This adapter fixture verifies observation classification and isolation; it
  does not claim that every domain provider was deliberately failed in a live
  tenant or that an expected business rejection becomes an Incident.

## 2026-10-19 — Real product-service Worker SQL/HTTP integration acceptance (LOCAL)

`apps/api/test/lifecycle-worker.integration.spec.ts` strengthens the already
implemented lifecycle-cycle boundary with real services and storage, rather than
posting a controlled WORKER Event or replacing the services with test doubles.

- A uniquely generated obs069_worker_* database receives all 83 real forward
  migrations. As in migration rehearsal, only the legacy application role name
  is replaced with a generated temporary NOLOGIN role. Product pool connections
  substitute the same fixed SET LOCAL ROLE statement, retaining DatabaseService's
  actual tenant transactions/config/RLS. Shared business roles are never changed
  or removed. The normal configured business DB is never migrated or loaded.
- One active ownerless fixture organization exists only inside that DB. The test
  invokes the ACTUAL SubscriptionLifecycleService, CommercialService and
  DirectoryConnectorService through `runLifecycleWorkerCycle`, the function wired
  into worker.ts. The initial full cycle succeeds. There are no real paired AD
  devices, subscribers, external provider credentials or customer allowance use.
- Renaming directory_connectors inside the disposable DB causes a REAL SQL error
  in directory.scheduleDue. The host binding observes it through its actual
  Node SDK and an authenticated real HTTP Hub listener. Atomic PostgreSQL storage
  proves one source/category WORKER event, worker.job_failed code, the correct
  operation and null automation actor/global tenant. Actual leased aggregation
  creates exactly one Issue. Only fixed PRODUCT_WORKER_FAILED diagnostic content
  reaches host warnings, not the raw SQL Error.
- Restoring the table allows the next actual service cycle to succeed, without
  queuing another failure. The fixture organization remains operational. Finally
  closes SDK/listener/Hub/product pools, removes exactly the generated database
  and its generated role. No connection URL, token, key or raw exception is put
  in evidence or output. Focused integration and API typecheck were rerun after
  correcting the initial CJS-compatible migration-path fixture error.
- This proves the actual extracted product cycle, real service failure, capture,
  persistence, aggregation and recovery. It does NOT prove process bootstrap
  faults or the separate QueueWorker AI/voice/intake drain. That drain still has a
  raw-stack failure catch and needs observation without changing commercial
  settlement/retry/provider behavior; internally caught terminal failures also
  need audit. Remaining broader host/security/analytics and final A–I/47-section
  acceptance are not waived. No target-host promotion or next Goal.
- Composed full-gate QC found a test-fixture interaction with the new 120-scope
  sampling load: retention intentionally schedules disabled scopes as well, so
  processing only the first 50 leases could miss the measured target and leave
  unrelated fixture leases pending. A full rerun also exposed the producer's
  separate 100-scope enqueue bound: draining existing leases alone is insufficient
  if the target was not yet scheduled. The fixture now repeats bounded enqueue
  and actual processing (100 enqueue/50 claim, at most 20 passes), asserts every
  environment was scheduled, and asserts the queue drained.
  It accumulates actual target deletion counts across continuation batches rather
  than assuming the last maintenance snapshot is the only batch. No production
  scheduler/retention rule or assertion was weakened. Focused composed rerun
  passes both performance and later metric-retention acceptance: 100 target raw
  events deleted, two target batches totaling 53.55ms, fixture queue drained;
  120 sampling scopes progress 100/20/0 in 1,086.50ms. The initially failed full
  gate is not reported as passing; a fresh complete gate follows.

## 2026-10-19 — Actual Jupiter saturated-telemetry write isolation (LOCAL)

- The existing actual `TicketController` / `TicketActorService` /
  `TicketService` loopback host now exercises a real authorized saved-view write
  through `HubInterceptor` after filling the normal Node SDK queue to 500.
  The HTTP write returns 201, PostgreSQL contains exactly one scoped row, and
  the observer records one additional drop rather than blocking or replaying
  the business mutation. Cleanup removes the exact fixture row in `finally`.
- The same run retains actual JWT/profile/membership checks, missing/foreign
  membership denial, three successful reads under saturated telemetry, zero
  Hub/provider network calls and response equality between observed/unobserved
  reads. Twenty alternating measured pairs reported baseline p95 19.12ms and
  observed p95 22.81ms (a 3.69ms local sample difference).
- This proves failure isolation and exactly-once effect at an actual Jupiter
  write boundary. It does not claim full AppModule middleware, Browser UI write
  latency, PostgreSQL CPU, production cadence or a universal overhead SLO.

## 2026-10-19 — Bounded storage-sampling scale/fairness (LOCAL)

- The disposable performance acceptance now creates 120 enabled environments
  after sampling the pre-existing current-hour cohort. The real sampler makes
  bounded progress in claims of 100 then 20; an immediate third call returns
  zero. SQL verifies exactly one current-hour sample for every one of the 120
  distinct environments, so the limit does not starve rows beyond its first
  ordered claim and idempotency prevents duplicate work.
- The complete three-call sampling sequence took 1,230.39ms locally against
  empty scale-only scopes, below the explicit 30,000ms regression deadline.
  The existing measured 1,000-event environment logical scan took 68.46ms and
  reported 753,425 logical row bytes. These are disposable LOCAL measurements,
  not physical table/index bytes or a production SLO.
- The scale-only Application is disabled immediately after sampling so it
  cannot contaminate retention or AI scheduling measurements, and is disabled
  again in `finally` for failed-run cleanup. The focused real PostgreSQL/HTTP
  performance case passed: 1,000 events, 304.03 events/s, 5,019.76ms sequential
  aggregation, 42.13ms dashboard p95, 100 retained rows deleted, eleven then
  zero AI jobs and zero provider calls. Its separate concurrent phase completed
  200/200 jobs and five Issues/200 occurrences.
- This closes the representative bounded sampling continuation/deadline gap.
  It does not claim physical-storage scalability, production capacity, or full
  main-product write/Browser automatic-flush overhead.

## 2026-10-19 — Actual Jupiter lifecycle Worker capture (LOCAL)

- `apps/api/src/worker.ts` now routes the existing subscription-expiry,
  active-organization enumeration, commercial provisioning, directory schedule
  and directory-health stages through the generic NestJS `observeJob` boundary.
  The business order and fail-fast/next-minute retry behavior are unchanged.
- Worker attribution is derived only from trusted database enumeration. Global
  stages use no tenant or human actor; per-organization provisioning uses the
  enumerated organization UUID and an explicit null automation actor. An
  enclosing request context cannot leak a human identity into Worker telemetry.
- A failed stage produces one bounded `WORKER`/`worker.job_failed` event. The
  event excludes the exception message and test secret. If Hub context setup,
  capture, or the Hub itself fails, business work still runs exactly once and
  preserves its original result/exception. The fixed-field throttled fallback
  emits only `PRODUCT_WORKER_FAILED`, preventing recursive/raw-error logging.
- The real product cycle is extracted only as a testable orchestration boundary;
  it continues to call the existing lifecycle, commercial and directory
  services. Nine API tests cover every stage, order, trusted tenant attribution,
  enclosing-human isolation, disabled Hub, retry-next-cycle and observer
  failure. Five generic adapter tests cover before/after-entry failure and
  original exception preservation.
- Focused result: NestJS adapter 5/5, complete API 161 passed with one existing
  explicitly skipped test, and both adapter/API typechecks passed. This closes
  the concrete product Worker capture gap; it does not by itself complete the
  remaining scale/security/responsive/final A–I audit.

## 2026-10-19 — Concurrent aggregation and actual ticket read-path boundary (LOCAL)

- The opt-in disposable PostgreSQL performance case now includes an independent
  200-event concurrent arrival/aggregation phase. Actual HTTP sends eight batches
  of 25 with a stated 50ms inter-batch delay; one worker claims 25 with a 10ms
  empty-poll delay. Assertions require aggregation to occur BEFORE the producer
  finishes, all 200 distinct jobs SUCCEEDED and five actual Issues totaling 200
  occurrences. This proves overlap rather than sequential post-ingestion draining.
- Focused run: wall 1,652.86ms; 199 events aggregated while producing; seven empty
  polls; dispatch-to-committed-aggregation p50 129.60ms, p95 207.26ms, maximum
  240.26ms (200 samples). A batch's events share its dispatch timestamp. Latency
  includes HTTP serialization/network, authentication, DB, polling and backlog;
  it is not pure aggregation CPU, the real Jupiter two-second worker cadence or
  production SLO. Scope is a synthetic LOCAL App inside the disposable test DB.
- New API performance helper wraps the ACTUAL TicketController queue endpoint
  in an ephemeral loopback Nest server and uses the ACTUAL TicketActorService,
  TicketService, HubInterceptor and host requestContext implementation. An
  ephemeral signed JWT is verified normally against the fixture active user;
  existing tenant membership is checked by both business and telemetry resolvers.
  Only synthetic App/environment IDs are injected into the uninitialized binding
  fixture; no identity resolver, normal authorization check or membership is
  replaced. No Hub settings, credentials or runtime roles are changed.
- The supported existing test tenant creates/submits a real synthetic ticket
  before measuring. Both warm paths run four times, then twenty baseline/observed
  pairs alternate order to reduce cold-path/order bias. Every response must be
  nonempty and identical between paths; observed replies must contain traceparent.
  Twenty-four observed warm/measured operations must reach the SDK queue.
- Filling the telemetry queue to 500 must not block three subsequent authorized
  queue reads; they produce drops but preserve the successful business response.
  Missing/foreign tenant membership still returns 401 through actual actor checks.
  The no-timer/no-credential SDK never flushes or calls Hub/provider; no external
  quota is used. Session signing material and tokens are never printed/stored.
- Early fixture QC initially passed empty strings where the normal Nest query
  mapping supplies undefined for absent optional filters; the UUID tag filter
  correctly failed. The wrapper now preserves actual omitted-query behavior.
  Another early measurement had an empty fixture queue; the final fixture adds
  an actual submitted ticket and asserts nonempty results. Neither early result
  is promoted to proof of final workflow acceptance.
- This proves a product read-path boundary and capacity failure isolation, not
  full AppModule middleware, write lifecycle, main Browser UX, automatic flush
  interference or every role/workflow. Larger-scale dashboard/sampling fairness/
  deadlines, remaining host/Worker/security and the full A–I/47-section audit
  still remain. No migration/architecture/business contract changes or host
  promotion; the full Goal is IN PROGRESS.
- Source inspection confirms a concrete remaining implementation gap, not merely
  missing screenshots: `apps/api/src/worker.ts` lifecycle/provisioning/directory
  loop currently catches errors to console.error without the Hub SDK/observeJob
  adapter. It must be integrated and tested with safe automation/tenant context
  and sanitized fallback before product Worker capture can be accepted. Reference
  WORKER events/adapter unit tests do not prove this actual host path.
- Full-gate QC exposed nondeterministic AI fixture selection: after the large
  offline load, taking the first unordered Issue could select evidence too large
  for the deliberately small 2KiB AI context. Correct behavior was SKIPPED, not
  SUCCEEDED. The Browser fixture now explicitly selects its known small
  reference.frontend Issue in tenant-a through actual issue/event links; neither
  production context/budget nor the success assertion is loosened. The failing
  gate is retained as a found/fixed fixture defect, not accepted as a full pass.
- Final nonempty-queue full-gate measurement (20 alternating pairs): baseline
  p50/p95/max 15.7764/27.8774/31.9729ms; observed 16.4911/24.8529/25.0340ms.
  P95 difference is -3.0245ms while observed p50 is slightly higher. This is
  sample variation, NOT evidence that instrumentation improves performance or
  establishes a universal zero-overhead bound. Identical responses, trace headers,
  24 captured operations, three saturated-queue successful reads and invalid-
  membership denial all passed. There were zero Hub network/provider calls.
- Concurrent full-gate repeat: 200 distinct successful jobs, five Issues/200
  occurrences; 196 events aggregated while the producer remained active; wall
  1,638.72ms, dispatch-to-commit p50/p95/max 122.33/202.55/238.61ms. All polling/
  cadence/measurement limitations above remain. Actual product Worker cadence
  and full AppModule/Browser/write workflows are still not accepted by this test.
- Final release gate exits zero: 369 tests (153 API, 30 Web, 186 Hub), all builds,
  lint/typechecks, real Edge/Python/C#, full offline/performance flags and the
  83-migration rehearsal. Existing Vite chunk-size advisory remains. Test data
  uses the existing supported ticket fixture teardown and disposable Hub DB;
  no temporary user/membership was added outside those test paths. This phase
  changes tests/evidence only, so the healthy owned local runtime requires no
  restart or host promotion. Normal Help and the approved live provider budget
  remain unchanged. Full GOAL-069 completion is still unproven.

## 2026-10-19 — Full-limit real Browser offline measurement and batching QC (LOCAL)

The independent reference now has a development-only `performance.html` fixture.
It authenticates through the existing reference host, uses the real Browser SDK
and IndexedDB without reducing the default 500-item/2,097,152-byte limits, then
uses actual browser network-offline, renewal/reload and manual flush over HTTP.
It is not a new Jupiter page/navigation or a production build entry. No consumer
business module, user credential or live AI provider is involved.

- Two separate real Browser storage namespaces exercise count and byte saturation.
  Count case accepts 500 and rejects attempt 501; stored data envelopes total
  436,000 bytes. Large UTF-8/stack case accepts 169 and rejects attempt 170;
  stored data envelopes total 2,085,798 bytes. Metrics have their separate bounded
  journal. Exact data-byte accounting includes envelope metadata, not just payload.
- Actual offline flush retains every queued event. The same sorted event IDs are
  read from IndexedDB before/after a real page reload and credential renewal.
  Subsequent SQL proves 500/169 distinct persisted rows respectively, with no
  duplicate or missing event. Checks inspect every outbound batch request, not
  only successful responses; count, UTF-8 body bytes, HTTP result and network
  failure flags must all satisfy the contract. Metric journal bounds are checked
  after fill and replay too. Context/process/listener and disposable DB cleanup
  remain in finally; nothing is loaded into Jupiter's business tenant.
- QC found the SDKs selected batches by count only. Fifty individually valid
  large events can exceed the existing 524,288-byte request limit. Browser retry
  timing could accidentally split them into smaller successful cohorts, masking
  the flaw: one baseline run retained 57 queued events after its bounded replay,
  another eventually delivered all 169 through variable-size retry cohorts.
  This is not evidence of guaranteed data loss, nor was the flaky baseline marked
  successful acceptance. New tests observe all attempts, including failed ones.
- Browser and Node now greedily preserve pending order while limiting BOTH 50
  events and exact UTF-8 JSON wrapper/comma/payload bytes per request. Node uses
  its existing cached payload byte sizes. No server/request contract, tenant
  scope, ACK semantics, retry budget, queue schema or migration changes.
- Empty diagnostic deltas no longer rescan the full Browser journal on every
  capture. The fixed metric buffer exposes a non-consuming pending check;
  persisted reports still replay normally. Unit tests compare actual journal
  read counts with diagnostics enabled/disabled for an empty delta and preserve
  all existing metric retry/context cases.
- Large-event regression fixtures also exposed repeated greedy email-local-part
  scanning in redaction: 60 contiguous 8,000-character frames exceeded the old
  five-second unit deadline. The matcher now starts at domain markers and scans
  the local part backwards, preserving the existing ASCII masking policy and
  its position between the same other masking rules. The normal deadline was
  NOT raised. Golden overlapping/invalid/Unicode cases and 1,000 deterministic
  generated strings compare exactly to the prior matcher; long no-email, invalid
  suffix and valid-email frames are covered. Both SDK suites now complete normally.
- Fixed standalone Browser measurement before the final shared-redactor update:
  count fill 7,438.70ms, capture p50/p95/max 13.40/30.90/52.30ms, offline flush
  292.30ms, ten replay requests/4,446.20ms. Large fill 6,593.40ms, capture
  p50/p95/max 37.60/75.60/95.60ms, offline flush 228.40ms, four replay requests/
  2,066ms. Large requests contain 43/43/43/40 events (518,119/518,119/518,119/
  481,972 bytes), all HTTP 200. These are async capture wall times including
  IndexedDB waits, not main-thread blocking time. Full-gate measurements below
  cover the final shared-redactor version; microbench timings are machine-local.
- CDP samples measure JS heap before/after fill; they are NOT retained memory,
  peak memory or browser-process RSS. CDP TaskDuration/ScriptDuration deltas cover
  the fill interval including fixture UI, not isolated SDK CPU. Heap/GC noise and
  initial-load effects remain explicit. Metrics are numeric/structural only;
  tokens, raw events, stacks, actor IDs and payload text are not printed.
- This adds real full-limit offline evidence, not whole section-64 completion:
  main Jupiter workflow/API overhead, concurrent arrival-to-Issue latency,
  representative larger-scale queries and logical sampling fairness/deadlines
  remain. Real Worker/host breadth, final security/cleanup and full A–I/47-section
  audit remain active. No Preview/main promotion and no next Goal.
- Final shared-redactor Browser run: count fill 8,079.80ms (p50/p95/max capture
  15.40/34.20/50ms), replay 4,582.80ms/ten batches; large fill 6,751.90ms
  (37.70/82.70/98.60ms), replay 2,114.30ms/four byte-bounded batches. CDP heap
  samples before/after are 2,654,812/19,525,816 bytes (count) and
  2,654,300/12,617,976 bytes (large). Fill-interval task/script deltas are
  4.180627/1.310675 seconds and 3.398741/0.303928 seconds respectively. These
  measurements were captured by the real Browser flow in the first full gate;
  that gate later failed due to unprocessed fixture aggregation contaminating
  subsequent tests, so it was NOT reported as a passing full release.
- QC fixed that fixture contamination by fully draining its real AGGREGATE jobs
  rather than processing only one claim of 50; an explicit SQL assertion proves
  no performance-source aggregation job remains pending/running before later
  suites. No production queue/lease policy or assertions were weakened. Repeated
  complete release gate then passes 368 tests (152 API, 30 Web, 186 Hub: 72
  SDK/core/adapters, 103 server, 11 Console), all builds/lint/typechecks, real
  Edge/Python/C#, performance flags and 83-migration rehearsal. Existing Vite
  chunk-size advisory remains; no next Goal or production promotion follows.
- Owned local API was restarted after zero-active-attempt preflight to load both
  SDK fixes/shared redactor. Initial probe during startup returned UNKNOWN; the
  same live process/session was re-polled, not restarted on observation timeout.
  Nest subsequently confirmed startup and the external probe passed. Local Web
  remains available on 5174. No other host/service was changed.

## 2026-10-19 — LOCAL measured load and Node capture remediation (IN PROGRESS)

This is a measured section-64 checkpoint, not complete performance or production
capacity acceptance. The new opt-in `OBSERVABILITY_PERFORMANCE_ACCEPTANCE=true`
case runs FIRST inside the existing disposable PostgreSQL fixture, using normal
HTTP credential verification, RLS/atomic ingestion and real leased job services.
It does not migrate or load the configured business DB. Fixture cleanup drops the
temporary DB; its synthetic App is disabled before other acceptance cases run.

Standalone measured run (1,000 events, 20 actual HTTP batches of 50, concurrency
two, five synthetic tenant scopes/50 actors, 100 failed operations):

| Measurement | Actual LOCAL result |
| --- | --- |
| HTTP ingestion wall time / throughput | 3,133.36 ms / 319.15 events/s |
| HTTP batch p50 / p95 / max (20 samples) | 293.00 / 414.03 / 447.00 ms |
| Sequential real worker aggregation (1,000 jobs, claims of 25) | 5,691.74 ms |
| Aggregation shared Node-process CPU | 1,626 ms user+system |
| Aggregation RSS before / after | 206,053,376 / 253,005,824 bytes |
| Aggregation heap before / after | 91,124,752 / 118,451,296 bytes |
| Actual HTTP dashboard p50 / p95 / max (20 samples) | 30.70 / 42.65 / 46.56 ms |
| Logical storage sampling (three enabled fixture environments) | 55.51 ms; measured App 753,425 logical bytes |
| Real retention execution / confirmed old raw events deleted | 32.90 ms / 100 |
| AI scheduling first / repeat | 30.02 / 8.64 ms; 11 then zero new jobs |

- The dashboard asserts the actual cohort: 1,000 operations and 100 failures.
  Every batch asserts 50 ACCEPTED ACKs; every aggregation lease settles once.
  Retention verifies persisted deletion counts. Scheduling uses the existing
  Investigator service with an in-process provider that must never be called;
  provider call count is zero. No live GapGPT or customer allowance is consumed.
- Resource numbers belong to the shared test Node process, not PostgreSQL CPU,
  a separate production worker, peak memory, retained memory or a leak claim.
  HTTP timings include local auth/serialization/storage and fixture assertions;
  aggregation is measured after ingestion, not a concurrent end-to-end arrival
  latency. No production SLO or user-workflow non-regression follows from these
  small load results. The focused run has one executed performance case and 81
  filtered-out cases; those 81 are not counted as executed acceptance.
- Baseline SDK review found `capture()` serializing every queued event to sum
  bytes, O(queue length) per call even when saturated. Pending envelopes now
  retain their encoded byte size with an incremental total, decremented on
  terminal ACK/retry exhaustion and reset on shutdown. Existing count/byte caps,
  telemetry, identity, fallback, retry and wire contracts are unchanged; no ADR,
  entity, migration or API change is involved.
- `observability/packages/node-sdk/test/performance.ts` records 1,000 capture
  attempts against a full 500-event queue with no network/provider and a no-op
  fallback. Before: p50 1.4310 ms, p95 2.1439 ms, max 5.8523 ms, CPU 1,843 ms.
  After: p50 0.0321 ms, p95 0.0565 ms, max 0.7131 ms, CPU 31 ms. Independent
  rerun: p50 0.0322 ms, p95 0.0567 ms, max 0.9219 ms, CPU 46 ms. All preserve
  exactly 500 queued/1,000 dropped. This is a local microbenchmark, not a universal
  speedup or all-operation overhead estimate. Heap/RSS deltas fluctuate with GC.
- Added regression coverage for exact byte reclamation after ACCEPTED, DUPLICATE
  and REJECTED ACKs, retry exhaustion and undelivered shutdown. Existing async
  identity, fallback, partial ACK and diagnostic transport tests remain required.
- Still required: measured Browser IndexedDB/full-limit memory behavior, main
  Jupiter workflow/API overhead, concurrent arrival/aggregation latency and
  representative larger-scale dashboard/storage sampling cost/fairness/deadline
  review. The current sampler performs scoped logical-row scans; a 1,000-event
  fixture does not prove safe scan cost at scale. Real Worker/host breadth,
  security/final cleanup and the full specification/A–I audit remain active.
- Repeated within the full release gate: 329.47 events/s, batch p95 366.97ms,
  aggregation 5,652.73ms, dashboard p95 39.34ms; sampling 59.33ms/753,209 logical
  bytes, retention 41.51ms/100 events, AI scheduling 28.61ms then 8.83ms with
  eleven then zero new jobs and zero provider calls. Full gate passes 363 tests
  (152 API, 30 Web, 181 Hub: 67 SDK/core/adapters, 103 server, 11 Console), all
  builds/lint/typechecks, actual Edge/Python/C# and 83-migration rehearsal. All
  optional acceptance flags, including the new performance flag, were enabled.
  Existing Vite chunk-size advisory remains. Temporary database count is zero;
  configured monthly budget remains 100,000 and no live AI attempt is active.
- The verified owned local API process was restarted after that zero-active-
  attempt preflight to load the rebuilt optimized Node SDK. Its independent
  health/readiness probe passes and local Web /operations returns 200. No other
  service or target host was restarted, and existing Help publication remains.

## 2026-10-19 — Persian Product Help publication and real Jupiter UI (LOCAL)

Section 63's eleven guides now use the existing versioned Help engine. They are
public educational (`ALL`) content without tenant/App records, identities or
credentials; reading a guide never grants operations access. Existing private
guides retain their audiences. No Help architecture or SQL migration changed.

| Published slug | Validated contextual feature | Canonical route |
| --- | --- | --- |
| observability-feedback | OBSERVABILITY_FEEDBACK | /feedback |
| observability-offline | OBSERVABILITY_OFFLINE | /feedback |
| observability-console | OBSERVABILITY_CONSOLE | /operations |
| observability-concepts | OBSERVABILITY_CONCEPTS | /operations |
| observability-severity | OBSERVABILITY_SEVERITY | /operations |
| observability-incidents | OBSERVABILITY_INCIDENTS | /operations |
| observability-applications | OBSERVABILITY_APPLICATIONS | /operations |
| observability-ai | OBSERVABILITY_AI | /operations |
| observability-ai-limits | OBSERVABILITY_AI_LIMITS | /operations |
| observability-privacy | OBSERVABILITY_PRIVACY | /operations |
| observability-integration | OBSERVABILITY_INTEGRATION | /operations |

- Initial catalog: 19 articles. Existing bootstrap produced seed revision 1 for
  the eleven new guides; supported actor-bearing publication then revised and
  published all eleven as RUNTIME revision 2. Final inventory: 30 articles, all
  published. A repeated explicit publication returns eleven unchanged, zero new
  drafts/revisions. Existing non-Hub article identities, published pointers and
  revision counts were compared before/after and unchanged. History is preserved.
- `publish:help-catalog --actor-id=<authorized actor> --slug=<catalog slug>` now
  supports repeatable explicit selection. Every requested slug must exist before
  any write; duplicate selections dedupe. Omitting selection retains the existing
  full-catalog behavior. This acceptance selected only the eleven Hub articles,
  using the existing active local Platform Admin, not a fabricated actor.
- Jupiter-only Help adapter is available in /operations, the /platform monitoring
  panel and /feedback. It uses normal authenticated Help requests and published
  slug resolution, renders plain text (no injected HTML), rejects mismatched or
  unavailable responses, aborts replaced/closed requests and clears on session
  events. Feedback offers only its three relevant topics; Console offers all 11.
  Independent Console/server packages do not import Jupiter Help or domain code.
- `scripts/accept-observability-help.mjs` uses the actual local login form and
  existing authorized account. Installed Edge opened all eleven guides at 375,
  768, 1024 and 1440 in /operations, exercised /feedback's three-topic selector,
  and opened the guide within the real /platform shell at all four widths.
  Actual article response slug/title/content, RTL, 44px trigger, Escape close,
  document width AND full reader bounding-box visibility were checked. Anonymous
  lookup of a private pre-existing Platform guide still returned 404.
- Visual review caught desktop popover clipping that document-scrollWidth alone
  missed. The scoped reader now stays within the viewport with bounded scrolling;
  the new bounding-box assertion and rerun passed. Updated local screenshots in
  ignored `output/goal069-help` were visually reviewed at 375/1440. Existing brand
  tokens and Shabnam remain unchanged; no new product navigation is introduced.
- Credentials are supplied only through ephemeral process environment; no test
  credential/session/trace is saved. Finally the supported logout endpoint is
  called and refresh is verified 401 before the browser context is destroyed.
  No temporary user, membership or organization was created for this acceptance.
- Full release gate passes 360 tests: 152 API, 30 Web and 178 Hub, including real
  independent Edge/Python/C# reference execution and 83-migration rehearsal.
  Builds, lint and typechecks pass; Web was rebuilt after the final reader CSS
  correction. Existing Vite chunk-size advisory remains. The new Help integration
  tests validate all contextual lookups and publication selection; broad Persian
  AI search now accepts the genuinely relevant new monitoring AI guide too.
- This completes this Product Help checkpoint, not GOAL-069. Performance/scale,
  real product Worker and remaining host workflows, full security/cleanup and
  requirement-by-requirement specification/A–I/47-section audit remain active.
  No Preview/main host changed and no next Goal started.
- The owned local API was restarted with the rebuilt Help registry after a
  zero-active-AI preflight; the external readiness probe and the complete real
  Jupiter Help acceptance were rerun successfully against that runtime. No
  service on 5173 or another host/database was changed.

## 2026-10-19 — Automatic diagnostics and shared self-health Console (LOCAL)

- DEC-044 adds automatic report transport on the existing API. Browser journals
  METRICS envelopes in the existing IndexedDB object store (no SQL/storage-schema
  migration), at most ten/16 KiB apart from the event count/byte budget. UUID/body
  remains stable through lost ACK, renewal and reload. Reports carry fixed
  counters/original partition, never credentials. Rate, twelve-attempt/48-hour
  bounds and old-server 404 handling cannot delete user events or recursively
  create event-loss reports. Node reports are bounded process memory, not durable
  across process death and not attributed to the last request's ALS actor.
- SDK expected App/environment headers are equality assertions against the
  credential, not scope selection. Both hosts/CORS preserve them. Actual HTTP
  wrong-App assertions deny with safe METRIC_SCOPE_MISMATCH; old manual callers
  without assertions remain credential-bound. OpenAPI stays at 46 operations.
- Real installed Edge acceptance over disposable PostgreSQL creates actual queue
  overflow, intercepts a metric response AFTER commit, inspects its real IndexedDB
  envelope, reloads/renews credential and observes the same report body/UUID
  retried. SQL proves exactly one CLIENT_REPORTED row, not a direct fixture claim.
  Existing real offline event replay, logout/credential revocation, next-actor,
  tenant-switch, storage-denial, correlation/Feedback/AI-reference checks still run.
- A separate real backend SDK test over HTTP overflows its queue, discards the
  committed metric response, waits the actual retry interval and proves one
  SERVER_SDK_REPORTED row with the same body. No external provider is used.
- Persian shared Console health is authenticated through its independent host
  identity port and current explicit grants. Measured Browser/Node source groups,
  unobserved/null values, logical storage basis and environment-wide scope are
  readable at 375/768/1024/1440 RTL with no document overflow. A VIEWER App denies
  the health query and clears prior fields. Unknown Node observations are not
  presented as healthy zero. This is not blanket live-Jupiter host-shell acceptance.
- Screenshots at 375/1440 were visually reviewed. QC found unrelated generic
  list/table/pagination/CSV below health; rendering now positively selects record
  sections only and Browser asserts those controls are absent. No brand palette,
  product shell or business API changed; refresh retains a 44px target.
- Concurrency QC adds generation checks after JSON body parsing and serializes
  retry writes with scope/logout purge. Deliberately delayed event, feedback and
  metric bodies cannot update the next actor's counters/tracking/status. Initial
  sessions purge foreign rows, status reads synchronize scope, and stopped SDKs
  never call a signed-out context provider. These are explicit regression tests.
- Diagnostic coverage descriptor is now SCOPED_DIAGNOSTIC_METRICS; legacy
  SOURCE_COLLECTION_IN_PROGRESS remains schema-compatible. This is not an overall
  health Boolean or exact loss ledger: pre-journal increments, saturation, memory
  fallback, missing/opted-out sources and process loss remain explicit limits.
- No whole-Goal completion is claimed. Product Help/runtime publication,
  performance/scale (including logical-sampling cost/fairness), real Worker/host
  breadth and the complete specification/A–I/47-section audit remain required.
- Final checkpoint release gate passes 356 tests: 150 API, 28 Web and 178 Hub
  (65 SDK/core/adapters, 102 server, 11 Console). API/Web/Hub builds, lint and
  typechecks pass with real installed Edge, separate-process Python/C# reference
  clients and the 83-migration rehearsal enabled. Existing Vite chunk-size
  advisory remains. The Browser overflow fixture now blocks only event-batch
  delivery while filling the queue, avoiding the legitimate periodic-drain race;
  metric delivery and actual lost-ACK/reload acceptance remain real.
- Local API was restarted only after verifying its owned process and zero active
  AI attempts; Web runs on 127.0.0.1:5174 (5173 was not touched). The external
  health/readiness probe passes and /operations returns HTTP 200. An authorized
  existing-principal service check returns SCOPED_DIAGNOSTIC_METRICS, queue depth
  zero and a real storage snapshot/growth observation. Server event counters are
  currently unobserved, not fabricated zero. This service check is not live-host
  authenticated Browser acceptance. No temporary test database or workspace
  cleanup target remains; normal tenant data and Help were preserved. The
  encrypted, enabled provider configuration retains its approved 100,000-token
  monthly budget. No Preview/main host was changed.

## 2026-10-18 — Scoped self-metric foundation (LOCAL, IN PROGRESS)

- DEC-043/migration 072 add immutable fixed-counter HealthReport and hourly
  StorageSample tables (27 Hub tables, 83 migrations). Composite FK/RLS and
  worker-only write/delete grants preserve existing runtime isolation. Reports
  retain eight days, snapshots the aggregate policy window, through bounded
  atomic audited retention. Real tests preserve eligible replay receipts.
- Actual ingestion ACKs produce SERVER_MEASURED accepted/duplicate/rejected/
  retryable/failed-batch counts without payloads. A bounded 200-report out-of-band
  buffer retries the same UUID/hash, catches storage/logging errors and emits
  fixed overflow/failure diagnostics; it is best effort across process death.
  Unit tests cover outage/recovery, bounded cardinality and an empty-flush guard.
- SDK POST takes only UUID/time/three bounded counters. Credential supplies scope,
  actor and provenance. Report replay, changed body/actor conflict, unauthorized
  origin/identity fields, revoked credential and current ADMIN authority are
  exercised against real HTTP/PostgreSQL. Reported counts never become server
  measurements or Incident evidence. No raw report/actor/secret is projected.
- Environment-wide ADMIN self-health API has one-hour source-separated counters,
  queue/aggregation/Issue/alert/AI/retention measurements and hourly logical-row
  storage growth. Tenant ADMIN/cross-App/cross-env/revoked grants are denied.
  Initial growth/recovery observations are null, not fabricated zero. Real
  snapshot tests measure growth after persisted rows and one sample per hour.
- Both new operations are covered by real OpenAPI request/response parity (46
  total). Public health/readiness stays unchanged. Storage basis excludes physical
  disks/indexes/global metadata/shared databases. See `SELF_MONITORING.md` for
  units, unobserved state and collection limitations.
- Shared SDK metric buffer keeps immutable UUID/delta through lost ACK, bounds
  each report and carries later counts forward. Browser/Node ports count actual
  retry ACK recovery, queue/expiry/rejection loss and clear old Browser scope.
  QC fixed Browser TTL expiry not incrementing drops and Node rejected ACK not
  being counted as loss. These ports are not automatic report transport yet.
- Outage review found sequential persistence could multiply a connection timeout
  by 50 entries. The batch now attempts storage once after an unexpected failure,
  preserving all remaining valid IDs as RETRYABLE; a 50-event test proves the
  bound. Validation rejects remain separate. No committed ACK depends on metrics.
- Still required within this same Goal: automatic authenticated SDK reporting,
  report persistence/reload behavior, self-health Console, actual Browser source/
  RTL acceptance, remaining host/worker breadth, Help/publication, performance and
  final A–I audit. API coverage is deliberately SOURCE_COLLECTION_IN_PROGRESS.
- Full release gate passes 150 API, 28 Web and 162 Hub tests (52 SDK/core/adapters,
  101 server, nine Console): 340 total, with real Browser and separate-process
  Python/C# flags enabled. All builds/lint/typechecks, 83-migration rehearsal and
  diff check pass; existing Vite >500-KiB advisory remains. Fresh-credential SDK
  report replay is additionally verified as duplicate with no extra count.
- Migration 072 is applied only to the verified local loopback database. After
  zero-active-AI preflight, only the owned local Jupiter API was restarted.
  Authorized service-level runtime check sees an actual storage snapshot, null
  first growth and unobserved server counters; no synthetic customer event was
  inserted to manufacture observations. This is not authenticated Console UI
  acceptance. The local external health/readiness probe passes.
- No temporary Hub acceptance DB remains; workspace cleanup dry-run has zero
  targets. Owner-approved enabled 100,000-token monthly budget is unchanged.
  No Preview/main/co-hosted application or tenant/business data was modified.

## 2026-10-18 — Critical/pipeline warnings and independent probes (LOCAL)

- DEC-042/migration 071 add `CRITICAL_EVENT` with default threshold/minimum 1.
  Existing nine rules/configurations remain. Forward rehearsal seeds an existing
  disabled ERROR_BURST override and proves it survives while the new rule is
  added. OpenAPI enum/rule-count bound becomes ten; all 44 routes remain unchanged.
- Real PostgreSQL tests exercise all ten rules, plus Browser CRITICAL/HTTP 403
  negatives followed by one trusted server Critical 500 producing one Incident.
  This test exposed/fixed `failureSeverity` downgrading every 5xx to ERROR.
  A legacy downgraded Issue fixture also verifies the critical Incident uses
  trusted raw evidence rather than stale Issue severity.
  Existing Incident dedupe/cooldown/lifecycle and worker-specific rule remain.
- Terminal FAILED pipeline jobs create one scoped alert per App/env/tenant/kind/
  15-minute failure window (last 24 hours, no future timestamps). Concurrent
  sweeps dedupe. Actual queue attempt 11 failure retries without alert; attempt
  12 terminal failure alerts. Different tenants/kinds stay distinct; old failures
  and recursive delivery failures of pipeline warnings do not create storms.
  One resulting warning is delivered to the normal recipient inbox in acceptance.
- Host detection/enqueue precedes rule evaluation. Generic fixed-field diagnostic
  logs remain outside ingestion, rate-bound per code/minute and sink-failure safe.
  Six actual independent probe-process tests cover health+ready success, controlled
  storage-unavailable 503 despite liveness, redirect refusal, oversized/wrong-service JSON and
  rejection of network HTTP/credential-bearing URLs. No secret/raw error is output.
- `observability/EXTERNAL_MONITORING_RUNBOOK.md` defines unauthenticated narrow
  probe semantics, independent scheduling/recovery/log collection and failure-domain
  limitations. It does not install Staging monitoring or expose tenant metrics.
- Full self-metric collection, remaining workflow/analytics/host breadth, Product
  Help/runtime publication, performance and final A–I completion audit remain.
  Do not equate these probes or the queue panel with full self-monitoring.
- Complete release gate: 150 API, 28 Web and 141 Hub tests (41 SDK/core/adapters,
  91 server/contract/diagnostic/probe, nine Console): 319 total. Real Browser and
  Python/C# flags were enabled. Builds, lint/typechecks, 82-migration rehearsal
  and diff check pass; existing Vite >500-KiB advisory remains.
- Full external-client parity uncovered a fixture-order assumption: tenant-free
  reference alerts could precede tenant-specific alerts under durable pacing.
  The test now advances only its disposable fixture job due times, verifies both
  tenant Incident/important-feedback copies, and never changes product pacing.
- Migration 071 was applied only after local loopback verification and gates;
  zero active AI reservations preceded restart of only the owned Jupiter API.
  Actual external probe of the running local host returns health/readiness OK.
  No temporary Hub acceptance DB or local cleanup target remains. The enabled
  100,000-token monthly budget is unchanged. No Preview/main/co-hosted service
  or tenant/business data was changed.

## 2026-10-18 — Bounded alert delivery and important feedback (LOCAL code)

- Migration 070 adds delivery cursor/completion, backfills already-successful
  legacy jobs and adds a scoped queue index. No new business table/API contract.
- Each transaction delivers at most 100 currently eligible principals; inbox,
  cursor, continuation and job completion are atomic. Real PostgreSQL acceptance
  delivers to 1,006 distinct recipients with no duplicate on replay. No fixed
  1,000-recipient failure remains. Grants are reevaluated each page; new UUIDs
  behind a cursor are not retrospectively replayed. Revoked reads remain denied.
- Concurrent repair sweeps schedule new alert starts at least 15 seconds apart
  per Application/environment. Continuations are immediate. This preserves all
  backlog, not instant delivery, user-channel suppression or complete flood health.
  Existing queue status exposes pending work; retention protects all page jobs.
- Only authorized human triage of BUG/USAGE_PROBLEM creates an important-feedback
  alert, once per feedback. NEW submissions do not alert. Persisted sanitized
  subject/scope are used. The negative test found a wrong-tenant request reaching
  reply RLS rejection; an explicit persisted-tenant comparison now returns the
  safe domain denial before any writes. Ordinary actor denial and dedupe pass.
- DEC-041 records these semantics. Full release gate passes 150 API, 28 Web and
  129 Hub tests (41 SDK/core/adapters, 79 server, nine Console): 307 total, with
  actual installed-Edge and separate-process Python/C# flags enabled. All builds,
  lint/typechecks, 81-migration forward rehearsal and diff check pass. Existing
  Vite >500-KiB chunk advisory remains; not a new build failure.
- Migration 070 was then applied only to the verified loopback local database
  (81 migrations). Zero active AI reservations were checked before restarting
  only the owned local Jupiter API. The configured enabled monthly combined token
  cap is verified as 100,000 without exposing the key. No temporary Hub acceptance
  database remains; workspace cleanup dry-run has zero targets. Normal Help and
  tenant data remain intact. No Preview/main or co-hosted application changed.
- Full self-monitoring, pipeline/critical source coverage, Help/publication,
  performance and final requirement-by-requirement A–I audit remain outstanding.

## 2026-10-18 — Independent real-Browser acceptance (LOCAL)

- Added `@observability/reference-browser` in `observability/examples/browser`:
  generic Browser/React/Node SDKs and shared Console, separate backend verified-
  session port; no Jupiter domain/User/membership/ticket/API imports. The backend
  mints only resolved authenticated scope, rejects client scope bodies/unknown
  tenants and validates same-origin commands. Server secret stays backend-only.
- `observability/server/test/browser-acceptance.ts` is enabled explicitly by
  `OBSERVABILITY_BROWSER_ACCEPTANCE=true`. Actual installed Edge is launched
  headless with a fresh temporary context, not an existing profile. The harness
  creates two independent Applications/environments and explicit operational
  grants/session identities in the disposable real PostgreSQL fixture.
- Real native Browser fetch, frontend error, backend Node SDK error, React
  boundary and user Feedback persist. Browser/backend failures have identical
  trace/request IDs. Real aggregation produces independent Application B Issues.
  Console discovers/selects Apps A/B and a cross-App environment combination
  is denied. No Jupiter business dependency is imported by the reference.
- Browser context networking is fully disconnected before capture. An actual
  IndexedDB sanitized envelope is inspected (no test secret/server credential).
  Connectivity is restored with ingestion still intercepted offline; page reload
  reopens IndexedDB and the original ID remains. Re-enabling delivery persists
  that same ID. A separate interceptor discards a real ACK AFTER commit; bounded
  retry clears the queue and PostgreSQL still contains exactly one matching row.
- Offline tenant switching deletes old-scope queued data rather than relabeling
  it. Tenant-free authenticated Feedback persists. Logout clears durable queue
  and revokes all actor Browser credentials; a second host-authenticated actor
  reuses storage without old actor events. Forced IDBFactory SecurityError
  verifies visible MEMORY fallback and continued capture/UI; no storage guarantee.
- Independent Application B Investigator runs with persisted evidence, validates
  citations and records success through a controlled provider port. No external
  GapGPT call or real budget is used here. This is separate from earlier actual
  authorized local GapGPT evidence; it is not an external-provider connectivity
  test for this disposable Application.
- Shared Console maintenance renders authenticated RTL/no document overflow at
  375/768/1024/1440; unconfirmed save disabled, explicit reason/acknowledgement
  saves unchanged default policy ONLY in fixture. This closes shared-component
  maintenance Browser acceptance, not all final live-Jupiter screen acceptance.
  Screenshots are local ignored output (`output/goal069-browser`); inspect them
  as visual evidence rather than relying only on scroll-width measurements.
- QC defect: default native fetch was stored and invoked with the SDK as receiver,
  producing illegal invocation before any ingest request. Custom-transport tests
  missed it. Wrapped native fetch, added regression and reran real-browser flow.
  Explicit accessible labels also fix exact Application/environment lookup.
- Reference README documents fixture auth responsibilities, executable commands,
  network/retry guarantees and limitations. All listeners/browser/temporary DB
  cleanup use finally paths. No new migration/live tenant change/provider spend
    or target-host promotion occurred. Full self-monitoring, remaining alerts/flood,
    runtime Help, performance and whole-Goal final audit remain open.
- Complete `pnpm verify:release` ran with BOTH Browser and Python/C# execution
  flags enabled: 150 API, 28 Web and 126 Hub tests passed (41 SDK/core/adapters,
  76 server/contract/provider including one comprehensive real-Browser case,
  nine Console). The reference build/lint/typecheck passes; its no-test-file
  script does not add invented acceptance counts. All workspace builds/lint/
  typechecks and 80-migration rehearsal pass. Final same-origin protocol check
  was rebuilt and the full Browser scenario rerun with success. Pre-existing
  Jupiter Vite chunk advisory remains explicit. Final cleanup dry-run has zero
  targets; no temporary `obs069_*` DB remains, with one non-archived workspace
  and 80 applied migrations in the local business DB (unchanged this checkpoint).

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
| C | schema/RLS, atomic ingestion, browser/API/worker capture | PostgreSQL and Jupiter Browser/API/actual QueueWorker and lifecycle-service coverage implemented; complete process/bootstrap/host acceptance pending |
| D | IndexedDB/replay/backoff/logout/scope isolation | protocol plus actual independent Edge/IndexedDB/network-loss/reload/lost-ACK/tenant/logout/next-actor/storage-denial verified; final host breadth audit remains |
| E | fingerprint, issues/incidents/rules/alerts | ten rule scenarios, human assignment/notes/transitions, recipient delivery, pacing, important feedback and terminal pipeline warning tests implemented; final host/workflow breadth audit pending |
| F | feedback/user tracking, Console/live/analytics/export | own Feedback, live/filter/CSV, ten scoped analytics and explicit multi-product comparison implemented; final authenticated host workflow acceptance pending |
| G | evidence-grounded AI, opt-in/budget/schedule/security | implemented; real GapGPT findings/usage, SQL isolation/budget/scheduler and reconciliation UI verified; final breadth QC pending |
| H | independent second application, C#/Python clients | actual Python/C# and separate Browser/backend reference execution verified with real PostgreSQL; reference AI uses controlled provider, actual GapGPT evidence remains separate |
| I | retention, self-health/runbook, Help, full QC/cleanup | bounded retention, external probe/runbook, automatic diagnostic sources/shared self-health Console and eleven runtime-published Persian guides/actual Jupiter Help UI verified; scale/performance, actual host/Worker breadth and final A–I QC/cleanup pending |

## Required evidence sections — implementation/execution/result/limits index

This replaces the previous names-only list, not the full requirement audit.
Each of the 47 required sections has four explicit fields below. Detailed dated
checkpoints above remain the execution records, including superseded failures.
An index entry is not a blanket completion verdict for its entire domain.

Path abbreviations: O = `observability/`; A = `apps/api/`; W = `apps/web/`.
S = `O/server/test/persistence.integration.test.ts` (actual PostgreSQL/HTTP);
B = `O/server/test/browser-acceptance.ts` plus `offline-browser-acceptance.ts`;
G = executed full `pnpm verify:release` with Browser/reference/performance flags.
The latest executed G=421 tests, with the zero-exit React checkpoint above.
References to G below identify executed coverage, not tests merely present.

| Required section | Implementation path | Tests executed | Actual result | Limitations / remaining proof |
| --- | --- | --- | --- | --- |
| 1. Initial Architecture Inventory | Architecture inventory table in this document; `.ai/DECISIONS.md` DEC-038 | Repo/package/worker inventory in Phase A | Existing modular host/pg queue and extraction boundary documented | Inventory alone proves no runtime behavior |
| 2. Product-Agnostic Architecture | O/packages; O/server; Jupiter adapters in A/src/observability | G builds plus independent Browser/Python/C# execution | Generic consumers run without Jupiter user/ticket imports | Final requirement audit must still inspect every boundary |
| 3. Package Boundaries | Six O/packages package.json/src trees | G package builds/typechecks/tests | Contracts/core/SDK/adapters build independently | No new public release/package registry publication claimed |
| 4. Application Registry | O/server/src/registry.ts; W/src/PlatformPro.tsx | S registry/bootstrap/grants/revocation; B registry workflow | Scoped App/environment registration and current grants enforced | Full authenticated Jupiter admin workflow breadth remains |
| 5. Event Contract | O/packages/contracts/src/index.ts | contracts contract.test.ts; S strict HTTP validation | Schema/version/field/scope constraints and safe reason codes tested | No arbitrary payload extension approved |
| 6. OpenAPI | O/server/src/openapi.ts, http-api.ts | openapi.test.ts; S every documented operation over HTTP | 48 operations have actual request/response parity checks | Future routes must extend parity; no external SDK generation claim |
| 7. SDK Authentication Model | O/server/src/registry.ts; A/src/observability/hub-binding.service.ts | S expired/revoked/forged scope; B host session/mint/logout | Separate trusted-server, Browser and operational identities tested | Reference login is not Jupiter password-login acceptance |
| 8. Database Model | A/migrations/063–072 observability migrations; O/server/src/database.ts | S RLS/FK/runtime immutability | Dedicated schema/roles and composite scopes operate in SQL | Shared logical row size is not physical disk isolation |
| 9. Migrations | A/migrations, existing forward runner | S full clean-database rehearsal (83 files) | Forward chain runs; disposable DB/role removed | No preview/main or staging migration deployment here |
| 10. Tenant and Application Isolation | O/server/src/database.ts, registry.ts, http-api.ts | S cross-tenant/App/actor/current-grant SQL/HTTP denials | Scope checks and RLS deny unauthorized access | Final authenticated host roles audit remains |
| 11. Frontend SDK | O/packages/browser-sdk/src/index.ts | 36 SDK tests; B real browser/network/quota; G | Bounded queue, ACK/replay/context/lifecycle validated | Memory fallback is not durable after page loss |
| 12. React Adapter | O/packages/react-adapter/src/index.tsx | Five tests in G421 and sixteen mounted Edge cases | Startup/capture/cleanup fault containment and reset pass focused/full QC | Not authenticated whole shell or SQL-event acceptance |
| 13. Backend SDK | O/packages/node-sdk/src/index.ts | 12 Node tests; actual queued outage integration; G | Bounded async capture, real 10s timer failure/recovery, no business retry | In-memory Node queue is not a durable outbox |
| 14. NestJS Adapter | O/packages/nestjs-adapter/src/index.ts | Nine adapter tests; A/test/hub-workflow-performance.ts actual controller HTTP | Original response/error and one subscription preserved; scoped trace context | Ephemeral controller wrapper is not full AppModule bootstrap |
| 15. .NET/Python Integration Examples | O/examples/csharp; O/examples/python | S reference-client flag launches real external processes | Actual JSON/HTTPS-contract clients ingest/replay against fixture | Loopback/local acceptance, not installed customer deployment |
| 16. Offline IndexedDB | O/packages/browser-sdk/src/storage.ts | B native IndexedDB/real network/reload/QuotaExceededError | Journal persists offline, same IDs replay after reconnect | Offline static HTML/PWA availability not promised |
| 17. Retry and Idempotency | O/server/src/ingestion.ts, queue.ts; SDK retry code | S parallel/lost ACK/lease tests; B Feedback and event replay | One persistence/receipt, bounded retry and matching ACK cleanup | Failure to delete unavailable physical disk rows is best effort |
| 18. Privacy and Redaction | O/packages/core/src/index.ts; SDK/browser redaction | core golden/generated redaction; S privacy/export; real queued marker check | Sensitive synthetic markers excluded, technical metadata retained | Cannot promise detection of every possible free-form secret |
| 19. Distributed Correlation | core trace helpers; A/src/observability/hub.interceptor.ts; W/src/JupiterObservability.tsx | Nest/Node/Web tests; B frontend/backend correlation | Valid trace/request fields cross adapter boundaries | Full Jupiter authenticated write trace journey still unproven |
| 20. Ingestion Reliability | O/server/src/ingestion.ts, queue.ts, http-api.ts | S concurrent/partial ACK/failed persistence/lease recovery | Atomic receipt/event/outbox and bounded retryable failure work | LOCAL pg fixture, not multi-host outage endurance |
| 21. Fingerprinting | O/packages/core/src/index.ts; O/server/src/engine.ts | core fingerprint tests; S grouping/recurrence | Stable scope-aware grouping and distinct affected identities | Not a semantic AI deduplication system |
| 22. Issue Engine | O/server/src/engine.ts | S real aggregation/reopen/atomic job completion | Persisted issue occurrences and histories reflect committed events | No blanket host capture coverage from engine tests |
| 23. Incident Lifecycle | O/server/src/operations.ts, rules.ts | S authorized notes/assignment/transitions; B workspace | Human transitions and scoped incident operations tested | Final complete authenticated host review remains |
| 24. Monitoring Rules | O/server/src/rules.ts | S ten actual persisted rule scenarios plus expected-rejection negatives | Rules create deduped scoped incidents/alerts; Browser CRITICAL not trusted | Controlled local event windows, not production incident SLO |
| 25. Operations Dashboard | O/console/src; W/src/OperationsWorkspace.tsx | B four widths/live/filter/workflow; G Console tests | Shared Console RTL and scoped server projections operate | Full Jupiter role/mutation UI acceptance incomplete |
| 26. Feedback | O/server/src/feedback.ts; W/src/FeedbackCenter.tsx | S own visibility/replies/triage; B offline/lost ACK; Help browser checkpoint | Own tracking, same-ID dedupe and internal-reply exclusion proven | Server tracking ACK, not local enqueue, is final registration |
| 27. Analytics | O/server/src/operations.ts; O/console/src | S ten reports/1–10 products/current grants; B cache/late response | Real rates/rankings/history and explicit multi-product comparison | Timing uses one loaded App + empty App, not production SLO |
| 28. AI Investigator | O/server/src/investigator.ts, ai-provider.ts | S controlled findings/scheduling; dated local GapGPT checkpoint | Schema-valid read-only findings cite authorized evidence | No external provider call in current regression gate |
| 29. AI Security | O/server/src/investigator.ts, ai-provider.ts | S injection/citation/scope/credential policy; provider tests | Curated context, validation, explicit host policy; no tools/business writes | Model findings remain hypotheses requiring human review |
| 30. AI Budget | O/server/src/investigator.ts; scoped ai_attempts/ledger | S atomic reserve/unknown/reconciliation/budget; local status check | Approved 100000 combined UTC-month budget enabled; unknown usage held | No fabricated actual usage or commercial allowance coupling |
| 31. Notifications | O/server/src/alerts.ts; A notification source adapter | S >1000 recipient paging/revocation/inbox/dedupe; Console tests | Durable principal-scoped inbox and bounded delivery operate | External notification deployment not proven by inbox tests |
| 32. Retention | O/server/src/retention.ts | S bounded parent/child protection, retries/locks/failure; B maintenance | Scope-safe bounded purges, receipts/audit/active history protected | Not a backup/restore or physical disk reclamation proof |
| 33. Telemetry Self-Health | O/server/src/self-monitoring.ts, diagnostics.ts | S report provenance/storage timeout/fairness; B health/counters | Automatic SDK/server reports and logical storage samples tested | Unknown observations stay unknown; not physical/whole-service health |
| 34. Independent Reference Application | O/examples/browser/backend.ts, src/main.tsx | B authenticated independent frontend/backend/SQL | Second App integrates without Jupiter sessions/domain imports | Controlled reference auth, not production IdP deployment |
| 35. Reusability Acceptance | O/examples and generic HTTP packages | Real Browser reference + actual Python/C# via S/G | Multiple independent clients use the generic public contract | No package-registry publishing or all ecosystems claimed |
| 36. Cross-Application Isolation | Registry/database/ingestion/operations/Investigator | S App A/B same opaque identities; forged credentials/export/AI denial | App identity never joins private data across Apps | Final contract audit remains separate from case count |
| 37. Offline Browser Tests | B and twenty-case section-57 map above | Actual Edge network/IndexedDB/quota/expiry/Feedback/foreign partition | All twenty mapped cases have concrete observed assertions | Fixture-age expiry, not a 48h wall-clock soak |
| 38. Security Tests | Contracts/RLS/API/SDK/AI/security suites | S/G plus real Browser hostile actor/foreign identity | Auth/scope/redaction/injection/export/retention controls exercised | Full requirement-by-requirement and Jupiter host audit remains |
| 39. Performance Measurements | O/server/test/performance-acceptance.ts, concurrent-performance.ts, browser-performance.ts; A/test/hub-workflow-performance.ts | G performance flag; actual 1000/200-event SQL/HTTP, 120 scopes, Browser caps | Bounded throughput/latency/overhead samples recorded in checkpoints | LOCAL only; sampled heap not peak RSS; full host load still unproven |
| 40. Browser Responsive Acceptance | B shared Console; scripts/accept-observability-help.mjs | Four widths 375/768/1024/1440; native fetch and React fault fixtures | RTL/no document overflow in tested shared Console/Help; recovery fixture at 375/1440 | Not all authenticated Jupiter business workflows |
| 41. Help Publication | docs/help/observability-*.md; A/scripts/publish-help-catalog.ts | Runtime slug-only publication; real Jupiter Help browser checkpoint | Eleven guides runtime-published with version history; later Console/offline revisions preserved | Revised offline wording not re-read in authenticated host after latest revision |
| 42. Known Limitations | Explicit dated limits in this document; .ai/NEXT_TASK.md | Source/evidence audit and actual gate inspections | No staging/promoted host/full-shell/PWA/physical-disk claims substituted | Full AppModule/process and final all-requirement audit remain |
| 43. Defects Found | Dated red tests in Evidence: storage, sampler, analytics, fetch, React | Red regressions and real mounted startup failure | Concrete defects distinguished from incorrect fixture assumptions | No count of hypothetical defects presented as acceptance |
| 44. Defects Fixed | SDK/server/adapters and their paired regression paths above | Subsequent focused/full gates plus actual Browser checks | Earlier defects and React remediation pass bounded focused/full QC | This does not establish all remaining host workflows |
| 45. Cleanup | Disposable S/A integration teardown; fresh Browser contexts; owned listeners | DB/role absence assertions, local status and listener checks | G421 leaves zero temporary DBs/reservations; shared tenant/profile untouched | Do not delete unrelated output/tmp or pretend fixture teardown is backup proof |
| 46. Quality Gates | package.json verify:release; exact logs/exit markers | G421 zero, both real Browser fault scripts pass; git diff --check | Builds/lint/typechecks/tests and actual optional scenarios executed when flags set | No-test reference package is not counted as extra unit tests |
| 47. Final Verdict | This Evidence; .ai/CURRENT_STATE.md and NEXT_TASK.md | Full-scope completion audit remains incomplete | IN PROGRESS; no next Goal, promotion or blanket acceptance | Must close actual host/process and explicit remaining audit before COMPLETE |

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
