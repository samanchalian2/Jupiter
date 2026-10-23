# GOAL-069 — Observability Hub Evidence

Status: IN PROGRESS. Owner-approved plan supersedes the stale GOAL-060 identifier
in the supplied specification. GOAL-060 Personal Service history is preserved.
GOAL-059 remains BLOCKED; LOCAL evidence is not staging acceptance.

## 2026-10-21 — Optional operational ceilings / DEC-062 (LOCAL, in progress)

Cleanup remediation LOCAL rerun80123 TERMINATED0: full CI-mode Hub141 passed,
6 browser/performance cases intentionally optional/skipped(147 total), no
unhandled errors. Server typecheck/diffcheck pass. No production-source changes
since499 functional gate; post-gate changes are test-only reporting/cleanup and
the two new cleanup tests, each re-executed. New remote delivery/result required.

2026-10-23 actual bd875d8 CI40005268830/job120591458216 FAILS on an uncaught
57P01 administrator termination during generated-DB teardown, despite all Hub
test assertions passing. Source diagnosis: pg-pool resolves end after removing
clients from its array but their socket end callbacks may still be pending;
old afterAll immediately pg_terminate_backend those exact sessions. This explains
the observed closing-client error; no business/host database was terminated.
Test teardown now waits for observed zero exact-generated-DB sessions (bounded5s)
before normal DROP, fails a real leak rather than swallowing Pool errors. Two
unit cases verify delayed closure and timeout/invalid observation. No production
pool/error policy/authorization/test assertion weakened. Full CI-mode Hub rerun
80123 is active, output/goal069-operational-limits-ci-cleanup.log; new scoped
push/remote CI proof still required. Prior499 functional gate is not CI success.

Implementation bd875d8ff564b96fef0bc89d1b69d301aa79a874 committed/pushed;
origin/main SHA verified equal. Actual new push CI40005268830 confirmed
in_progress, not yet success. LOCAL84/zero fixtures/zero attempts/live100000 and
Helpv4/v3 already verified. No local active test handles; whole original audit
continues with sections1–10 source/execution reconciliation in working audit.

2026-10-23 final follow-up49879 TERMINATED0/all3 actual host cases,
output/goal069-operational-limits-host-metadata.log: observed84 count now correct,
normal password/JWT/membership, real outage/manual/trace/Incident/embedded four-
width acceptance retained. Only test metadata/assertion changed after499 full
functional gate, re-executed directly; no production code changed. Cleanup safe
readback84/zero temporary databases/zero active AI attempts/enabled100000,
optional-null/live-policy flags true; Help AIv4/limitsv3 public-service flags all
true. Shared3000/5174 listeners absent. No active local test handle; scoped
commit/push/remote CI and full original requirement audit remain.

2026-10-23 FINAL functional source: serial84572 TERMINATED0. Log
output/goal069-operational-limits-final-release-2.log ends
GOAL069_OPERATIONAL_LIMITS_FINAL_RELEASE_EXIT=0:499 tests(180API/40Web/279Hub),
all build/lint/typechecks/84-migration rehearsal/native/reference/performance and
both isolated fetch/React scripts PASS. Supersedes prior failed fixture gate,
not the need for remaining original requirement audit. Native Persian denial,
four-width/keyboard far-left cost evidence inspected. No production code changed
after this gate; only stale host-test log constant83 replaced by observed executed
count84 plus assertion; follow-up actual-host3 run49879 is active.

After full gate, guarded preflight confirms loopback/exact only073 pending/83
applied/zero active attempts/zero temporary databases. Supported migrate runner
applies073 locally:84 now. Safe readback confirms optional defaults null and
existing enabled100000/model/encrypted credential presence preserved. Authorized
slug-only publication revises observability-ai to v4 and observability-ai-limits
to v3; normal public-audience Help detail confirms optional/units/unknown/history/
limits/manual guidance flags all true. No external provider call or target-server
deployment, no business tenant/credential policy mutation.

2026-10-23 continuation:17923 process handle missing; final log confirms exit1,
144 Hub tests pass/1 reconciliation fixture fails because its pending job is not
in the global50 claim. Exact generated pending job is now due-prioritized in
fixture helper/normal claim1 with exact dedupe assertion; production queue/cap/
lease/auth unchanged. Added Persian denial explanation retaining safe code and
native wording/keyboard/far-left usage check. Focused96384 running; final-source
gates still required. Focused96384 now TERMINATED0:Console35 and18 selected
SQL/HTTP/AI/native pass,93 deliberately skipped. Persian denial plus keyboard
far-left usage screenshot inspected. Second full final-source release started,
output/goal069-operational-limits-final-release-2.log, exec84572 confirmed live.
Main migration/Help pending.

Full-run84572 host fixture actually asserts84 migration files and executes them,
but its old console metadata still prints hard-coded migrations:83. This is a
reporting defect, not a missing migration: source beforeAll asserts84, separate
full-chain rehearsal also asserts84. After this active run terminates, replace
the log constant with the observed migration-file count and re-execute actual
host acceptance. Do not cite the stale log value as schema evidence.

- Migration073 adds nullable request/estimated-USD-cost policy and paired rates
  to existing config; immutable attempt rate/reserved-cost snapshots and exact
  derived-cost settlement constraint. No new table/service/public operation or
  provider contract;61 operations.84-chain disposable rehearsal preserves actual
  pre-073 SETTLED row as unpriced, never zero/revalued. Main DB still83/unmodified.
- Existing App advisory lock atomically checks mandatory tokens plus optional
  monthly requests and conservative cost across environments/tenants. Omitted
  optional settings preserve, null resets; explicit zero remains meaningful.
  Both explicit rates required for cost cap. Every reserved provider attempt,
  including retries/UNKNOWN, counts; UNKNOWN token/cost stays held. Unpriced
  current-month non-released history denies cost-capped calls. Actual validated
  settlement/reconciliation uses its original snapshot, not current rate.
- output/goal069-operational-limits-focused-final.log passes20 selected tests,
  100 deliberately skipped: four pure arithmetic/nullable cases,five OpenAPI,
  eleven actual SQL/HTTP/61-operation/rehearsal/concurrency/retry/UTC cases.
  Includes known retry cost40→80, UNKNOWN/reconcile snapshot, separate environment
  sharing cap, non-UTC connection/prior-month unknown, malformed/unauthorized
  config, immutable derived costs, and provider input-count overflow held UNKNOWN.
  First backend2 run failed new REQUIRED reason mapped403 and actor-mismatched
  second-env evidence. Corrected only new validation400 mapping and fixture actor/
  explicit ACK; no generic auth/cap weakened. Backend3/4/final pass.
- Console34 tests/typecheck pass. Existing form gains four optional controls,
  explicit blank/zero/unit semantics and known/held/unpriced cost projections.
  Native browser1 passes save/readback/reload/nullable reset and queued zero-cap
  denial with zero provider calls/attempts; four-width RTL/no document overflow.
  Expanded browser2 proves actual settled40-micro and UNKNOWN held-cost rendering,
  but following context acceptance reaches public120/min. Real-window pacing
  added (not rate-limit increase); browser3 TERMINATED0, all checks including old
  late-command/grant/reconciliation pass. Sources not rebuilt during acceptance.
- Help AI/limits sources updated; runtime publication, final full gates, main
  local migration/cleanup, screenshots and scoped commit/push still required.
  Active serial17923/output/goal069-operational-limits-final-release.log.
- Inspected native optional controls and known/UNKNOWN cost screenshots375/1440:
  readable compact controls, explicit units and inner-scroll table; no document
  overflow. Worker-denial output is still only English safe reason code; add
  Persian human explanation and native wording/far-left keyboard cost visibility
  acceptance AFTER17923 ends, then rerun final-source gates. Not a full A12
  acceptance certificate yet; no shared-data migration/publication performed.

## 2026-10-21 — Actual remote CI verified

Push1d1259b594207f7dc7aaa27c4cdebc5b61e87840 run39634632976/job119341692747
completed SUCCESS after clean build/ephemeral PostgreSQL/Help ranking fixes.
Read actual job state, not empty legacy statuses/PR-only wrappers. This CI does
not enable optional LOCAL browser/performance/reference flags; not a substitute
for full native/performance LOCAL acceptance or staging/deployment evidence.

## 2026-10-21 — Actual push CI diagnosis (LOCAL remediation in progress)

Help correction1d1259b594207f7dc7aaa27c4cdebc5b61e87840 pushed; origin/main
SHA verified. Actual push CI39634632976 confirmed in_progress at handoff, not
success. No local exec handle pending. Post-QC main DB83/zero temporary DBs/
zero active AI attempts/enabled100000,git diff --check passes. Uncommitted A12
schema/helper/fixture work remains separate from this tested Help checkpoint.

Run39633488275/job119337617376 (069b59c remote SHA verified) passes DB setup,
supported migrations,build/lint/typecheck and mandatory Hub persistence. API test
fails Help query تیکت: fresh seed recency chooses organization-ticket-configuration
instead of ticket-lifecycle. DEC-063 generic temporary published-article test
reproduces exact-tag vs newer broad title (red-2). Initial red1 was a fixture
omitting required revisionId; fixed test, no API relaxation. First ranking change
then exposed notifications vs commercial-allowances equal-tag relevance. Final
weighted exact/title/tag plus earlier-title-position ordering passes13 Help tests
(output/goal069-ci-help-ranking-green-2.log); no slug-specific boost, audience/
publication/filter change, runtime reseed/republication or normal article edits.
New push result pending. This is not a claim that CI has become green yet.

A12 schema QC has advanced: migration073 integrated in disposable fixtures only,
84-chain rehearsal preserves a SETTLED row inserted BEFORE073 without inventing
rates/cost. SQL snapshot/settlement invariants and pure arithmetic/nullable limits
pass6 selected tests/101 skipped(output/goal069-operational-limits-schema-2.log).
Main LOCAL remains83; no backend reserve/config/API/UI enforcement implemented.

Generic GitHub GET (not the PR-only commit wrapper) confirms prior fd5bc7c
push run39604737671/job119237918188 completed FAILURE. Install succeeded;
lint failed TS2307 resolving @observability/contracts from core because clean
checkout has no exported dist declarations. Subsequent checks were skipped.
This contradicts any inference that empty legacy statuses means CI success.
Workflow now builds the workspace topologically before lint/typecheck/test,
matching the existing LOCAL verify:release dependency order. No deployment step
or new permissions. Fresh-checkout and new push CI verification still required.

