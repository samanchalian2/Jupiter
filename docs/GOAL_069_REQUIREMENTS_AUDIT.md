# GOAL-069 — Working requirement audit (IN PROGRESS)

This is a requirement-to-source audit, not a completion certificate or replacement
specification. `GOAL_069_SPECIFICATION.md` including its approved preamble remains
authoritative. The existing 47-section Evidence index locates execution records;
its existence and the 423-test baseline do not prove every required feature.
No requirement is waived because an existing suite does not assert it.

## 2026-10-19 targeted findings

| ID / source requirement | Inspected authoritative source | Result and required work | Why previous green evidence is insufficient |
| --- | --- | --- | --- |
| A01 — section 8 Application Registry: complete manageable identity/metadata/environment/status/policies/access/credentials inventory | DEC-053/054/055; RegistryService; actual ingestion enforcement; 60 public OpenAPI operations; configuration/policy/access Console; SQL/HTTP/native fixtures | **INVENTORY FINAL AUDIT OPEN.** Supported metadata/lifecycle, effective policy and access/credential management now pass the final LOCAL 462-test release gate, full contract traversal and native four-width workflows. Runtime Applications Help v5 published/read. Table below maps all original items; retention/rules/AI remain existing controls. Shared API/Web readiness is unavailable, not inferred from tests. | Completion of the new management slice is not a blanket section-8 or whole-Goal certificate. Reconcile every table row and historical evidence boundary before accepting A01; A07/full specification remain open. |
| A02 — section 14 configurable Browser retention | BrowserSdkConfiguration/constructor/capture/submitFeedback; DEC-049; SDK tests; reference retention.html + offline-browser-acceptance.ts | **IMPLEMENTED AND VERIFIED.** Optional bounded retentionMs events/feedback, copied/validated at construction, defaults 48h/24h, minimum 1000ms, no extension past previous limits. Immutable enqueue-time expiry survives retry/reload; new configuration applies to new envelopes. Four regressions pass (SDK 41). Native IndexedDB real-time expiry/default-policy reload removes both rows before SDK auth/transport, zero SQL rows. Full LOCAL 428-test gate, both fault scripts and cleanup pass. | Earlier fixed-default expiry tests did not prove configuration. This evidence covers enqueue-time Browser TTL, not server retention or physical deletion while storage is unavailable. |
| A03 — section 19 retry on successful API connectivity probe / next authenticated activity | DEC-051; Browser SDK notification ports; Jupiter fetch/session wiring; SDK/Web tests; no-start native recovery fixture | **IMPLEMENTED AND VERIFIED.** Scoped immediate-return notifications coalesce/throttle, preserve due time/credential/ACK rules and cancel on identity/logout/shutdown. SDK 46 and host fetch 14 tests/typechecks pass. Native verified-session/IndexedDB/HTTP/SQL test deliberately omits SDK.start and any explicit flush, isolating both named triggers, failed probe and same-ID post-due recovery. Both native cases, full LOCAL 440-test gate/both fault scripts and cleanup pass. | Earlier periodic recovery did not prove these named triggers. Native/full evidence is executed; a hint is not authorization or evidence of successful delivery. |
| A04 — section 34 configurable bounded rule-evaluation interval | HubBindingService + DEC-050; hub-rule-cadence.spec.ts; actual compiled host integration | **IMPLEMENTED AND VERIFIED.** Deployment-owned 10000–300000ms interval, default/fallback 60000. Immediate first attempt, failure throttling/containment; independent maintenance/AI cadence unchanged. Three unit tests/typecheck and actual compiled AppModule two-cohort HTTP→SQL acceptance pass (10000ms configuration; 10012ms focused / 10048ms full-run incident separation). Full LOCAL 432-test gate, both isolation scripts and cleanup/readiness pass. | Earlier rule windows/AI cadence did not configure scheduler frequency. New evidence exercises actual timer/worker; not a production real-time guarantee. |
| A05 — section 39 complete Overview | DEC-052; OperationsService/OpenAPI Overview; Console compact panels; real SQL/HTTP fixture and four-width native acceptance | **IMPLEMENTED AND VERIFIED.** Current critical counter plus explicitly observed health, <=10 recent releases, <=10 high-impact Issue cohorts and <=10 persisted successful AI summaries. Exact event filters, current counts and scoped summary-target semantics documented; empty health UNKNOWN, no provider call. Real SQL/HTTP tenant VIEWER/revocation/filter/13-version bound test passes; Console 16/OpenAPI 5/typechecks pass. Final four-width native/44px/Enter/internal-scroll and full LOCAL 444-test gate/both fault scripts pass; screenshots inspected and cleanup/readiness verified. | Separate pages were insufficient. New main Overview has executed native/full gate evidence; visual defects and native-summary test selector were corrected without weakening assertions. Observed telemetry is not uptime or actual deployment history. |
| A06 — DEC-044/DEC-048 diagnostic-only storage failure must not switch the data queue | Browser SDK checkpointMetrics; five data-write regressions and diagnostic tests | **DEFECT REPRODUCED AND REMEDIATED; full 424-test LOCAL gate and both fault scripts passed.** A METRICS-only put failure called degrade(), closed the data store and changed active queue status from DURABLE/1 to MEMORY/0, overwriting the data failure state. One new red test proves it. Checkpoint now leaves metric snapshot unacknowledged and reports its own fixed failure without degrading data storage. Recovery sends the original Event ID and same diagnostic report, with no recursive loss. | Existing metrics network retry tests did not inject checkpoint journal write failure; earlier data-write tests deliberately disabled metrics. Previous ADR text was stronger than actual code. |

