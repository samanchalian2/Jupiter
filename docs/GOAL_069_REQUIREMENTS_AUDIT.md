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

### A07 — Issue Explorer / Incident Workspace (sections 41–42): PARTIAL

Inspected `OperationsService.filters/list/detail`, public IssueDetail/
IncidentDetail schemas and Console DataFields/DataTable/detail section. Current
Issue detail has event timeline, activity and related Feedback; release values
are carried by individual events, not a dedicated affected-release projection.
List order is fixed timestamp/ID descending; no supported sort/group selection
contract/control is present. These facts do not prove requested Explorer
grouping/sorting/affected-release workflows. Add explicit bounded semantics and
real current-grant/RLS/HTTP/Browser tests before accepting section 41.

Incident is currently a selected inline detail inside Console, not an independently
addressable Incident page. Existing projection includes activity, related Issue,
Feedback and persisted AI output. Generic DataTable serializes nested AI output
and evidence to JSON text; it is not proof of readable Suspected Causes and
Recommended Actions or distinct Audit History and Timeline workflows. Section 42
requires a real independent workspace, comprehensible AI/human separation and
all named panels. Audit current SQL/RLS projections before extending them; do not
invent causes/actions/impact when evidence is absent. Add route/context/refresh/
authorization/RTL/no-overflow acceptance for that actual workspace. Existing
generic detail and Investigator-tab tests must not stand in for this requirement.

This is a concrete remaining requirement, not an external infrastructure blocker
or a waiver. Preserve A01 and final 47-section Evidence reconciliation as well.

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