Implementation b4d561b55ef321411550ca7b8673ed9586baabd8 pushed and remote SHA
verified. Actual new push run39633029864/job119336020314 confirms clean install,
build,lint,typecheck PASS; test FAILS explicitly because no PostgreSQL test
configuration exists. This is a second real CI setup gap, not a test to skip.
Workflow now supplies an ephemeral PostgreSQL16 service bound to runner loopback,
public CI-only throwaway credentials, and supported migrate before tests. No
deployed host/database/secret is accessed. New remote result still required.

A12 implementation started AFTER the final-source Live checkpoint: exact integer
cost/nullable-limit helper has4 passing pure tests; migration073 drafted but NOT
applied locally or integrated into fixtures/service/API/UI yet. This draft is not
claimed as runtime enforcement or accepted A12. Existing local schema remains83.

## 2026-10-21 — Live Monitor Issue context / DEC-061 (LOCAL, in progress)

- FINAL-SOURCE serial output/goal069-live-final-release-3.log TERMINATED0:
  GOAL069_LIVE_FINAL_RELEASE_EXIT=0,482 tests(179API/40Web/263Hub),all build/lint/
  typecheck/migration/native/reference/performance and both isolation scripts.
  Fresh1440 and375-far-left screenshots inspected: severity/source readable,
  UTC dates/button stable, bounded keyboard-accessible inner scroll. No document
  overflow. Post-gate83 migrations/zero temporary databases/zero active attempts/
  unchanged enabled100000 monthly budget; Help v8 authorized public readback all
  flags true. Shared3000/5174 listeners absent. No deployment/external provider.
  Whole Goal remains IN PROGRESS; A12 DEC-062 is decision-only, not implemented.

- Latest second full release TERMINATED1: retention fixture follow-up claimed
  globally50 jobs and failed to find its intended generated-scope job, passing
  undefined to execute. Native Live test passed. Corrected fixture-only next due
  time and assert exact normal1-job lease; production queue cap/authorization/
  retention unchanged. Fresh1440 screenshot exposed severity/source vertical
  letter wrapping; added110px column minimum and native actual-width assertion.
  Console build/32 tests pass. Focused follow-up and final-source full gate still
  required; earlier green is not substituted. User-confirmed LOCAL readback:
  enabled100000 combined monthly tokens/83 migrations/zero active attempts.
- Focused3 retains retention PASS but native resume saw0 rows. Console rebuild
  overlapped that Browser run; possible HMR interference is an inference, not
  proven product failure. Unchanged serial focused4 TERMINATED0:2 selected tests
  pass/100 deliberately skipped, native real timers/four widths/110px severity
  and88px nowrap button assertions included. Fresh1440 screenshot inspected:
  readable severity/source with inner scrolling. Post-test safe readback:
  83 migrations/zero temporary DBs/zero active attempts/enabled100000 budget.
  No active test handles. Final-source full release gate remains required;
  do not discard the failed logs or claim final acceptance.

- Existing Event listing accepts includeIssue=true|false only on list, preserving
  default/false legacy rows. True adds related_issue fixed safe projection/null.
  One bounded batch for<=100 authorized Event IDs, exact App/env/Event/tenant
  composite and current RLS/grants; no N+1/migration/new operation(61 remain).
- Live table shows current App/env, Event occurrence/receive UTC/severity/source/
  operation/correlation, related Issue and explicitly lifetime occurrence/first-
  last observations. Null never implies zero/healthy. No nested JSON dump/new
  palette/nav/card. Native visual375 revealed date wrapping; UTC normalization,
  nowrap and210px first column corrected before final gate.
- Timer now waits while Event detail is open, then resumes unless explicitly
  paused. Collection unaffected, manual refresh/filter stays explicit. Real
  native output/goal069-live-browser.log proves committed new events during11s
  pause with no list request/row change, normal10s resume, real count1→2/null
  unaggregated observation, detail survives11s/new event without polling, closing
  resumes to four rows; RTL/no document overflow at375/768/1024/1440. No fake timer.
- Focused output/goal069-live-api.log:7 SQL/HTTP/full OpenAPI cases pass, including
  legacy compatibility, exact lifetime date/count, same-fingerprint tenant1vs2,
  null unaggregated state,page bound, invalid/repeated/unsupported flag rejected
  and current revoke. Console32 tests pass including safe UTC/unknown/no JSON SSR.
  Actual compiled-host output/goal069-live-host.log all3 pass, including actual
  ticket correlation/manual/recovery and Incident standalone/embedded acceptance.
- Latest output/goal069-live-browser-final.log passes native keyboard horizontal
  scroll, nowrap date assertion and all real timer/Issue/four-width checks. Console
  Help v8 published/read via authorized public service: lifetime/unknown/pause/
  reading/correlation assertions true. Earlier visual375 at far-left revealed
  narrow Details wrapping; final visual/source assertions/gate now corrected
  and passed (latest above). Scoped commit/push still required.
  Prior fd5bc7c remote checkpoint; no Preview/main deployment or live AI change.
- GitHub connector is now available. Read-only lookup of prior fd5bc7c returns
  workflow_runs=[] from a PR-only wrapper and statuses=[] from legacy status
  checks. Neither proves push-triggered Actions/check-runs success or failure;
  remote CI remains unverified, not an excuse to waive local work. No external
  job rerun, deployment, credential change or unrelated repository mutation.
- First serial full release output/goal069-live-final-release.log ends
  GOAL069_LIVE_FINAL_RELEASE_EXIT=0:482 tests(179API/40Web/263Hub),all build/lint/
  typecheck/migration/native/reference/performance and both isolation scripts
  pass. Subsequent visual polish gives Details>=88px and nowrap button, lifetime
  stats210px/correlation180px inner-scroll columns. Native asserts computed
  button/column styles; second full gate failed retention fixture, third final-
  source full gate passed (latest above). No palette/API/architecture change
  in these visual fixes.

## 2026-10-21 — Seed-bound correlation / DEC-060 (LOCAL, in progress)

- Added61st operation: authorized seed Event GET correlation, not a global trace
  identifier search. Exact current-grant/RLS seed read, exact tenant enforced
  even for all-tenant readers. TRACE/REQUEST independent, missing ID returns empty,
  occurrence chronology/time bounds/default±15min and pagination<=100. Fixed
  sanitized source/operation/route/status/duration/span evidence, no raw payload.
- Focused output/goal069-correlation-api-3.log passes7 SQL/HTTP/full public OpenAPI
  cases.105 same-scope rows,100+5 paging, TRACE105 vs REQUEST2, inclusive window,
  foreign tenant/free/env/App excluded, unknown/repeated query/bounds rejected,
  narrow tenant grant and current revocation asserted. Full contract traversal
  now exercises61 operations, not just a schema-count edit.
- First fixture run failed because a BROWSER envelope cannot carry server/worker
  attribution; corrected trusted SERVER envelope. Second run required explicit
  tenant for a tenant-only viewer and105 fixture jobs occupied later bounded50
  claim. Corrected explicit scope and drained actual fixture aggregation; no
  auth rule or claim cap changed. Failed logs retained alongside green3.
- Reusable Console lazy drill-through now passes independent native acceptance,
  output/goal069-correlation-focused-final-2.log (8 focused cases including full
  61-operation contract):55 witnesses/50+5 pages, TRACE vs REQUEST, explicit
  inclusive two-row window/reset, missing-ID no fallback, current revoke clears
  chain, held real response discarded on App switch and four-width RTL/no overflow.
  Actual authenticated Jupiter output/goal069-correlation-host-2.log passes real
  failed ticket capture→Operator UI→Browser/Server evidence for TRACE and REQUEST,
  four widths, no injected chain rows, no external provider. Existing Incident
  standalone/embedded and manual-ticket/trace/recovery acceptance still passes.
- Browser1 failed at an incorrect pause-button test label; Browser2/3 exposed
  missing exact accessible name on correlation select (safe diagnostic counts
  prove section remained open). Added explicit aria-label; native4 passed.
  Combined final1 exposed native fixture aggregation backlog affecting later
  bounded50 claim; native now drains its real jobs too, final2 passes. No worker
  cap/auth assertion changed. First actual-host attempt timed out selecting seed
  row; added exact new-scope listing response/seed-presence synchronization before
  row selection. Actual-host2 passes; no production issue inferred from that wait.
- Inspected375 independent and actual-host screenshots; readable horizontal
  table uses inner scroll. Final full-release/runtime Help/cleanup/commit pending.
  No external provider/live tenant/Preview/main deployment.
- First full serial run ends GOAL069_CORRELATION_FINAL_RELEASE_EXIT=1, actual-host
  seed-presence assertion. All130 server tests pass, API178pass/1fail. Fixture
  wrongly assumed newest25 contains the captured seed. It now navigates actual
  UI pages using exact current query and still asserts the exact seed ID. All
  three compiled-host cases pass in output/goal069-correlation-host-all-3.log:
  selectedPage2,total40,pageRows15,seedPresent=true; actual Trace/Request UI and
  manual/Incident flows pass. No production auth/query cap or assertion weakened.
  Correlation timestamps also reject non-ISO and impossible calendar dates rather
  than letting JS normalize them. Second full serial run required; first failure
  retained, no green claim from focused rerun alone.
- Second serial full release output/goal069-correlation-final-release-2.log ends
  GOAL069_CORRELATION_FINAL_RELEASE_EXIT=0:478 tests and both isolation scripts
  pass. Final accessibility audit then reproduced a22px outer summary hit target
  (output/goal069-correlation-touch-red.log). Outer lazy details now carries the
  existing semantic class so its summary receives44px minimum. Native touch-green
  measures44px; keyboard/four-width target assertions added. Final-source full
  gate must run again after this UI fix; do not present the earlier green as
  covering untested final UI. No palette/new navigation/API change in this fix.