## Scope/decision controls for remediation

### A01 section-8 inventory — supported boundaries, not a blanket acceptance

| Original item | Current supported control / identity semantics | Evidence boundary |
| --- | --- | --- |
| Application ID | Generated once; read-only integration reference, never rewritten | DEC-053 native create/disable/resume same-ID and SQL evidence |
| Name | Configuration GET/PUT and Persian form | DEC-053 real actor/Audit rollback/native |
| Slug / Key | Explicit at creation, read-only afterward for route/evidence compatibility | DEC-053; not an unimplemented rename promise |
| Description | Configuration GET/PUT/form, bounded safe text | DEC-053 SQL/HTTP/native |
| Allowed environments | Create exact key/kind, enable/disable composite target; no evidence relabel | DEC-053 native creation/existing credential gates |
| Allowed origins | Exact HTTP(S) origin list, configuration/form | DEC-053 strict validation and prior auth tests; CORS not identity |
| Enabled status | App and environment explicit reason/Audit controls | DEC-053 history preserved, no valid new ingest |
| Ingestion policies | Actual new-event source gates, legacy full defaults | DEC-054 SQL/HTTP/native; not inert policy JSON |
| Retention policies | Existing per-App retention API/MaintenancePanel, bounded worker cleanup | Existing retention Evidence and native policy save; no raw-data purge on setting write |
| Sampling configuration | Deterministic ID/category server sampling plus independent SDK options | DEC-054 native zero/restore/severe/duplicate and SDK metric proof |
| Monitoring rules | Existing rules GET/PUT and same-App editor | Real rule engine tests plus committed native rule PUT; completion-context fix |
| AI budget | Existing independent operational Investigator configuration/panel | Existing AI budget/provider/human-control evidence; no customer allowance coupling |
| Access permissions | Safe paged grants, explicit active reference/role/scope, manual revoke; managed flag read-only | DEC-055 SQL/HTTP/native core, late effects; full LOCAL 462-test gate passes |
| SDK/integration credentials | Existing issue plus safe list/atomic rotate/revoke, masked one-time output | DEC-055 parent-child/current grant/Audit rollback/lost-response native; full LOCAL 462-test gate passes |

DEC-055 adds safe own-principal discovery without a global directory so the grant
workflow does not require SQL/guessing a Jupiter user ID. New management native
and safe-result tests pass; generic/Nest no-store actual-host assertions and final
462-test release gate completed successfully. Applications Help v5 published/read
locally through the public audience service. This table reconciles the complete
inventory, but A01 remains awaiting final acceptance rather than declaring every
legacy/new management workflow proved from the table alone. A07 and sections
1–73/A–I/47-Evidence reconciliation are separate mandatory remaining work.

DEC-054 final checkpoint: the complete final-source LOCAL 452-test release gate,
both standalone fault scripts and cleanup pass. This supersedes the pending
policy-gate wording in the working A01 row above, not its PARTIAL verdict.
Policy runtime Help v4 is published/read; access/credential workflows remain open.