- Final-source third serial release output/goal069-correlation-final-release-3.log
  ends GOAL069_CORRELATION_FINAL_RELEASE_EXIT=0:478 tests(179API/40Web/259Hub),
  all builds/lint/typechecks,83-migration rehearsal,native/reference/performance
  and both standalone fetch/React isolation scripts pass. Touch44/four-width/
  Enter assertion runs in the gate, not just a separate screenshot check.
  Post-gate LOCAL83 migrations/zero temporary DBs/zero RESERVED attempts,
  unchanged enabled100000 monthly input+output budget. Authorized public Help
  readback v7 assertions all true; diff check passes. Shared3000/5174 remain
  stopped; no Preview/main deployment. Implementation checkpoint
  a9676d88355207365155413013512b6a09439db0 pushed and remote main SHA verified.
  A11/A12/full
  original audit remains open. GitHub CI is not claimed green: only quality job
  exists(no deployment), local gh command unavailable and unauthenticated public
  Actions API read unavailable; remote-run audit remains, not a runtime failure
  assertion. Local gate success is not presented as remote CI success.

## 2026-10-21 — Investigator operational controls / DEC-059 (LOCAL, in progress)

- A08 native red output/goal069-investigator-config-red.log: real authorized
  configuration PUT commits; switch to VIEWER-only other App while response held;
  old success notice appears in new App. Defect reproduced, not inferred.
- Existing output/context/concurrency/review interval are now editable with exact
  service bounds/defaults, plus monthly combined token budget. Compact Persian
  form explains App-wide policy versus scoped findings/manual requests. Shared
  CommandContext guards save/analyze/reconcile completions; no endpoint/schema/
  provider change. Audit records effective non-secret limits and real actor.
- Console30 tests pass including three new bounds/default/credential-preservation
  tests; API/server/UI typechecks pass at focused checkpoint. Native green3 log
  output/goal069-investigator-config-green-3.log proves real PUT/Audit/readback/
  reload, four widths RTL/no document overflow, same encrypted credential retained,
  real held400 error discarded after App switch, real201 queue request discarded
  after tenant switch, real failed controlled provider UNKNOWN attempt reconciled
  with actor Audit without refreshing new tenant through obsolete callback,
  and revoked current grant clears settings. No external provider called.
- Earlier expanded fixture green2 failed because waiting networkidle while an
  old response was deliberately held cannot complete. Replaced with exact new-
  scope usage response/rendered-form wait, not a longer timeout or weaker assertion.
  Original red and failed intermediate logs retained. Runtime AI Help v3 published
  through supported LOCAL catalog and authorized public service readback asserts
  limits/frequency/App scope/credential preservation/reconciliation. Inspected
 375/1440 screenshots; all four widths asserted by native workflow.
- Final serial output/goal069-investigator-final-release.log and terminal marker
  GOAL069_INVESTIGATOR_FINAL_RELEASE_EXIT=0:476 tests(179API/40Web/257Hub), build,
  lint,typechecks,83-migration rehearsal,native/reference/performance and both
  standalone fetch/React isolation scripts pass. Post-gate LOCAL83 migrations,
  zero temporary DBs/RESERVED attempts, unchanged enabled100000 combined monthly
  budget. git diff --check passes; shared3000/5174 remain stopped. Scoped commit/
  push completed:4fbd13e08a6275fe36f31e1aa37859b4c9874a1c remote main SHA
  verified. A09/full original audit remains open, no whole-Goal acceptance.
- Prior DEC-058 checkpoint983d6e1a9dd41355dc9a602ab6f85f0375fc1d4b pushed and
  remote main SHA verified. No Preview/main host deployment; unrelated edits kept.

## 2026-10-21 — Saturated Incident human notes / DEC-058 (LOCAL, in progress)

- A10 reproduced through the actual authenticated native UI:105 earlier activity
  fixture rows, real supported note+assignment POST, assigned operator updates
  but fresh Human Notes text never appears. Red log
  output/goal069-incident-notes-red.log fails at the exact fresh-note visibility
  assertion. Existing UI filtered the oldest100 activities instead of notes.
- Incident detail now returns activity newest100(created_at DESC,id DESC) and
  independent newest100 human_notes with fixed kind NOTE_ADDED. Same scoped
  transaction/current grant/RLS, no migration/entity/new operation/unbounded cap.
  Workspace uses dedicated notes, explains independent newest-first limits;
  current status no longer labels initial rule-generated NEW a human decision.
- Real SQL/HTTP fixture includes105 older notes, a real newly submitted note,
  and105 later non-note activities. activity100 all non-notes while human_notes100
  starts with the actual fresh note, exact SQL deterministic order, no foreign
  tenant note. Authorized HTTP projection matches. Count/digest before and after
  reads identical; revocation/isolation still asserted. No history rewritten.
- Focused green SQL/HTTP/full actual60-operation OpenAPI and native passes:
  output/goal069-incident-notes-green.log (three selected cases). Expanded native
  proves fresh note after105 earlier AND105 later non-note activities, plus
  existing navigation/human/Audit/late-response/security/four-width checks.
- Actual embedded Platform route requires section=observability, not the old
  audit's guessed tab= example. Added direct link/reload/return/native Back/
  four-width acceptance to actual Jupiter fixture. Focused host acceptance passes
  output/goal069-incident-notes-host-2.log: standalone and embedded RTL/no document
  overflow at375/768/1024/1440, zero page errors. Inspected375/1440 embedded
  screenshots. Initial output/goal069-incident-notes-host.log failed before any
  test because disposable API readiness fetch was ECONNREFUSED within20s;
  repeat passed with unchanged timeout/source. Cause not established; no assertion
  removed or shared server restarted. Product Help v4 published through supported
  LOCAL catalog utility and authorized public service readback. Final serial
  release gate completed successfully: output/goal069-notes-final-release.log
  and terminal marker GOAL069_NOTES_FINAL_RELEASE_EXIT=0. All472 tests pass
  (179API/40Web/253Hub), build/lint/typecheck,83-migration rehearsal, native/
  reference/performance and both standalone fetch/React isolation scripts pass.
  Post-gate LOCAL readback:83 migrations,zero disposable obs069 databases,
  zero RESERVED attempts, unchanged enabled100000 monthly input+output budget.
  Public Help readback v4 also asserts independent recent-note guidance exists.
  git diff --check passes. Shared servers remain stopped; no target deployment.
  GitHub443 was unreachable; prior doc7f2a2ec local before push retry. No target deploy,
  live tenant/provider/key/budget change. Full Goal audit remains open.

## 2026-10-20/21 — Independent Incident workspace / DEC-057 (LOCAL checkpoint)

- Existing reusable Console now opens Incident list rows as a distinct article
  on strict #obs/incident/App/environment/Incident?tenant fragment. Real row tenant
  is bound, tenant-free vs all-authorized distinct; malformed/duplicate/unknown
  query references fail without a data fetch. Unknown host fragments stay owned
  by host. Reload/native Back/Forward work without replacing Jupiter/reference
  routers. This is a separate page, not the previous inline generic detail.
- Detail adds bounded newest retained Issue-event timeline100, exact Audit100,
  assigned operator projection, current management permission/core-derived
  transition options and readable App/environment context. Existing AI20 and
  human activity remain. No migration or new endpoint (60 operations).
- Source audit correction: Audit runtime RLS is App-only, but runtime never had
  SELECT. Control also cannot read Incidents. First attempted control-callback
  lookup hit 503 in actual OpenAPI acceptance. Corrected flow: exact Incident
  first read under normal tenant RLS/current grant, same-transaction temporary
  control role/re-authorization for fixed Incident Audit and exact assignee only,
  runtime restored in finally before linked reads. No permissions broadened.
- Real SQL/HTTP fixture proves 102 events→100 timeline,21 analyses→20 findings,
 105 seeded Audits→100 projection, scoped VIEWER/no commands, exact current
  grant/revocation, cross-tenant/tenant-free/App denial, no other tenant finding/
  Audit or arbitrary metadata, sanitized human note, operator name/active and
  unchanged absent runtime Audit SELECT. Full actual HTTP/OpenAPI traversal passes.
- Native authenticated independent fixture proves list→distinct page, reload/
  Back/Forward, all required named panels, readable persisted hypotheses/actions,
  human status/assignment/note with three real actor Audits, actual committed
  old-page mutation completion suppressed, VIEWER controls absent, revoked read
  clears old data, malformed route no fetch, four widths RTL/no overflow and
  mobile inner-scroll. First focused native pass recorded; expanded rerun found
  test inspected Back's empty selector before asynchronous options loaded.
  Corrected readiness to poll actual App AND environment, no assertion removed.
- Visual QC found ISO date bidi reordering; times now isolated LTR. Own-command
  success notice no longer immediately erased by result refresh. Final-source
  focused3 rerun passes three SQL/HTTP/OpenAPI/native cases. Expanded native
  confirms explicit unassign/empty AI sections in the final full gate.
- Actual Jupiter acceptance: real Platform Admin password/JWT UI login, supported
  rule/credential/event HTTP commands, actual compiled worker creates Incident,
  /operations scoped direct link and reload show real App/environment/tenant.
  Four widths RTL/no overflow, zero page errors. Log
  output/goal069-incident-actual-host.log passes; ordinary manual-ticket/automatic
  correlation acceptance and no customer commercial ledger rows remain intact.
- Revised Incident Help published by supported LOCAL utility:0 created,1 revised;
  public-audience service readback resolves v3 and confirms independent page,
  exact Audit/human unassign/read-only AI explanations without logging bodies.
- Serial final-source full gate running exec11983, durable
  output/goal069-incident-final-release.log. Do not overlap build/native fixture;
  final totals/exit/cleanup required before commit/push. This is not Goal completion.
- First broad final gate exits1:125/126 server tests pass, but analytics fixture
  references undefined target. QC found a text replacement intended for the new
  Incident fixture had also replaced the old linked/unlinked/hidden Feedback
  setup line. Restored that exact HEAD line with contextual patch; diff now only
  adds the new workspace test/new native test, no old fixture edits. Focused
  analytics+workspace+full contract traversal all pass (three selected tests,
  output/goal069-incident-regression-restored.log). No assertion removed/relaxed.
  Full serial final gate repeating with fresh durable
  output/goal069-incident-final-release-2.log; previous failed log preserved.