- A01 must cover the ENTIRE section-8 management inventory, not only metadata:
  inspect enabled/allowed environments, Origins, policy enforcement, monitoring/
  retention/AI controls, access grants and credential issue/rotation/revocation
  workflows at the supported Console/API/service boundary. Existing grant and
  rotation service ports are real but not public HTTP or Console workflows;
  do not report them as such. IDs/keys need explicit identity compatibility
  semantics rather than an assumed unsafe rename. A saved policy JSON with no
  ingestion/SDK effect does not satisfy configurable policy. This is clarification
  of the original inventory, not new unrelated administration scope.
- A06 restores an existing approved invariant; no API/schema/module/provider or
  secret-policy change is made. It does not disable legitimate MemoryQueue
  fallback when the actual DATA store becomes unavailable.
- A01/A02/A04 need recorded implementation decisions before altering public
  contracts/configuration under the repository agreement. Keep additive API
  compatibility, generic principals, current-grant revalidation, whole-App versus
  environment scope, tenant RLS and immutable audit attribution. Reuse existing
  App fields/policy where adequate; do not pre-create an entity/schema speculatively.
- Do not disable/reconfigure the active local Jupiter Application to populate
  screenshots. Use authorized disposable Apps/environments and restore fixtures.
- A05 must not invent health/impact values or expose another tenant's evidence.
  An absent observation remains unknown; an AI failure must not fail Overview.
- No new architecture/service, staging prerequisite, production SLO or requirement
  for ten fully loaded products is added. LOCAL-only acceptance and GOAL-059's
  separate BLOCKED status remain the approved boundary.

## Audit work not finished

### A12 — approved preamble optional operational request/cost ceilings (gap)

The approved requirements preamble explicitly says support optional request/
estimated-cost limits in addition to the mandatory combined monthly token budget.
Inspected InvestigatorConfiguration/configure/reservation/usage and Console now
support token/output/context/concurrency/review interval only. No optional monthly
attempt/request or estimated-cost ceiling/rate projection was found in these
contracts. HTTP abuse limits are not a per-App provider spend/request policy;
customer Smart Action cost telemetry is unrelated and must not be reused.
Do not infer this requirement complete from token reservation alone or silently
drop the approved preamble. Evaluate/document minimal nullable operational caps,
safe explicit estimation basis and atomic UNKNOWN/reservation/retry semantics
before implementation; no actual invoice/payment/pricing engine or guessed model
rates. Defaults must preserve current100000 token budget/provider configuration.
This is outstanding implementation/acceptance, not an external blocker.
DEC-062 now records the selected nullable request/estimated-USD-cost policy,
explicit rate snapshots/upward integer rounding and fail-closed unpriced legacy
semantics BEFORE implementation. No migration/API/runtime control exists yet;
A12 remains OPEN. Preserve live null optional limits and100000-token policy.

### A11 — section40 Live Monitor required Issue context (source gap)

DEC-061 remediation implemented: optional includeIssue only on Event list,
default/false legacy shape unchanged, one bounded scoped page-link batch and
fixed lifetime Issue context/null. Compact dedicated table makes App/env and
Event time distinct from Issue count/first-last. Focused SQL/HTTP/OpenAPI7,
Console32 and native real11s pause/new-event/resume/detail-protection/four widths
pass. Latest native also verifies keyboard horizontal scroll and normalized
nowrap UTC. Actual compiled-host3 passes existing correlation/manual/Incident
flows. Console Help v8 published/read. Final-source third482-test serial gate/
both isolation scripts pass; final visual date/button/severity widths inspected
and native assertions pass. Cleanup83/zero fixtures/zero active attempts/unchanged
100000 verified. A11 concrete remediation accepted locally; full Goal remains open.
Earlier finding below describes pre-remediation code and is retained for audit.

Original section40 explicitly names related Issue, event count and first/last
seen alongside current severity/operation/correlation and Pause/Resume. Current
Console live maps directly to OperationsService events listing: fields include
received/occurred timestamps, source/severity/operation/trace/request but no
Issue reference or Issue occurrence/first_seen/last_seen projection. A raw Event
timestamp or paginated total is not proof of those related-Issue fields. Existing
UI has a real ten-second visible-tab refresh and Pause/Resume button; inspecting
that timer does not prove the entire named workflow under incoming events.
Reconcile section40 at actual authorized SQL/HTTP/native scope after A09's gate,
including truthful unaggregated Event state, bounded query cost/row count,
tenant/App isolation and actual pause/new-event/resume. Do not invent Issue
counts or claim this gap is an external infrastructure blocker. No production
change chosen yet; record ADR before an additive read contract.

### A10 — bounded Incident human-note visibility (source boundary)