- Second full repeat exits1 at two analytics fixtures (50/51 fresh Events,1/2
  fresh Feedback), while new Incident/native/contract cases pass. Direct focused
  and full 12-case analytics reruns pass; prior wall-clock difference was not
  independently reproduced. Do NOT assert a proven production clock bug.
  Added a real controlled PostgreSQL500-microsecond fixture proving exact inclusive
  end semantics:0 rows at millisecond boundary,1 Event+Feedback at next millisecond.
  Whole-cohort fixtures now submit an explicit DB-observed next-millisecond UTC
  end (same24h window) instead of racing JS millisecond now with committed DB
  times. Counts51/2 and all filtering/isolation assertions remain unchanged;
  production code/clock/limits untouched. All13 analytics cases pass, log
  output/goal069-incident-exact-window.log. Third serial full repeat active,
  output/goal069-incident-final-release-3.log. Both failed full logs preserved.
- Final verification2026-10-21:third serial release exits0,
  GOAL069_INCIDENT_FINAL_RELEASE_EXIT=0 in the durable final-release-3 log.
  472 tests=179 API+40 Web+253 Hub (99 SDK/core/adapters,127 server,27 Console).
  All builds/lint/typechecks,migration rehearsal,actual compiled host/independent
  native/reference/performance and both standalone fetch/React isolation scripts
  pass. Screenshots375/1440 inspected (actual Jupiter and independent workspace).
  Post-gate safe LOCAL SQL:83 migrations,zero temporary DBs/RESERVED attempts,
  unchanged enabled100000 combined monthly budget. Incident Help v3 readback
  confirms all four new explanations; normal runtime content retained.
  Shared3000/5174 have no listeners, not falsely reported ready. No deployment.
  A08/A09/A10 and full original audit remain; new workspace is not whole-Goal
  completion. A10 explicitly records untested long-lived human-note visibility
  and embedded Platform reload; small-record standalone proof is not substituted.
- Implementation committed/pushed as
  95da688e74d79c96f673bb5954f1ddad78477694; remote origin/main exact SHA verified.
  Scoped secret-pattern scan0 and git diff--check pass. Unrelated gateway LF-only,
  website-training prompt changes and untracked output/tmp excluded/preserved.
  No external provider, live tenant/key or target deployment; Goal remains active.

## 2026-10-20 — Issue Explorer query/projection remediation / DEC-056 (LOCAL)

- Original section41 required sorting/grouping/affected releases; previous fixed
  ordering and individual event release values were insufficient. Existing Issue
  list/detail now support enum-only global sort/group, stable ID tie-break,
  <=5 full-cohort Issue-count buckets and <=100 retained affected-release groups.
  No new route/entity/migration, no raw payload or business-state change.
- Existing Issue category/release controls were inert. Both now require the same
  retained linked event in requested window, with existing Issue last_seen window.
  This is observed evidence, not causality/lifetime impact after retention.
- Real isolated SQL/HTTP fixture creates 30 authorized and 3 other-tenant Issues.
  Five seven-row pages equal the global SQL order exactly, no duplicate IDs;
  grouping counts 15/15 or severity10/20 with one-row page, not page-only counts.
  v1/FRONTEND is empty while v2/FRONTEND resolves one Issue; affected releases
  have v1/v2/unknown counts. Scoped VIEWER current grant, cross-tenant/App denial,
  strict/repeated/wrong-resource query keys and revocation tested.
- Two pure ordering tests reject SQL-like sort/group keys; two Console query
  tests preserve scope/status and omit list-only keys on detail/CSV. Console25
  tests/typechecks pass; complete actual 60-operation HTTP/OpenAPI traversal passes.
- Native journey creates an authorized disposable App with 26 Issues and a
  25-row page; first attempt timed out locating exact grouping label. Explicit
  accessible names added for new selectors and existing severity/category;
  native rerun active in exec37242/log output/goal069-issue-explorer-focused-2.log.
  Earlier log output/goal069-issue-explorer-focused.log is FAILED, not acceptance.
- Source Console Help updated with semantics, grouping drill-down, unknown/
  retained release evidence and CSV ordering. Supported LOCAL publication created
  0 articles/revised1; public-audience service readback resolves Console Help v6
  and confirms all four new explanations without logging article bodies. A07
  independent Incident workspace/full specification audit remain open. No local
  provider call, live tenant/key, Preview/main deployment or shared host restart.
- Expanded native second run passed; visual inspection found narrow table still
  crushed columns despite no document overflow. Added Issue-only readable inner
  900px width/240px title, 40rem scroll viewport/sticky header, compact long title
  expansion and 640px detail tables. Screenshots now target readable viewports.
- Expanded third run found exact human status select label unresolved and the
  100-release fixture only processed one clamped 50-job claim (53 groups, not
 100). Explicit accessible name added; fixture now drains actual bounded batches
  without raising production claim limits or relaxing the 100-group assertion.
  Native also exercises a held real old-sort response and explicit human status,
  assignment and note with real actor Audit; final rerun exec48962/log
  output/goal069-issue-explorer-focused-4.log passes all three selected cases.
  Native proves 26 full-result Issues on a 25-row page, 13+13 global severity
  counts, keyboard group drill-down, lifetime occurrence sort, actual same-event
  filters, old-sort response discard and human commands/three real actor Audits.
  Four widths 375/768/1024/1440 RTL/no document overflow; 375 explicitly proves
  keyboard-focusable inner scroll, >=900px table and >=240px title. Safe viewport
  images inspected; no field secret. These failed earlier attempts
  are retained and not counted as full acceptance.
- Serial final-source full gate completed in exec78129, durable log
  output/goal069-explorer-final-release.log ends
  GOAL069_EXPLORER_FINAL_RELEASE_EXIT=0. No overlapping rebuild/native fixture.
  467 tests =179 API+40 Web+248 Hub (99 SDK/core/adapters,124 server,25 Console).
  All builds/lint/typechecks,migration rehearsal,actual compiled host/reference/
  native/performance gates and both standalone fetch/React isolation scripts pass.
  Post-gate safe LOCAL readback:83 migrations,zero temporary DBs/RESERVED attempts,
  enabled monthly combined budget100000 unchanged. Shared3000/5174 stopped.
  No external provider call or deployment; not whole-Goal completion.

## 2026-10-20 — Supported access and integration credential management / DEC-055

- Existing Registry now exposes six whole-App ADMIN management operations plus
  safe current-principal identity (60 total executable OpenAPI operations). Exact
  existing active generic principal reference, explicit App/environment/tenant,
  role/reason, no implicit Jupiter membership. Self identity returns no issuer/
  subject/global directory and grants no discovery. Unassigned verified user
  gets their own reference, empty Apps and management denial; explicit assignment
  then revoke changes actual discovery without bypassing membership/grants.
- Manual grants and server integration metadata are paged (50/page, pages 1–400),
  same-App only, newest-first. No secret/hash, Browser/host short-lived keys,
  raw identity claims or arbitrary principal search. Managed host grants are
  read-only in this management path. Active duplicate manual scope is rejected
  with a fixed safe reason, never overwritten. Revoke preserves history, repeats
  without second Audit, and current revoked admin cannot continue management.
- Integration rotation locks the old scoped record, preserves its permissions,
  issues one 90-day replacement, revokes the old key and Audits the real actor
  atomically. Expired/revoked/disabled rotation denied; revoke remains possible.
  Parent validation invalidates old Browser children. Six management paths do
  not expose bootstrap/global role administration or require migration.
- Three real SQL/HTTP fixtures pass self-reference/no-authority, whole-App versus
  environment/tenant ADMIN, cross-App/FK/managed/active/duplicate/current-grant
  boundaries, safe lists/pages and five actor-bearing access/key operations.
  Concurrent rotation has one 200/one inactive 400 and one replacement; repeat
  revoke has one Audit. Temporary Audit-rejection triggers prove grant creation,
  key rotation AND revoke roll back with old key still valid/no extra key. Test
  triggers/functions are removed in finally; all data in disposable DBs.
- Complete actual HTTP/OpenAPI traversal includes all 60 operations; focused
  traversal/schema/typechecks pass. Three Console result-parser tests whitelist
  localized safe reasons, reject incomplete/unbounded fresh-secret success and
  never promote raw SQL/provider bodies or unexpected non-secret-command tokens.
- Persian RTL controls stay inside existing Applications navigation. Existing
  verified user can read their own reference in compact header details. Access
  forms default VIEWER, explain all-environments/all-tenants semantics and require
  safe reason/impact confirmation. Host-managed grants stay visibly read-only.
  Key issue/rotate returns a one-time in-memory value, masked by default, explicit
  reveal/dismiss, no auto-copy/download/storage/retry. Failed/uncertain results
  prompt safe-list reconciliation rather than promising rollback.
- Native actual UI assigns a scoped VIEWER, verifies data scope then revokes;
  issues/rotates/revokes integration keys, proves old parent/child invalidation,
  five actual actor Audits, no secret readback, explicit dismissal. A held real
  successful secret response is released after switching App: no stale secret
  appears. Real issue commits then transport aborts: one request, uncertain notice,
  safe metadata refresh and explicit UI revoke. Secrets never appear in assertion
  output/screenshots/logs; screenshots occur only after secret dismissal.
- QC: refresh initially remounted closed details; controlled expansion now
  preserves the workflow. Eager repeated environment fetches exhausted the real
  120/minute operator window in the compressed all-in-one Browser journey. Panel
  now loads lazily and reuses known parent environments; test waits to the real
  fixed-window boundary before the next admin journey. Limit/clock/counters are
  NOT weakened/reset. 429 now includes Retry-After=60. Actual pacing is recorded.
- Mobile visual review found cramped table labels; scoped 560px inner-table
  minimum width fixes them without document overflow/new palette/cards. Native
  four-width expanded-panel RTL/no-overflow and 375 inner-scroll assertions pass;
  375/1440 safe panel screenshots generated and visually reviewed. Final-source
  full gate includes the same four-width checks and native workflow passes.
- QC found generic Node handler sent no-store but Nest adapter did not inherit
  that header. Generic dispatch now enforces no-store (including safe errors),
  dedicated Nest Browser mint explicitly does so. Actual compiled host assertions
  for integration and Browser issuance added; no body/authentication weakening.
- Applications Help source updated with self-reference, scope, managed grant,
  one-time key, parent invalidation and uncertain-result reconciliation. Runtime
  publication now completed through the supported LOCAL utility: 0 created,
  1 revised. Public-audience ProductHelpService readback resolves v5 and confirms
  own identity/managed grant/masked key/uncertain-result explanations, no secret
  or raw article body logged. Shared HTTP host remains stopped; not a live Help
  Browser claim. Serial final-source repeat completed in exec 39406 with durable
  output/goal069-management-final-release.log, exit 0. No overlapping package
  build/native fixture during this final repeat.
- First broad gate exits 1, not a full pass: all 93 persistence cases including
  final management/self-reference/late/uncertain/four-width Browser passed, but
  the old negative OpenAPI test still forbade the substring "grants". Its scope
  predated DEC-055. Updated it to require the seven implemented management/self
  identity operations and still forbid bootstrap/global-grants/super-admin/
  transfer/future self-monitor routes. Actual full HTTP traversal already covers
  those new operations. Entire five-test OpenAPI suite and full serial gate
  repeated successfully. No assertions removed to hide an unimplemented endpoint.
- Final verification: 462 tests = 179 API + 40 Web + 243 Hub (99 SDK/core/adapters,
  121 server, 23 Console); all build/lint/typechecks, clean migration rehearsal,
  actual compiled-host/native/reference/performance acceptance and fetch/React
  standalone isolation scripts pass. Final marker
  GOAL069_MANAGEMENT_FINAL_RELEASE_EXIT=0. Post-gate safe LOCAL SQL readback:
  83 migrations, zero temporary DBs and RESERVED AI attempts, enabled monthly
  combined-token budget 100000. No external provider invocation in this checkpoint.
- A01 complete inventory acceptance and A07/full original specification audit
  remain open. No live Jupiter key, customer capacity, provider, external tenant
  or target host changed. Shared local hosts remain stopped.

## 2026-10-20 — Console mutation completion context (LOCAL)

- Existing `saveRule` awaited PUT then unconditionally set notice/refresh/error/
  busy. Native fixture holds the actual successful authorized HTTP response after
  commit, switches App/section, then releases it. Baseline fails with one obsolete
  rule success notice in the new App where zero expected; actual red log:
  output/goal069-mutation-red.log. This is an executed defect, not a static concern.
- CommandContext separates UI completion ownership from server execution: current
  client/App/environment/section/filter references, monotonic context epoch,
  latest command and unmount invalidation. Rule/detail/create/CSV paths check it
  before any success/error/busy/selection/download effects. Detail additionally
  checks its opened generation; opening a replacement detail resets its local
  busy/notice. CSV blob is not converted/downloaded after context change.
- No request cancellation/retry/rollback is invented. Server still commits its
  original authorized target; no endpoint/schema/role/business/provider change.
  This restores the existing late-context invariant, no architecture ADR needed.
- Four unit cases cover stable same-context rerenders, every context dimension,
  round-trip non-resurrection, newest-command ownership and unmount. Console 20
  tests/build pass. Initial native red-to-green rule response scenario passes in
  output/goal069-mutation-green.log; rest of previous native acceptance passes.
- Expanded native fixture now tests a real invalid-rule 400 after section change,
  actual CSV response after App change and actual one-time App creation after
  navigating away. Temporary REGISTRY_CREATE is explicit and revoked in finally;
  disposal removes all fixture Apps. Expanded native passes. Later code review
  found closing a detail while its mutation is pending invalidates completion
  but also needs to reset busy locally. Close now resets busy/notice; added actual
  held committed-note/close/no-stuck-CSV/no-obsolete-notice Browser check.
  This last change occurred after the broad gate started; that execution alone
  cannot certify final source. Final-source full gate still required.
- Broad run output/goal069-mutation-release.log exits 1: its later comparison
  Browser selection timed out after a navigation. During that run a focused
  check rebuilt the same Console dist while its Vite consumer was open; this
  is a fixture-contamination risk, not evidence of product comparison failure
  or a successful full gate. Final-source focused native (including detail close)
  passes separately. Repeat full gate serially, with no overlapping package build
  or Browser fixture, preserving all comparison assertions/timeouts.
- Final-source serial repeat passes with unchanged assertions/timeouts: durable
  output/goal069-mutation-final-release.log ends
  GOAL069_MUTATION_FINAL_RELEASE_EXIT=0. 456 tests (179 API, 40 Web, 237 Hub =
  99 contracts/core/SDK/adapters + 118 server + 20 Console), builds/lint/typechecks,
  migration rehearsal, reference clients, full native responsive/performance/
  security acceptance and both standalone fetch/React fault scripts pass. This
  run includes committed-detail-close/no-stuck-busy proof. Post-gate read-only
  status: 83 migrations, zero temporary DBs/active AI attempts; enabled 100000
  monthly budget unchanged. Shared 3000/5174 remain stopped, no live readiness
  claim. No external provider/customer quota/target host changes.
- A01 access/credential UI and full specification/Evidence audit remain open.
  No live Jupiter rule, target deployment, provider credential or budget mutation.

## 2026-10-20 — Effective ingestion/sampling policy / A01 partial (LOCAL)

- DEC-054 adds GET/PUT ingestion-policy (53 documented operations) under current
  whole-App ADMIN authorization. Version 1 sources/complete category basis points
  use the existing bounded Application policy JSON; unrelated members preserved.
  No migration, endpoint-wide disablement or new provider/commercial contract.
- New event validation/redaction/scope checks precede policy. Existing accepted
  receipt digest takes precedence over new filtering; otherwise sources are
  explicitly gated. ERROR/CRITICAL bypass sampling only. Other events use the
  first 32 SHA-256 bits of lowercase App/environment/Event UUIDs, against integer 0–10000
  basis points. Client sampleRate/weight never controls this decision. No random
  retry lottery, false ACCEPTED receipt, synthetic event/job or weighted report.
- Exclusion uses existing terminal REJECTED ACK with fixed reason codes; excluded
  events create zero event/receipt/job. They are not retried by normal SDK replay.
  A deliberate later resubmission of an excluded ID uses the then-current policy;
  this is not a promise that non-persisted IDs have an immutable receipt. Existing
  accepted duplicate/conflict handling and concurrent exactly-once writes remain.
  Source/category policy does not affect direct Feedback or SDK metric channels.
- QC found that existing SDK rejection handling would inflate dropped/retry-loss
  counters for intentional filtering. Browser and Node now recognize only the two
  explicit exclusion codes; other rejections still count. Node retry exclusion
  also avoids false recovered-delivery counts. New regressions cover both SDKs.
- Four policy tests verify strict bounds/complete schema/unknowns, immutable fresh
  defaults, severe/source precedence and deterministic independent hash vectors.
  Actual disposable SQL/HTTP tests pass policy default/updates, other JSON member
  preservation, no excluded rows, prior receipt/conflict, 50% stable replay,
  six-way one-ACCEPTED/five-DUPLICATE replay, restore/excluded-ID submission, App/env/
  tenant ADMIN denial, current grant revocation, other-App defaults, actual Audit
  actors and Audit-trigger rollback. Malformed stored policy is retryable with
  zero event write, not silently defaulted. Injected trigger/function removed.
- All 53 public HTTP operations are traversed and actual schemas validated;
  focused complete traversal, policy fixture and affected typechecks pass.
  Initial same-client concurrent fixture count queries emitted pg deprecation;
  replaced with serial awaited queries rather than suppressing the warning.
- Native authenticated disposable Registry fixture edits zero/full policy in UI,
  verifies actual HTTP sampling exclusion, ERROR bypass, restored acceptance/
  duplicate and two real-actor policy Audits. Four-width RTL/no document overflow
  passes. First attempt used old compiled package and lacked the new controls;
  package build prerequisite fixed without weakening selectors or timeouts.
  Final responsive grid and independently delayed policy-read coverage pass in
  the full release's native step; final screenshots visually inspected at
  375/1440. Code review then found UUID case must not alter sampling; lowercase
  hashing and an explicit uppercase-ID regression added. The first full run
  cannot certify that last source change; final-source gate still required.
- First broad run passed all 452 tests/build/lint/typecheck, but its standalone
  fetch fault script failed waiting for the React preamble: it implicitly assumed
  shared Web 5174, which is stopped. Recorded release exit is 1, NOT a full pass.
  Both standalone scripts now default to an in-process disposable LOCAL Vite on
  a reserved OS-selected strict port, configFile=false/no API proxy; finally
  closes it. Explicit exact LOCAL origins remain opt-in and are never closed by
  the helper. Exact-origin validation rejects remote/path/userinfo/non-HTTP URLs;
  syntax checks for all three scripts and explicit validation probe pass.
  No shared 3000/5173/5174 service is started/replaced, no session or
  business database touched, no process-start restriction bypass. Focused fetch
  and all 16 mounted React cases pass against isolated real source-module fixtures. Final-source
  release plus both standalone scripts must still pass before checkpoint commit.
- Final-source repeat now passes: output/goal069-policy-final-release.log ends
  GOAL069_POLICY_FINAL_RELEASE_EXIT=0, with all 452 tests (179 API, 40 Web,
  233 Hub = 99 contracts/core/SDK/adapters + 118 server + 16 Console), builds,
  lint/typechecks, migration/client/native/security/performance acceptance and
  both isolated source-module fault scripts. UUID-case fix is in this execution.
  Final 375/1440 images inspected; four-width RTL/no-overflow passes. Post-gate
  read-only check: 83 migrations, zero temporary DBs/active AI attempts, enabled
  100000 monthly budget; Help v4 markers present. Shared 3000/5174 listeners still
  absent; this checkpoint does not claim local shared readiness or deployment.
- Persian policy Help source updated and published through the supported LOCAL
  utility with a validated active Platform Admin actor: 0 created/1 revised.
  Public-audience ProductHelpService readback resolves version 4 and confirms
  policy/terminal-exclusion/independent-SDK explanations; no raw content or secret
  is logged. HTTP host remains stopped, so this is service-level runtime readback,
  not a claim of live authenticated Browser Help acceptance. No live Jupiter policy mutation,
  external provider call, target deployment or customer allowance change.
- A01 still requires supported access/credential management and the full section-8
  inventory audit; the entire GOAL-069 specification/final evidence audit remains
  required. Green focused tests do not close those requirements.

## 2026-10-20 — Registry configuration/lifecycle workflow / A01 partial (LOCAL)

- DEC-053 adds GET/PUT Application configuration and PUT composite environment
  status. 51 executable OpenAPI operations now include all three new paths;
  focused actual HTTP/SQL contract traversal and Swagger/typecheck pass. An
  initial path-parameter helper misuse was caught and fixed: route() already
  generates path parameters; no malformed/duplicated declaration remains.