**REPRODUCED AND REMEDIATED; final full gate passes.** Native red log
output/goal069-incident-notes-red.log proves the old oldest100 projection hid a
fresh committed note after105 earlier activities. DEC-058 now returns newest100
activity and independent newest100 human_notes, stable created_at DESC,id DESC.
Focused SQL/HTTP/OpenAPI/native green proves105 older notes and105 later non-note
activities, fresh note/order, same tenant authorization and unchanged history
count/digest. No migration, new operation or increased cap. Actual authenticated
Jupiter host acceptance output/goal069-incident-notes-host-2.log passes both
/operations and /platform?section=observability fragments: direct link, reload,
return and native Back preserve section; all four widths RTL/no document overflow,
zero page errors. First host attempt failed before tests at readiness; retry
passed unchanged timeout, cause not established. Help v4 published/read locally.
Final serial472-test release, both isolation scripts, diff check and post-gate
zero-fixture/zero-RESERVED readback pass (output/goal069-notes-final-release.log).
Do not infer whole section42/full Goal completion from this repaired boundary.

### A09 — section23 operator-followable distributed correlation: verified boundary

DEC-060 remediation now implements seed-bound61st public operation and lazy
Console drill-through. Focused SQL/HTTP/full OpenAPI/native8 cases pass;105-row
bound/pagination, no recursive bridge, exact tenant including tenant-free even
for all-tenant admin, invalid query and current revoke. Dedicated native proves
55-row paging/UTC range/missing IDs/revoke/held late read/four widths. Actual
authenticated Jupiter host proves real failed ticket Browser+Server evidence in
Operator UI for both TRACE and REQUEST. Console Help v7 published/read; final
serial final-source third478-test gate/all builds/lint/typechecks/migration/
native/reference/performance/both isolation scripts and cleanup pass. Final
accessibility red22px fixed44px, four widths/Enter asserted. First full failure
was newest25 fixture assumption; actual page2/40 selection proved, exact seed
retained. This is concrete executed evidence beyond capture,
not a full original-specification completion certificate. Earlier finding below
describes the pre-remediation source, retained for audit history.

Actual host/Web acceptance proves Browser and Server rows share a real W3C trace
and request ID under SQL/current scope; SDK propagation/storage is implemented.
Inspected `OperationsService.filters/list/detail`, HTTP/OpenAPI and Console,
however, expose these identifiers only as cells. No supported traceId/requestId
filter/correlation endpoint or operator drill-through workflow is present;
q searches message, not identifiers. An SQL fixture join is not the requested
ability for an Operator to follow a failure chain. Implement bounded authorized
App/environment/tenant correlation and actual HTTP/native drill-through evidence,
with duplicate IDs across tenant/App deliberately denied. A trace/request ID must
never grant broader scope. Do not mark section23 complete from capture alone.

### A08 — operational Investigator configuration workflow (source inspection)

Original sections8/44/48 require manageable AI budget/frequency/limits and
current-scope operation. `InvestigatorService.configuration/configure` exposes
and validates maxOutputTokens/maxContextBytes/maxConcurrent/reviewIntervalSeconds.
DEC-059 now exposes all four existing limits in the compact Persian form, with
service bounds/defaults, explicit App-wide semantics and non-secret limit Audit.
Native red log output/goal069-investigator-config-red.log reproduces a real
authorized PUT success leaking into the new App. Shared CommandContext now guards
save/analyze/reconcile; obsolete success/error/callback cannot refresh new scope.
Focused green3 proves actual save/Audit/readback/reload, monthly budget and four
limits, retained encrypted credential, held400/App and201/tenant scope switches,
real UNKNOWN controlled-provider attempt settlement/actor Audit with no obsolete
parent refresh, current revocation and four-width RTL/no document overflow.
Console30 tests pass; runtime AI Help v3 published/read. Final serial476-test
release/all builds/lint/typechecks/migration/native/reference/performance and
both isolation scripts pass; cleanup zero temporary DBs/RESERVED, unchanged100000
budget. Not a whole section8/44/48 certificate. Live provider/key unchanged.

### A07 — Issue Explorer / Incident Workspace (sections 41–42): PARTIAL