- Whole-App ADMIN/current Super Admin required, not tenant/env ADMIN. Immutable
  UUID/slug/env key/kind, historical evidence and independent revocation/expiry
  preserved. Metadata/origins/enabled change requires safe reason and real Audit
  in the same locked transaction. Unknown properties, query ambiguity, invalid
  origins, oversized origin list, wrong types/unsafe metadata and foreign target
  are rejected without writes. No migration or policy placeholder is added.
- Real HTTP/SQL fixture tests disable/re-enable both Application and environment,
  rejection of existing server/browser credentials while disabled, prior-event
  preservation/readability, resumed ingestion, fixed identity, scoped ADMIN
  denial and four actor-bearing changes. A temporary Audit rejection trigger
  proves failed Audit rolls back metadata/status (HTTP 503, original name/enabled/
  credential validity unchanged); trigger/function are dropped in finally.
- RegistryConfiguration is inside existing Applications navigation, with separate
  App/env forms, safe reason/impact confirmation, Origin guidance, environment
  creation and read-only integration IDs. Environment selector refresh retains
  current selection when still valid and discovers a newly created environment.
  Generation guards suppress old App reads/mutation completion after selection
  changes. Forms do not store/return credentials; native summaries and checkbox
  labels preserve 44px targets, existing palette/navigation remain unchanged.
- Native fixture grants REGISTRY_CREATE explicitly to the already authenticated
  fixture principal, uses actual UI to create a disposable App/environment, then
  edits metadata/origins and suspends/resumes both. Existing credential rejection,
  real actor on all four changes, VIEWER no-form denial, held old-App response
  discard, RTL/no document overflow at 375/768/1024/1440 all pass. 375/1440 images
  inspected; no real Jupiter App, credential or external tenant is changed.
  Temporary global create grant is revoked in finally; database teardown removes
  fixture rows. This is not public principal/bootstrap/role-administration UI.
- Focused Browser QC first exposed a prior Overview assertion depending on the
  optional performance fill. The long-title fixture now sends an explicit safe
  REFERENCE_CLIENT event through real HTTP/aggregation, independently of that
  flag; no assertion is skipped. A later timeout was exact label matching of
  select text including its options: explicit accessible names fixed the control,
  with unchanged assertions/timeouts. Supported UI then passes without performance
  mode (focused native test 45327ms). Expanded Browser scenario timeout is 180s
  to cover added create/write/late-response workflows, not a product latency SLO.
- Persian Applications Help updated and runtime-published only for its slug:
  0 created, 1 revised; public LOCAL API version 3 includes configuration and
  suspension-versus-revocation explanations.
- Final LOCAL release verification exits zero: 445 tests (179 API, 40 Web,
  226 Hub = 97 contracts/core/SDK/adapters + 113 server + 16 Console), builds,
  lint/typechecks, reference clients, real PostgreSQL/migrations, performance
  and native Browser acceptance. Both standalone fetch/React fault scripts pass.
  Durable local log: output/goal069-registry-release.log, final marker
  GOAL069_REGISTRY_RELEASE_EXIT=0. Final 375/1440 screenshots visually inspected;
  four-width RTL/no-overflow assertions pass. These are disposable fixture tests,
  not a deployment or completeness certificate for A01.
- Post-gate database check: 83 migrations, zero temporary databases and active
  AI attempts; encrypted operational configuration remains enabled with 100000
  combined monthly tokens. Previous shared local API/Web listeners (3000/5174)
  are absent and external health probe returns PROBE_FAILED. Tool policy rejected
  a hidden-process startup command before execution; no alternative bypass was
  attempted. Shared local readiness is therefore not claimed. No preview/main
  deployment or other application mutation occurred.
- **A01 remains PARTIAL.** Effective ingestion/sampling policies, supported
  grant/credential management and the complete original section-8 inventory
  still require implementation/acceptance. Final full-spec audit remains open;
  these controls are not a redefinition of Registry or whole-Goal completion.

## 2026-10-20 — Complete Overview projections / A05 (LOCAL)

- DEC-052 extends the existing Overview/OpenAPI response, not a parallel route.
  critical_issues is a current-state CRITICAL active-Issue count. Observed health
  declares FILTERED_TELEMETRY_OBSERVATION, counts and last observation; empty
  scope is UNKNOWN, errors yield ERRORS_OBSERVED, other data NO_ERRORS_OBSERVED.
  None is an uptime/host-health guarantee. Existing event metrics remain intact.
- recentReleases returns <=10 versions (nullable unknown), first/last observed
  IN WINDOW and error counts. highImpactProblems returns <=10 matched Issue
  ERROR/CRITICAL cohorts ranked by distinct users/tenants/occurrences/ID. Latest
  AI findings return <=10 successful persisted scoped summaries created within
  the window. Event filters require matching Issue/Incident target links; general
  summaries are omitted in narrowed views. Reads never invoke a provider.
- All new queries use the existing grant-revalidated scoped transaction/RLS,
  parameterized exact event filter cohort and fixed bounded projection. Console
  adds compact Persian headings/tables plus explicit basis/window wording and
  unknown/observation-only labels; no new navigation, theme or business changes.
- New disposable real-SQL test creates its own App/environment and 14 events
  across 13 versions/two tenants, actually aggregates Issues and seeds explicit
  persisted finding fixtures (NOT provider-execution evidence). It verifies
  unknown empty state, 10-version cap, critical current count, filtered impact/
  summaries, healthy-observation wording basis, tenant VIEWER isolation, whole-
  environment denial, revocation and real HTTP safe projections. Initial fixture
  attempts correctly hit actor mismatch and control-role INSERT denial; fixed
  test attribution/worker fixture setup, never auth/permissions. Focused pass.
- Console 16 tests, OpenAPI 5 and affected typechecks pass. An initial wrong
  package filter matched no project and is not counted; correct operations-ui
  suite/typecheck executed. Native fixture now checks all new headings and actual
  successful controlled AI summary at 375/768/1024/1440 with RTL/no document
  overflow and synthetic screenshots. First native run passed widths but image
  review found a real usability defect: high-impact title columns squeezed into
  near-character-width on mobile, yielding a 6572px page. No-overflow alone was
  insufficient. Scoped Overview tables now retain a 640px minimum/180px leading
  column and keyboard-focusable internal scrolling, with no palette change.
  Native assertion now verifies that internal table width/scrolling at 375px.
  A second image review found a 2000-character title still dominated vertical
  space despite readable columns. Overview-only long cells now use a native
  details/summary preview, with full content expandable (not discarded); native
  acceptance explicitly opens/closes it. Other table defaults are unchanged.
  The next full run failed solely because the test assumed native summary had
  ARIA role button in Chromium. Corrected to the actual summary element, keeps
  its accessible-label assertion and now requires >=44px target plus native Enter
  open/close. No app assertion/authorization/bounds requirement was removed.
  Final-source verification is recorded below, not inferred from the earlier
  source runs. A01/full audit remain required; no deployment.
- Final native Overview acceptance now passes at all four widths. At 375px the
  actual table is >=640px, scroll is internal, summary target >=44px, and native
  Enter opens/closes the full text without document overflow. Final synthetic
  375/1440 screenshots inspected after both visual fixes. Known presentation
  kinds/severity/status are Persian; stored codes/API values stay unchanged.
  Full final-source release gate exits zero:
  `output/goal069-overview-accepted-release.log`,
  GOAL069_OVERVIEW_ACCEPTED_RELEASE_EXIT=0. 444 tests = 179 API + 40 Web + 225 Hub
  (97 SDK/core/adapters + 112 server + 16 Console). Builds/lint/typechecks,
  Browser/client/performance/migration gates and both fault scripts pass.
  Actual compiled host cadence/login/manual ticket and actual Web/detail
  regressions also pass. Post-gate: 83 migrations, zero temporary DBs/active AI
  attempts, healthy readiness, unchanged owned 19440/3000 and 49740/5174 listeners
  and enabled 100000 monthly budget. This is LOCAL evidence, not host promotion.
- Persian Console Help adds clear current-count/filtered-panel/unknown health/
  release observation/AI-read semantics. Existing authorized LOCAL publication
  utility updates only observability-console: 0 created, 1 revised. Public API
  returns runtime version 5 and all three new explanation markers; prior history
  is retained. Repeating the exact targeted publication returns 0 created,
  0 revised, 1 unchanged; runtime remains version 5 with one Overview and one
  Analytics heading. No other article target or credential is passed to publication.

## 2026-10-19 — Named scoped Browser recovery triggers / A03 (LOCAL)

- DEC-051 adds immediate-return notifyApiConnectivity(expectedScope, successful)
  and notifyAuthenticatedActivity(expectedScope) ports. Unknown/stale scope,
  anonymous activity and failed probe do not schedule replay. One pending task
  coalesces bursts, with two-second start throttling and a trailing task. The
  normal flush still checks due time/current credentials/generation/expiry/ACK.
  A notification before backoff is due does not clear or force that deadline;
  subsequent hints/normal timer provide further opportunities. No ONLINE/healthy
  state or successful delivery is inferred from these hints.
- Context change/logout cancels pending tasks; shutdown immediately suppresses
  new notifications. Scheduled context/flush failures are consumed, never sent
  recursively as new telemetry. SDK tests initially fail for absent ports; final
  46/46 suite passes, including five new tests for false probe, burst coalescing,
  same-ID retry/ACK, 30-second persisted backoff, anonymous/foreign/stale identity,
  cancellation, throwing context and rejected scheduled flush.
- Jupiter's existing fetch wrapper receives optional current scope separately
  from its identity key. Activity is notified before sole business dispatch;
  connectivity only after a successful same-identity API response. Hub/self and
  late old-identity responses are excluded. Separate best-effort observation
  means a broken hint/capture cannot suppress the other or replace the response.
  Session refresh synchronizes context before notifying. Two new host-wiring
  tests fail on old code; all 14 fetch tests/typecheck now pass, including
  throwing/rejecting recovery observers and original network-error identity.
- Native fixture recovery.html uses a verified reference session, real origin
  IndexedDB and normal short-lived credential endpoint. SDK.start is deliberately
  NOT called: no startup/timer/online/visibility/manual flush can explain replay.
  Per trigger, first HTTP ingestion is aborted, original retry deadline/ID is
  retained and no early attempt occurs. After due time another named hint must
  persist the same ID once in real SQL and valid ACK removes it from IndexedDB.
  Probe mode additionally checks actual 503 session probe causes no attempt,
  then a real successful API response/scope enables the hint. Both native cases
  execute and log PASS: sdkStarted=false, manualFlushCalls=0, initial failed
  attempt=1, sameIdPersisted=1, validAckRemoved=true, backoffPreserved=true.
- Full LOCAL gate exits zero (`output/goal069-recovery-release.log`,
  GOAL069_RECOVERY_RELEASE_EXIT=0): 440 tests = 179 API + 40 Web + 221 Hub
  (97 SDK/core/adapters + 111 server + 13 Console). Builds/lint/typechecks,
  Browser/client/performance/migration gates and both fetch/React isolation
  scripts pass. Actual authenticated Jupiter Web/manual ticket/detail and
  actual compiled worker cadence regressions also pass. Post-gate: 83 migrations,
  zero temporary DBs/active AI attempts, healthy readiness, unchanged owned
  19440/3000 and 49740/5174 listeners and enabled 100000 monthly budget.
- Existing actual Jupiter Web comment no longer attributes automatic recovery
  exclusively to a timer now that multiple normal triggers are wired. The
  independent Node timer acceptance remains separate and unchanged.
- README documents host usage, backoff and no per-event probe. No secret, schema,
  provider/commercial API or deployment change. A01/A05 and full audit remain open.

## 2026-10-19 — Configurable bounded host rule cadence / A04 (LOCAL)

- DEC-050 adds OBSERVABILITY_RULE_EVALUATION_INTERVAL_MS, bounded integer
  10000–300000 milliseconds, default/fallback 60000 and restart semantics.
  .env.example and Observability README describe granularity, failure behavior
  and independence from AI/maintenance. No actual .env/live host value changed.
- Existing two-second non-overlapping drain invokes separate rule scheduling.
  First attempt is immediate; last-attempt time throttles successful AND failed
  work. Failure uses existing fixed/rate-limited WORKER_DRAIN_FAILED diagnostic;
  remaining drain work still runs. Separate lastMaintenance retains the existing
  one-minute alerts/retention/self-metrics/storage/Investigator schedule.
- Three new unit tests initially fail against absent configuration/helper, then
  pass after implementation: defaults/invalid/range endpoints, exact timing
  boundaries, failed-attempt throttling, fixed diagnostics and unchanged
  maintenance timestamp. Existing sampling separation test/typecheck also pass.
- Actual compiled main/AppModule fixture sets 10000 only in its disposable child
  environment. A real Platform session configures CRITICAL_EVENT via supported
  API and creates an ingestion credential, kept solely in memory. Two distinct
  cohorts enter actual HTTP ingestion, automatic aggregation/rule scheduling and
  real SQL incidents. Both appear within 16-second waits, successive insert times
  10012ms apart (>=8000 assertion). This cannot pass a fixed 60-second scheduler
  across two successive cohorts. No manual evaluate call or fabricated incident.
  Session logs out in finally; existing DB/process/role cleanup passes.
- Focused actual-host case passes; two unrelated cases explicitly skipped in
  that focused run, not counted as executed. Full LOCAL release gate exits zero
  (`output/goal069-cadence-release.log`, GOAL069_CADENCE_RELEASE_EXIT=0): 432 tests
  = 179 API + 37 Web + 216 Hub. Builds/lint/typechecks, actual Browser/client/
  performance/migration gates and both fault-isolation scripts pass. The full
  actual-host suite executes all three cases; cadence repeats at 10048ms and
  authenticated Jupiter Web/manual ticket/four-width/detail regressions pass.
  Post-gate: 83 migrations, no temporary DBs/active AI attempts, healthy readiness,
  unchanged owned 19440/3000 and 49740/5174 listeners plus enabled 100000 budget.
  This is
  LOCAL target-cadence evidence, not a production hard real-time SLO or changed
  AI behavior. A01/A03/A05 and full requirement reconciliation remain open.

## 2026-10-19 — Configurable Browser offline retention / A02 (LOCAL)

- DEC-049 documents additive `retentionMs.events/feedback` constructor options,
  milliseconds, safe integer 1000 minimum, 48h/24h maxima/defaults. Both primitive
  values are copied at construction. Invalid types/NaN/infinity/fraction/outside
  range fail with INVALID_SDK_RETENTION. Diagnostic TTL remains separately 48h.
- Three new tests fail against old code; implementation assigns immutable
  enqueue-time absolute deadlines. Four final tests cover defaults/bounds,
  caller mutation, exact expiry boundary, retry preserving original deadline,
  reload under larger defaults not extending expiry and foreign actor purge
  before replay. Diagnostic retryDropped intentionally counts events only;
  status.dropped also counts feedback. SDK 41/41 and typecheck pass.
- Native acceptance fixture `examples/browser/retention.html` uses a verified
  disposable reference session and actual IndexedDB. It enqueues event+feedback
  with 1000ms TTL, waits real time, navigates to a fresh page/default policy and
  asserts both deleted before auth/transport plus zero persisted Hub rows.
  No manual expiry edits, fake clock, real customer content or stored credential.
  The existing offline Browser harness executes it before lifecycle/quota checks.
- Reference typecheck initially saw previous package declarations; rebuilding
  browser-sdk generated the new additive declaration and typecheck passed.
  Full release gate/both isolation scripts exit zero:
  `output/goal069-retention-release.log`, GOAL069_RETENTION_RELEASE_EXIT=0.
  428 tests = 175 API + 37 Web + 216 Hub (92 SDK/core/adapters + 111 server +
  13 Console). Builds/lint/typechecks and Browser/client/performance/migration
  gates pass. Actual native retention log reports PASS: two rows removed on
  fresh default-policy page, SDK authCalls/transportCalls/persistedRows all zero.
  Actual authenticated Jupiter Web/detail four-width and timer/worker recovery
  regressions also pass. Post-gate: 83 migrations, zero temporary DBs/active AI
  attempts, healthy readiness, same owned 19440/3000 + 49740/5174 listeners and
  enabled 100000 budget. A01/A03/A04/A05 and broader audit remain open; no
  Preview/main host promotion.

## 2026-10-19 — Requirement audit findings and metric-journal isolation (LOCAL)

- `docs/GOAL_069_REQUIREMENTS_AUDIT.md` records the first requirement-level
  findings against the actual full specification rather than treating the
  47-section index or passing suite as acceptance. Registry management, Browser
  retention options, named recovery triggers, host scheduler configurability and
  required Overview projections have concrete incomplete/unverified items. No
  public API/architecture change is made merely by declaring those gaps.
- A06 contradicts the existing DEC-044/048 invariant: a metrics-only checkpoint
  write failure called data degrade(), changing DURABLE/queued=1 to MEMORY/0
  despite intact event storage. One new SDK test fails against the previous code.
  Removing this diagnostic-only fallback preserves the existing data store and
  last data failure, leaves the immutable metric snapshot unacknowledged and
  reports METRICS_STORAGE_UNAVAILABLE. Real data-store failure fallback remains.
- After recovery the regression verifies original event ID sent exactly once,
  unchanged diagnostic report delivered once, both queues cleaned, no store close
  and no extra drop counter. Focused Browser SDK suite passes 37/37 and typecheck
  passes. This is a controlled storage-port fault, not a claim that native quota
  selectively rejects METRICS while accepting other writes. Existing real
  Browser quota/lifecycle acceptance remains independently relevant.
- Full release gate exits zero (`output/goal069-audit-release.log`,
  GOAL069_AUDIT_RELEASE_EXIT=0): 424 tests = 175 API + 37 Web + 212 Hub
  (88 SDK/core/adapters, 111 server, 13 Console). Builds/lint/typecheck,
  actual Browser/client/performance/migration acceptance and both Browser
  diagnostic-isolation scripts pass. Post-gate: 83 migrations, zero temporary
  databases/active AI attempts, healthy readiness, unchanged owned listeners
  19440/3000 and 49740/5174 and enabled 100000 monthly budget.
  Goal remains IN PROGRESS because audit findings are actual required work,
  not outside-scope blockers or a reason to drop the original plan.

## 2026-10-19 — Authenticated actual Jupiter Web and automatic offline trace (LOCAL)

- Paths: `apps/api/test/support/actual-host-browser.ts`, invoked by the existing
  disposable `observability-host.integration.spec.ts`. A real Vite server loads
  the unchanged `apps/web/src/main.tsx`, App/router/Shell/TicketComposer/detail
  and JupiterObservability against the actual compiled AppModule process.
  It is not the independent reference App, a fixture React root or route mock.
  Existing Vite config is overridden IN MEMORY to strict ephemeral loopback
  port and `/api` proxy to this disposable API; VITE_API_URL is explicitly
  `/api/v1` so an unrelated environment value cannot target a real deployment.
  Helper rejects shared development ports and non-loopback origins, and checks
  current_database matches the generated obs069_host UUID namespace.
- Fixture App explicitly registers only the isolated Web origin. Browser uses a
  fresh native Edge context, normal login form/password, real JWT/HttpOnly
  refresh cookie and supported REQUESTER membership. No sessionStorage injection,
  trusted-host bypass, shared signed-in profile, custom credential or disabled
  browser-security switch is used. Credentials remain in memory, not artifacts.
- Through `/o/host-acceptance/tickets`, the requester enters description/title,
  expands actual manual details and clicks the real submit button. Exactly one
  POST /tickets/drafts is observed and exactly one additional OPEN ticket exists.
  The actual detail heading renders afterward. No AI/provider setting is enabled
  and commercial ledger remains empty: manual work does not charge telemetry.
- Browser network interception aborts ONLY Hub event-batch POSTs, never ticket,
  login, catalog, credential-mint or backend SDK traffic. Manual UI submission
  succeeds while telemetry is blocked. A genuine normal-timer attempt is seen;
  no Browser event is stored on the server yet. Native IndexedDB contains that
  request's event envelope. After removing the interception, the unchanged SDK
  timer/retry sends the SAME ID; SQL holds exactly that one Browser event, and
  valid ACK removes that ID from IndexedDB. No explicit SDK.flush call.
- Real Browser and SERVER events have the SAME request ID and W3C trace ID from
  the actual browser outbound headers, actual requester and organization. The
  event sources are asserted separately, not two invented fixture records.
  This closes the previously unproven actual Browser→API manual-write trace path.