Initial inspection covered `OperationsService.filters/list/detail`, public
IssueDetail/IncidentDetail schemas and Console generic detail. At that checkpoint,
Issue detail had event timeline/activity/related Feedback but release values
only in individual events, not a dedicated affected-release projection.
Original list order was fixed timestamp/ID descending with no supported selection;
individual event release values did not prove affected-release workflow. DEC-056
now adds explicit bounded global sort/group and retained affected-release detail,
and fixes previously inert Issue release/category filters. Real SQL/HTTP scoped
fixture, 100-release bound, full OpenAPI traversal and native four-width keyboard/
late-response/human status-assignment-note acceptance pass. Console Help v6
published/read locally; final serial467-test release gate, all builds/typechecks/
lint/native/reference/performance/migration/fault scripts and cleanup pass. This addresses those
concrete gaps, not a blanket section-41/full specification acceptance. Reconcile
the existing related-feedback/timeline/search/permission evidence at actual scope.

Incident originally used selected inline detail and JSON nested output. DEC-057
now implements a distinct addressable workspace on a strict scoped fragment,
all named readable panels, exact narrow Audit/assignee/current-manage/lifecycle
projection and retained timeline. Real SQL/HTTP/OpenAPI and native independent
navigation/reload/Back/Forward/human/late/current-grant/tenant/RTL/four-width
acceptance pass. Actual authenticated Jupiter/compiled worker HTTP→Incident,
direct-link/reload/four-width acceptance also passes, zero page errors. Incident
Help v3 published/read locally. Final serial472-test full release/build/lint/
typecheck/migration/native/reference/performance/fault scripts and cleanup pass;
earlier failed fixture runs explicitly retained. No whole section/full Goal
certificate inferred: A10 long-lived notes/embedded Platform reload remain,
and A08/A09/full original audit are not waived.
Actual Jupiter proof currently exercises standalone `/operations`. Source
`PlatformPro` preserves its observability selection in search parameters, so
fragment routing does not replace it; nevertheless add actual embedded
`/platform?section=observability#obs/incident/...` reload acceptance before claiming
every host embedding verified. (The earlier tab= example was incorrect.) This
actual embedded acceptance now passes in DEC-058's focused host run, including
four widths and native Back; final-source472-test full release gate passes.

Concrete next-source inspection: host `App.tsx` matches only exact `/operations`;
`OperationsWorkspace` embeds Console, independent reference has no router.
An addressable workspace must define host-compatible link/refresh/back semantics,
not just rename current detail. Migration065 `audit_scope` is App-only and runtime
does NOT have SELECT (previous inspection statement corrected by actual ACL
query/test); control cannot read Incidents either. Do not read whole App Audit
or grant broad runtime SELECT. Authorize
the exact Incident composite under tenant RLS first and restrict any audit query
to its fixed action/reference and safe fields, excluding arbitrary metadata.
Existing `InvestigationOutput` has bounded hypotheses/evidence/confidence and
recommendedActions; use it for readable human-review panels, never stringify
the nested output or infer causes from absent evidence. Implementation now follows
these constraints; final-source full gate and complete original audit remain.

These concrete gaps have focused implementation evidence, not an external
infrastructure blocker or waiver. Preserve A01 and final 47-section Evidence
reconciliation; full Goal status remains IN PROGRESS.

### Console mutation-context defect — reproduced, focused remediation verified

Native actual HTTP fixture held a committed authorized rule PUT, switched App/
section and released the response: baseline rendered one old success notice in
the new scope (expected zero). CommandContext now guards rule/detail/create/CSV
completion by current client/App/environment/section/filters/latest command and
unmount; detail also checks the opened generation. Four unit cases and actual
native red-to-green response pass. Expanded native acceptance passes real 400
error suppression on section change, actual CSV download suppression after App
change, and one committed creation without obsolete redirect. Original targets/
Audit are not cancelled/retargeted/undone. Temporary global create grant revoked;
disposable fixture only. Final serial LOCAL 456-test release gate/both fault
scripts and cleanup pass, including the held committed detail-note/close with
no stuck busy/obsolete notice. Earlier broad run failed during overlapping build
and is not counted as a pass. This addresses
the concrete completion race, not all Console workflow requirements.

The source sections 1–73 and DoD have been reread. The rows above record concrete
findings, not final disposition of every bullet. Continue reconciling the other
explicit Console/detail/correlation, security, performance, integration,
versioning, Help and final-report requirements with current code and executed
evidence. Expand each remaining claim at the requirement's actual scope; do not
replace this work with one PASS per section or a search result.

Before final completion, every explicit numbered requirement, named artifact,
command/gate, A–I phase and DoD item needs an inspected implementation/execution
record or an explicit unresolved gap. Current verdict remains IN PROGRESS.