- Composer AND rendered ticket detail pass 375/768/1024/1440: Persian RTL,
  document width <= viewport and zero page errors. Screenshots at 375/1440 are
  visually inspected: compact logo/header/menu, readable form/detail controls
  and no horizontal cut-off/overlap. Artifacts are only synthetic authenticated
  fixture UI in output/goal069-browser/jupiter-{composer,detail}-{375,1440}.png;
  no login/password/cookie/token screen is captured or committed.
- Initial combined execution put Browser ticket creation before a test assuming
  an empty organization; that was a harness order failure, not data loss. API
  no-effect assertions now use before/after counts and scenarios have a clear
  order. Another run exposed per-item ingestion timing: observing the exception
  row can precede its sibling operation row in the same HTTP batch. The test now
  waits for both exact event codes; it does not weaken the required assertions.
  Normal logout runs in finally even on failed assertions, preventing one test's
  leftover refresh sessions from contaminating another. No fixture failure is
  recorded as an accepted full run.
- Latest focused two-test execution passes in 59.823s (API 30.055s, Browser
  25.035s), including real telemetry abort/IndexedDB replay/ACK cleanup and both
  page width sets. API typecheck passes; full LOCAL release gate with strengthened
  fixture-origin/database guards and relative-count assertions exits zero:
  423 tests (175 API, 37 Web, 211 Hub), builds/lint/typechecks, actual four-width
  reference Browser/offline/quota, Python/C# clients, performance/migrations and
  both Browser diagnostic-fault scripts. Final host pair takes 60.453s (API
  30.118s, actual Web 25.365s). No temporary DB/RESERVED AI attempt remains;
  owned API/Web PIDs 19440/49740, enabled 100000 budget and healthy local
  readiness are unchanged. Existing Vite chunk advisory remains.
  Browser flag is required; default skipped optional execution is not counted
  as acceptance. Finally uses normal logout/refresh-401, closes fresh context /
  Browser/Vite even on failure, then existing API/DB teardown verifies cleanup.
- Scope: real requester/manual ticket/detail/trace/offline behavior. Not a claim
  that every Platform/Owner management mutation, worker-entrypoint crash,
  external provider or every Goal requirement is accepted. Whole requirement
  audit and remaining concrete gaps stay open. No preview/main promotion.

## 2026-10-19 — Actual compiled Jupiter AppModule process (LOCAL)

- Execution path: `apps/api/test/observability-host.integration.spec.ts` starts
  the ACTUAL `node dist/main.js` with the existing AppModule, middleware/global
  interceptor, identity resolution, controllers, services, Node SDK timer and
  Hub worker. This is not an ephemeral one-controller Nest wrapper or injected
  fake DatabaseService. API binds an OS-selected loopback port, never 3000/5174.
- A fresh `obs069_host_*` database runs all 83 migrations. The existing
  `jupiter_app` role must already exist; only its unconditional CREATE statement
  is skipped in the harness copy of migration 001. All normal GRANT statements
  target NEW disposable-database objects. No role attributes/membership or
  existing database ACL is altered; original role attributes are snapshotted
  before and after. Migration source files are unchanged. Teardown stops only
  the owned child, closes pools and drops only the validated generated database.
- Generated fixture passwords/JWT secret live only in memory/child environment;
  real scrypt login creates normal JWT/refresh sessions. No secret appears in
  command arguments, logs, Evidence or fixtures on disk. Raw child stdout/stderr
  is discarded, except bounded allowlisted HTTP path/status outcomes. Product
  queued Worker and verification delivery are disabled; no provider credential,
  AI encryption key, storage bucket or external AI call is configured. The real
  Hub ingestion/aggregation Worker remains enabled in that temporary process.
- Actual wrong password returns 401. Requester sees an EMPTY 200 registry, not
  private apps, and scoped overview returns 403. An early fixture incorrectly
  expected 403 on the authorized discovery endpoint; its actual scoped contract
  is an empty list and was preserved. Platform Admin discovers its managed App,
  but receives no invented tenant membership. Other-tenant ticket queue and
  Browser-credential mint are denied. Authorized mint binds actual user/org.
- A controlled SQL trigger makes real `/tickets/drafts` fail with 500 and zero
  tickets. Original trigger is removed in finally. The actual SDK's normal
  timer sends the failure to Hub; SQL finds one exception plus operation event
  with the real requester/tenant, valid shared request/trace context and no
  synthetic sensitive marker. The real Hub worker then creates a scoped Issue.
- Only the disposable Hub events table is temporarily renamed to simulate
  storage outage while business tables stay available. A real draft+submit
  still produces ONE OPEN ticket and zero commercial ledger entries. A new
  automatic HTTP ingestion attempt occurs while the table is absent, and the
  underlying renamed table has no corresponding persisted event. Once restored,
  normal retry delivers that operation exactly once, with the original request
  ID. No manual SDK flush, mock transport, fake timer or duplicate business write.
- A second incorrect fixture expected HTTP >=500 for every ingestion storage
  failure. The real batch protocol can return HTTP 200 with retryable item ACKs;
  acceptance now checks the actual network attempt, absent persistence during
  outage and exact one-row recovery rather than treating HTTP 200 as delivery.
- Real logout revokes both generated refresh sessions; the old requester cookie
  cannot refresh (401). Focused test passes in 34.978s (~29.958s actual scenario)
  and API typecheck passes. The full LOCAL gate exits zero, including latest
  managed-App identity and Platform-without-membership assertions: 422 tests
  (174 API, 37 Web, 211 Hub), builds/lint/typechecks, actual four-width Edge /
  offline/quota, Python/C# clients, measured performance and migration rehearsal.
  Both fetch and mounted-React Browser fault scripts pass afterward. The final
  actual-main test takes 34.979s (29.978s scenario). Zero disposable acceptance
  DBs/RESERVED AI attempts remain; owned API/Web PIDs 19440/49740 and enabled
  100000 monthly budget are unchanged; public local readiness remains healthy.
  Existing Vite >500-KiB advisory remains. This is
  actual AppModule/bootstrap/API/service/worker execution, not Browser shell,
  provider, worker-entrypoint process-crash recovery or staging acceptance.
  No shared business tenant, preview/main host, role configuration or existing
  listener was changed. Generated child/process/DB teardown and original role
  snapshot assertions pass after the full gate.

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
The latest executed G=423 tests, with the zero-exit actual-Web checkpoint above.
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
| 14. NestJS Adapter | O/packages/nestjs-adapter/src/index.ts | Nine adapter tests; actual controller HTTP; actual-main and authenticated Web tests in G423 | Original response/error preserved; actual main/AppModule/interceptor executes with real JWT and Browser client | Not arbitrary domain workflow coverage |
| 15. .NET/Python Integration Examples | O/examples/csharp; O/examples/python | S reference-client flag launches real external processes | Actual JSON/HTTPS-contract clients ingest/replay against fixture | Loopback/local acceptance, not installed customer deployment |
| 16. Offline IndexedDB | O/packages/browser-sdk/src/storage.ts | B native IndexedDB/real network/reload/QuotaExceededError | Journal persists offline, same IDs replay after reconnect | Offline static HTML/PWA availability not promised |
| 17. Retry and Idempotency | O/server/src/ingestion.ts, queue.ts; SDK retry code | S parallel/lost ACK/lease tests; B Feedback and event replay | One persistence/receipt, bounded retry and matching ACK cleanup | Failure to delete unavailable physical disk rows is best effort |
| 18. Privacy and Redaction | O/packages/core/src/index.ts; SDK/browser redaction | core golden/generated redaction; S privacy/export; real queued marker check | Sensitive synthetic markers excluded, technical metadata retained | Cannot promise detection of every possible free-form secret |
| 19. Distributed Correlation | core trace helpers; A/src/observability/hub.interceptor.ts; W/src/JupiterObservability.tsx | Nest/Node/Web tests; B; actual-main and actual-Web host tests | Actual Browser→API manual-write BROWSER/SERVER records share outbound request/trace/verified tenant/actor | No blanket claim for every domain/provider distributed trace |
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
| 40. Browser Responsive Acceptance | B shared Console; Help script; actual-host-browser.ts | Four widths 375/768/1024/1440 for Console/Help AND actual requester composer/detail; mounted fault fixtures | RTL/no document overflow; actual manual-write/trace/outage recovery and inspected synthetic screenshots | Not all unrelated Jupiter business workflows or every management mutation |
| 41. Help Publication | docs/help/observability-*.md; A/scripts/publish-help-catalog.ts | Runtime slug-only publication; real Jupiter Help browser checkpoint | Eleven guides runtime-published with version history; later Console/offline revisions preserved | Revised offline wording not re-read in authenticated host after latest revision |
| 42. Known Limitations | Explicit dated limits in this document; .ai/NEXT_TASK.md | Source/evidence audit and actual gate inspections | No staging/promotion/PWA/physical-disk or blanket UI claims substituted | Actual AppModule + requester Web proof exists; remaining required process/management coverage must be determined in final requirement audit |
| 43. Defects Found | Dated red tests in Evidence: storage, sampler, analytics, fetch, React | Red regressions and real mounted startup failure | Concrete defects distinguished from incorrect fixture assumptions | No count of hypothetical defects presented as acceptance |
| 44. Defects Fixed | SDK/server/adapters and their paired regression paths above | Subsequent focused/full gates plus actual Browser checks | Earlier defects and React remediation pass bounded focused/full QC | This does not establish all remaining host workflows |
| 45. Cleanup | Disposable S/A integration teardown; fresh Browser contexts; owned listeners | DB/role absence and actual-main original-role assertions, local status/listeners | G423 leaves zero temporary DBs/reservations; shared tenant/profile untouched | Do not delete unrelated output/tmp or pretend fixture teardown is backup proof |
| 46. Quality Gates | package.json verify:release; exact logs/exit markers | G423 zero, actual-Web + both Browser fault scripts pass; git diff --check | Builds/lint/typechecks/tests and actual optional scenarios executed when flags set | No-test reference package is not counted as extra unit tests |
| 47. Final Verdict | This Evidence; .ai/CURRENT_STATE.md and NEXT_TASK.md | Full-scope completion audit remains incomplete | IN PROGRESS; no next Goal, promotion or blanket acceptance | Must finish actual requirement audit and its concrete remaining gaps, not invent broad new prerequisites |

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
