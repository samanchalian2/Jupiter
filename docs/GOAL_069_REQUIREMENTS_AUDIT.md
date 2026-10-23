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

### A13 — original section13 Incident impact completeness (LOCAL QC verified)

Source inspection2026-10-23: MonitoringEngine records occurrences,affectedUsers,
windowSeconds only; IncidentWorkspace renders only those three. No stored
affected-tenant/feature/observed-duration evidence exists, despite section13.
Overview impact metrics do not substitute the Incident rule-time snapshot.
DEC-064 selected before implementation: exact single-tenant observed counts,
bounded explicit feature evidence and first/last observed span, never guessed
downtime or a cross-tenant aggregate. No new Goal/entity/migration/priority engine.
Implemented with focused real SQL/HTTP/native8+Console37/OpenAPI6 and typechecks;
full505 gate/both scripts and Incident Helpv5 publication/readback passed;
941d1ff delivered and actual CI40019657321 SUCCESS. No waiver from existing499
green. Observed span is not measured service downtime.

### A14 — section31 Issue impact projection (LOCAL QC verified)

2026-10-24 update: DEC-065 projection implemented; real123-event SQL/HTTP,
deletion/lifetime preservation,24 features bound20, tenant-free/current-grant
and actual native Explorer pass9 focused/111 intentional skips; Console38 and
OpenAPI7/typechecks pass. New-source508 full gate21037 TERMINATED0/both scripts;
explicit Python/C# follow-up, Help concepts3/severity3/Console9/readback/cleanup
pass. Scoped delivery pending; historical gap description follows, superseded
by this implemented evidence, not silently waived from an unrelated suite.

Current Issue storage/list/detail has fingerprint, first/last, lifetime occurrence
count, severity/status/assignment, related events, affected releases and activity.
Aggregation tests prove3 occurrences/2 actors, and Overview/analytics expose
cohort impact. But Issue detail itself does not return affectedUsers/Tenants/
Applications or an explicit observed-impact projection. Neither the Overview nor
a count taken only from the bounded100 detail Events proves section31's full
Issue cohort fields. Add a scoped retained-link aggregate and readable detail
projection with explicit lifetime-vs-retained distinction, without merging
same-fingerprint tenants or inventing cross-App identity. Record ADR before API
addition, real >100-event/two-actor/tenant-free/foreign/current-grant tests and
native detail assertions. Do not change runtime during active DEC-064 gate.

### A15 — HTTPS handler verification and remaining contract documentation

Section70 explicitly requires operational HTTPS/JSON ingestion. Existing generic
createHubNodeHandler can mount on Node HTTPS, and external clients/probes require
HTTPS except explicit loopback tests. But inspected executed fixtures use actual
loopback HTTP, not a trusted TLS handshake. This is a LOCAL verification gap,
not a demand for staging/production deployment or a new TLS service. After21037
terminates, verify the existing handler through a temporary locally trusted test
certificate: real authorized batch/ACK/duplicate/SQL and rejected untrusted or
wrong-host certificate, without disabling TLS verification or changing OS trust.
Generate/clean only ephemeral test keys, never commit/log real credentials.

Source OpenAPI info.description still incorrectly says rotation administration
is service-only; supported ADMIN HTTP routes now exist. Correct metadata after
the active gate, preserving bootstrap/global-authority boundary and61 operations.
Section61's actual current/previous-version regression already exists; explicit
SemVer/breaking/additive/migration policy was missing and is now documented in
observability/VERSIONING.md with current source values, no new published version.

### Final-scope audit pass2026-10-24 — sections44–65 (not whole-Goal verdict)

Inspected Investigator/provider/vault/queue/scheduler, alert delivery and Jupiter
NotificationService adapter, self-metrics/runbooks, retention, generic Node HTTP
handler, versioned contracts/tests/manifests and actual cross-domain adapter
fixtures. Evidence below is the completed505 gate, dated earlier explicit real
client execution and newer focused DEC-065; active21037 is not called green.

| Requirement / exact semantics | Inspected implementation and executed proof | Disposition / boundary |
| --- | --- | --- |
| 44 evidence-grounded recurring errors/summaries/correlation/releases/common patterns/Feedback/hypotheses/confidence/actions/daily-weekly | Investigator.evidence curates target+30 retained Events+10 related Feedback, source/version/trace/request, bounded bytes; schedule ISSUE/INCIDENT/DAILY/WEEKLY; validateInvestigation references and output | Actual persisted findings/scheduler/manual requests/native readable hypotheses/actions; bounded recent samples are not complete statistics or causal proof. Scheduler day/week is cadence, not guaranteed full-day historical population |
| 45 read-only analysis/human review | INVESTIGATOR_SYSTEM + tool-free provider request, strict schema output and no business/permission/code mutation port | Provider/core/SQL/native tests prove valid result and rejection/absence of tools; human transitions remain separate. Encryption/vault use is infrastructure-only, never model access to secrets |
| 46 untrusted text/redaction/bounded curated context/validated output/no arbitrary tools or queries/external policy | safeEvidence + cleanOutput + schema evidence allowlist; exact provider hostname/HTTPS/redirect:error/128KiB response/timeout; App externalProcessingAllowed | Real SQL/provider/core injection/citation/size/scope/external-denial tests; adversarial feedback remains data. No guarantee a language model cannot produce a mistaken hypothesis; validated output never authorizes mutation |
| 47 per-App AI/isolation/explicit cross-App permission only | exact App/environment/tenant target/evidence/config/ledger; generic grants; no cross-App provider-context operation exposed | Actual same-identity App A/B/tenant-denial/foreign citation tests. Cross-product analytics are explicitly authorized aggregates; no unapproved cross-App model context is created |
| 48 frequency/budget/output/context/dedupe/backoff/usage/concurrency/autonomous schedules | review_interval_seconds300–86400, target daily/weekly keys, advisory App reservation lock, maxConcurrent1–4, finite queue retries, UNKNOWN held | Real scheduler/idempotency/concurrency/retry/UTC/unknown/reconciliation and native actual save/reload/late-context tests. Explicit enabled100000 local; no per-Event unconditional provider call or usage guess |
| 49 operational vs customer commercial separation/provider outage continuity | independent Hub ai_attempts/config/provider injection; no CommercialService import in core; existing queue/rules/Feedback not gated by provider | Actual provider failure/zero customer settlement/manual ticket/service recovery and host outage tests; optional operational caps are not customer Smart Action charges |
| 50 all alert sources/current scoped recipients/dedupe/flood/Jupiter existing notifications | rule alerts include critical/error-rate/user-impact/release/reopen/worker; pipeline15min windows/feedback human triage; AlertService leases/15s spacing/100-recipient continuation/current grants; HubBinding registerOperationalSource | SQL >1000-recipient paging/revocation/duplicate/repair and important Feedback tests; existing NotificationService operational inbox adapter tests. In-app is real; optional email/webhook not promised, no independent-channel availability during total host failure |
| 51 all listed self-health metrics/no silent pipeline failure | SelfMonitoring provenance-separated server/SDK counters, queue/lag/issues/failed alerts/AI/retention/logical storage; scoped ADMIN UI, bounded diagnostics/fallback | Actual server failure+recovery/SDK lost-ACK/drop/expiry/quota/native self-health and storage timeout/fairness tests. Unknown stays unknown; logical bytes are not physical disk, SDK claims not server truth |
| 52 health/readiness/external probe/error metrics/integration runbook, not staging gate | generic handler health/ready, examples/health-probe.mjs, EXTERNAL_MONITORING_RUNBOOK.md/self-health authenticated read; bounded host stdout codes | Actual probe/process healthy/unready/network tests and scoped counters. External scheduler/TLS/host monitoring deployment remains GOAL-059, not marked complete from LOCAL |
| 53 per-App retention/defaults/safe idempotent bounded audited purge/no business Audit deletion | RetentionService/RETENTION_RUNBOOK:30/365/180/180 defaults, policy locks/100-row slices/continuation, pending aggregation/active Incident/AI/delivery protection, receipts8d | Actual SQL protected parent/child/failure rollback/retry/continuation/current-auth/native policy acceptance. No backup recovery/physical reclamation claim; existing canonical/business Audit untouched |
| 54 bounded storage/indexes/time queries/Issue lookup/aggregates/pagination/retention | migrations063–073 indexes/composite keys; bounded31day/100row/50group reads,10s SQL deadline, fixed metadata fields; existing targeted load/performance tests | Actual1000-event/200 concurrent-event/dashboard/retention timings; new Issue impact bounded exact Issue aggregate rather than100-row sample. No speculative partitioning added or production query plan guarantee |
| 55 async bounded failure isolation/backoff/no recursion/memory bounds/worker/business exact-once | Browser/Node fixed queues/attempt12, isolated metric journal, shared helper capture guards, generic Nest single subscription, Jupiter fetch sole dispatch/React contained effects/worker fallback | Red→green regressions plus actual mounted scripts/AppModule/manual ticket/provider retry single settlement/zero automatic intake submit. Total process outage cannot promise delivery; memory queue is finite, not durable |
| 56 every auth/isolation/forgery/expiry/revocation/export/Feedback/operational role case | Registry/hash/parent-child credentials/current authorization/RLS and browser trusted-backend mint; explicit App mappings only | SQL/HTTP/native current-role/foreign/anonymous/expired/revoked/invalid origin and export tests. CORS supplemental, never grants authority |
| 57 twenty real Browser scenarios | Existing explicit twenty-case table in Evidence, Browser/offline/lifecycle/quota/Feedback/auth/same-ID replay paths | Native Edge/network/IndexedDB actually executed in505 and newer focused9. Offline HTML/PWA and physical deletion while storage inaccessible are not guaranteed; incompatible identity never replayed as another user |
| 58 ten controlled cross-domain errors/expected business denials | Generic Nest controlled ticket/auth/config/AI/Assist/external routes; React native boundary; real directory/lifecycle worker and queued AI provider failure; actual compiled draft exception | Existing nine adapter cases plus real worker/provider/host/native evidence classify safely. Adapter route fixtures do not claim deliberate live-provider failures for every domain; original requirement permits controlled fixtures |
| 59 independent reference mandatory full flow | independent verified Browser backend/App B/config/env/SDK/failure/offline/replay/dedupe/Console/grants and explicit A/B separation, no Jupiter business imports | Actual native reference and PostgreSQL evidence covers named flow. Python/C# branch in recent505/current21037 command NOT executed; explicit current-source follow-up required before final certification |
| 60 Jupiter integration/no unrelated domain coupling | host adapters in A/src/observability and W observability/fetch/App shell; NotificationService and existing Help only host-side | Actual compiled AppModule and authenticated requester/platform native flows, manual ticket exact-once/automatic trace/network replay; personal/commercial/AI regression tests. No cohosted data, broad role promotion or new business lifecycle |
| 61 schema/current+previous/API/SDK SemVer/additive/breaking/migrations | contracts emits1.1 accepts1.0/1.1 and rejects2.0, OpenAPI1.1.0/HTTPv1, private packages0.1.0; new VERSIONING.md | Existing contract+actual HTTP tests prove runtime compatibility; explicit policy now documented. A15 stale OpenAPI administration description still needs correction after gate; no new package publication |
| 62 Persian-first/theme/fonts/RTL/responsive/accessibility/no doc overflow | reusable Console semantic CSS + host tokens/Shabnam fallback; native four-width/keyboards/44px/internal scrolling and bounded Help reader rectangles | Actual reference and authenticated Jupiter 375/768/1024/1440, inspected images/mounted tests. New DEC-065 impact artifacts require inspection after active gate; no palette/navigation replacement |
| 63 eleven runtime published guides/version history/real triggers | docs/help eleven registry-validated slugs; supported actor publisher; actual Jupiter Help/reader/trigger native checkpoint; recent Incidentv5 readback | Existing runtime history preserved; DEC-065 concepts/severity/Console revisions still source-only pending gate then explicit publication/readback. Stale guidance about editing severity/multiple-Issue relation corrected |
| 64 every performance measurement/real LOCAL results/no fabricated SLO | PERFORMANCE.md and actual server load/concurrent/window/dashboard/retention/sampling/AI scheduling/Browser quota/Node CPU + product read/write boundary fixtures | Actual measured samples only, with shared-process CPU/heap and loaded-App limitations stated. Existing original requirement asks LOCAL measurement, not invented10-loaded-products or production SLO prerequisites |
| 65 named security acceptance list/no shortcuts | shared allowlist/redaction/SQL roles/HTTP grants, AI output/evidence/host policy, strict bounds/rates/receipts/CSV, retention, offline identity/fault containment | Actual synthetic-secret/malicious text/cross-scope/forged/revoked/oversize/rate/duplicate/Feedback/export/injection/retention/non-disclosure/native regressions. A15 HTTPS verified-handshake evidence still pending, not waived by an https example string |

Sections66–73/phase A–I/DoD/all47 index/final report remain open. A14 full new-
source gate and A15 verification follow-ups must finish; this audit is not a
completion declaration or a request for staging deployment.

### Final-scope audit pass2026-10-23 — sections31–43 (not whole-Goal verdict)

| Original requirement | Current source and actual execution boundary | Disposition |
| --- | --- | --- |
| 31 Issue aggregation lifetime/unique impact/releases/state/related evidence | IssueEngine atomic lifetime state/reopen; DEC-065 whole retained-cohort detail impact separate from100 displayed Events, releases/activity/feedback | **A14 LOCAL QC VERIFIED:** actual123-event/2-actor/24-feature bounded20/tenant-free/foreign/revocation/deletion regression and native Explorer/full508 pass. Retained observations are not complete historical population or cross-App merge |
| 32 controlled Incident lifecycle/actor/time/reason/activity/Audit/human final decision | core transition matrix + locked IssueEngine.transitionIncident/Operations management; native human status/assignment/note exact three actor Audits and current permitted transitions | Existing actual SQL/native/workspace evidence, including invalid transition/unauthorized denial; AI results read-only. All allowed statuses are controlled, not forced sequential UI-only steps |
| 33 independent configurable rules/minimum/cooldown/dedupe/baseline/low traffic | MonitoringEngine rule validation/minimum samples/cooldown/exact Issue lock, normal403/untrusted critical, release baseline/change and denominator-based ERROR_RATE; all rule-code persisted evidence tests | Implemented and locally executed; release count alone not a regression. AI unavailable does not gate evaluation. Baseline is observed previous window, not trained seasonal forecasting |
| 34 bounded near-real-time worker cadence/dashboard updates | approved PostgreSQL queue override, DEC-050 scheduler10000–300000/default60000, immediate first attempt/throttled failure; controlled visible-tab10s live polling with pause/detail protection | Actual compiled two-cohort timer/worker and native11-second pause/resume/read protection. Polling is chosen rather than inventing a required SSE channel; no production real-time/SLO claim |
| 35 all Feedback categories/fields/tracking/own state independent of ticketing | validateFeedback, FeedbackService authenticated actor/no tenant required, unique logical ID/hash/tracking, actor RLS/public-vs-internal responses; FeedbackCenter | Real tenant-free HTTP identity/isolation/idempotency/response tests and actual Jupiter reader/submit native evidence; no ticket automatically created |
| 36 explicit offline action/pending/authenticated replay/ACK/disclosure/no drafts | FeedbackCenter submits explicit button only, local notice/memory warning; SDK same-scope journal+ACK; actual offline/failed reload/duplicate/lost-ACK/auth denial tests | Executed true Browser storage/network and same tracking/one SQL record. Memory fallback is warned, not promised across reload; half-written form text is not automatically persisted |
| 37 evidence-based Feedback correlation without invented causality | submit validates owned relatedEventId; Issue/Incident detail joins exact linked Events; Investigator target evidence includes only Feedback linked to the same Issue in exact App/env/tenant | Actual correlation/isolation SQL + populated Incident native fixture. It is an explicit evidence relation, not an automatic temporal/AI cause claim or implicit tenant union |
| 38 shared generic Console plus Jupiter host/required ten sections | reusable console index navigation has all named operational sections plus Inbox/self-health; generic OperationsClient; independent Browser host and actual Jupiter /operations + platform embedding | Actual authenticated independent and full Jupiter native executions; core has no Jupiter cookie/domain dependency. Host sidebar is not a replacement for Console scope checks |
| 39 every Overview metric/filter/real observations | DEC-052 exact filtered Event cohort, denominator operations, current-state counters, observed health/releases/high-impact/AI; bounded semantic panels and shared filters | A05 real SQL/HTTP/explicit UNKNOWN/13-release bound plus four-width keyboard/native evidence. No-events is unknown, not uptime100%; current counters explicitly separate from filtered metrics |
| 40 latest scoped Events/related Issue lifetime count/dates/correlation/pause | DEC-061 opt-in includeIssue≤100 authorized Event IDs, LiveEventTable, timer pause/resume/open-detail guard | Actual default compatibility/same-fingerprint tenant SQL and native one→two count/null relation/11s no-poll/resume/four-width/internal keyboard scroll. Unknown relation is not zero |
| 41 Issue search/filter/group/order/drilldown/timeline/releases/human actions | DEC-056 query controls/current grants and related arrays; DEC-065 whole retained impact | Named SQL/HTTP/native sort/group/page/release/human Audit and new impact assertions pass508; no claim from only100 displayed Events |
| 42 independent addressable Incident with all required panels/AI-vs-human | DEC-057/058 distinct route/workspace, exact composite detail/current grants, independent human_notes100 separate from activity100, bounded AI20/Audit100; DEC-064 impact extension | Actual independent and embedded Jupiter direct link/reload/Back plus populated AI/feedback/human/revocation/four widths, recent-note flood acceptance. New impact full gate ongoing; earlier workspace green not a waiver |
| 43 all named analytics/time/release/authorized products/CSV | Operations analytics10 reports + Overview trend + explicit1–10 App productComparison, bounded31day/50ranked/750hour windows; csvCell formula safety/export auth | Actual SQL/HTTP/OpenAPI/native each table/scope and product comparison/current grant/late-response tests; actual measured one1000-event App + emptyApp sample, not ten fully loaded products or production capacity claim |

Remaining44–73/A–I/all47 evidence/final report still require item-level
reconciliation; A14 remains concrete implementation work in this same Goal.

### Final-scope audit pass2026-10-23 — sections11–30 (not whole-Goal verdict)

Inspected the original bullets and current contracts/core/Browser/React/Node/
Nest, ingestion, database, queue, Registry and Operations source, not just test
names. Historical executed native/SQL/host records below remain evidence at
their actual scope. DEC-064 full new-source regression is running separately;
do not use the prior499 count to sign off its runtime change.

| Requirement and concrete boundary | Inspected implementation / executed evidence | Disposition |
| --- | --- | --- |
| 11 versioned typed/bounded UTC Event, trusted identity, column storage | contracts validateEvent/validateBatch; core enforceScope; ingestion parses then sanitizes and revalidates, fixed events columns/server received timestamp/fingerprint; actual SQL/HTTP contract and spoof rejection fixtures | Source and actual scoped ingestion evidence present; backend credentials require the consumer to authenticate their supplied actor/tenant, not a claim that Hub can authenticate arbitrary external users |
| 12 all seven categories and representative capture paths | contracts categories; Browser resource/JS/rejection/connectivity/performance, React boundary, Nest HTTP, product worker outcome hooks and FeedbackService; actual mounted/native/host failure and feedback fixtures | Implemented category/capture paths verified; domain-specific metadata is explicit, never inspection of raw forms or arbitrary job payloads |
| 13 technical severity vs observed impact vs human response, ordinary denials/untrusted critical | core transitions, existing rule tests for normal403/Browser critical, IncidentWorkspace human controls; new DEC-064 SQL/HTTP/native snapshot fields | Real gap reproduced/remediated in this pass; focused8+Console37 pass, full new-source gate pending. Observed first/last span is explicitly NOT measured downtime or a priority score; retain this measurement limitation |
| 14 generic configurable tree-shakeable Browser capture/queue/lifecycle | BrowserSdk configuration/capture/start/shutdown, package sideEffects:false; named configuration/retention/sampling/queue/native recovery tests and topological builds | Existing source/execution cover all named options; bounded batches,20 performance entries/callback, no per-event synchronous request. Tree-shaking declaration/build is not a production bundle-size SLO |
| 15 React isolation and API/context/error/feedback hooks | generic SDK-only Provider/useObservability/useRouteContext/ErrorBoundary, no Jupiter domain dependency; Web fetch integration and mounted16-fault/native scripts | Source + executed actual mounted isolation/route/form continuity. Feedback uses generic SDK hook/context, not a new domain-coupled widget |
| 16 batching/retry/redaction/correlation Node and Nest without response change | NodeSdk pending bounds/attempt12/timeout, generic resolver/interceptor/observeJob, exact-once observable and worker fault tests | Existing unit/SQL/process/native host evidence verifies controlled failure/recovery and unchanged consumer result; main product AppModule is exercised separately, not inferred from adapter tests |
| 17 real neutral .NET/Python examples and OpenAPI/auth/batch/error/retry | examples README/clients; public61-operation schema/traversal, actual Python and compiled C# process tests | Executed supported client acceptance; no claim of full production SDKs for these languages or Java |
| 18 IndexedDB safe envelope/expiry/bounds/ACK/degradation | Browser queue/store/retry code, DEC-044/048/049; actual offline reload/lost ACK/quota/data-write tests and same-ID SQL verification | Durable when IndexedDB works; memory fallback explicitly not durability, inaccessible storage cannot promise physical erasure |
| 19 all named automatic triggers with trusted connectivity | SDK start/online/visibility plus scoped probe/activity notifications, DEC-051; no-start/no-manual-flush native fixture independently proves probe/activity, failed probe and delayed same-ID ACK | Implemented; optional Background Sync not required/enabled. navigator.onLine only hints a flush, does not establish authorized API success |
| 20 logout/account/tenant/expiry/revocation/shared device | exact scope partition + credential renewal/quarantine/drop lifecycle, native twenty-case Evidence map and real HTTP/IndexedDB foreign replay tests | Executed identity transitions; no persistent credential, no replay as new identity; unavailable storage deletion remains explicitly best-effort |
| 21 safe automatic frontend capture/no recursive logging | Browser start observes safe fixed error fields/resource enum (not DOM/resource URL), sanitized Error stack, bounded queue/internal diagnostics, generic React component code and safe fetch labels | Unit/mounted/native capture and faulty-SDK scripts exercise failure isolation. Ticket/input/chat bodies never instrumented; redaction is a last layer, not permission to collect raw payloads |
| 22 worker/backend/dependency failure + outage fallback | generic Node captureException/observeJob; product worker enumerated operations/outcomes, HubBinding diagnostics; Node safe structured fallback, queue retry/outcome/compiled-host SQL outage tests | Actual product provider/worker/retry/manual-flow recovery recorded. Complete PostgreSQL failure cannot be durably stored there; fallback is structured stderr/logger, not a false DB-delivery claim |
| 23 W3C-compatible trace chain without scope bypass | core parseTraceparent/newTrace, generic Nest headers/Node context, Jupiter fetch trace propagation, Operations correlation exact authorized seed tenant binding | Actual shared Browser/SERVER trace and independent correlation native chain; identifiers never authorize. This is correlation evidence, not an inferred complete span topology or OTel collector deployment |
| 24 atomic receive→auth→validate→sanitize→receipt/event/job pipeline | HTTP authenticated credential dispatch, IngestionService.persist receipt+event+AGGREGATE in same scoped transaction; Queue.complete aggregation+completion single transaction | Real concurrent/lost-ACK/idempotent/rollback/lease tests; PostgreSQL outbox chosen by approved preamble, not dual-write to an external queue |
| 25 partial ACK, limits/backpressure/idempotency/bounded failure | batch50/524288B/Event16384B; strict API limiter; one persistence timeout switches remaining valid entries to RETRYABLE; finite SDK12 retries, fixed queue count/bytes | Actual HTTP overload/malformed/atomic/isolation plus saturated Browser and real business-write continuity/performance evidence. Not a hard production latency SLO |
| 26 logical tables/data-safe migrations/RLS | dedicated observability schema foundation063→073, fixed application/env/composite FKs, receipt/activity/grant/aggregate models; full84 migration rehearsal and legacy073 preservation | Existing executed migrations/rehearsal prove forward compatibility locally; no external/production migration or cohosted data touched |
| 27 exact App/environment/opaque tenant and explicit multi-product exports | HubDatabase scoped role+SET LOCAL; Registry authorize; Operations bounded scopes/comparison/export and dedicated worker/control roles | Real same-ID A/B tenant SQL/HTTP/current-grant/revocation/cross-product comparison tests; global control identity is explicit policy, never automatic tenant membership escalation |
| 28 generic operational roles mapped only by host | contracts OPERATIONAL_ROLES; Registry generic issuer/subject/grants; Jupiter adapter explicit platform mapping; access administration actor/reason/Audit and managed/manual separation | Actual grant/credential native and host requester/admin isolation tests; App ADMIN cannot bootstrap global authority or access another App implicitly |
| 29 centralized allowlist/redaction/AI re-redaction/separate feedback policy | core redactText/sanitizeStack/sanitizeEvent, strict metadata keys, Browser prequeue + server sanitization, Investigator evidence/output controls; Feedback textual disclosure/audience rule | Secret synthetic corpus/parity tests and native offline disclosure checks; content not collected by auto instrumentation, no claim that a regex can guarantee arbitrary text has no personal data |
| 30 deterministic versioned fingerprint, random IDs excluded/unrelated distinct | core fingerprint V1 canonical app/env/service/exception/code/operation/route/normalized first5 frames; stored fingerprint_version; scope grouping separate from hash | Actual core equivalent-random-ID/frame-line and distinct-operation/exception/App tests plus tenant-separated SQL aggregation; same fingerprint never unifies tenants |

Remaining31–73/A–I/all47 evidence/final report still require item-level
reconciliation. These rows do not mark the complete Goal accepted.

### Final-scope audit pass2026-10-23 — sections1–10 (not whole-Goal verdict)

Re-read original sections1–10 and approved preamble against current source after
bd875d8. Evidence references below are the499-test functional gate, focused
actual-host3 follow-up and earlier named native execution records, not just
directory names. Remaining sections11–73/A–I/47-section cross-check is still open.

| Sections / concrete obligation | Authoritative current source / observed proof | Verdict and boundary |
| --- | --- | --- |
| 1 execution/local-only/Goal identity and2 architecture principles | Approved preamble/DEC-038; `.ai/CURRENT_STATE.md`; scoped delivery commits/remote SHA; no host promotion | Local continuation verified, GOAL-059 separate; full Goal/phase completion NOT claimed |
| 3 existing-system audit | Evidence Architecture inventory (Nest/React/HTTP/worker/pg queue/RLS/auth/AI/commercial/Help/test boundaries); host adapters reuse existing services | Inventory documented; its runtime claims rely on actual AppModule/Worker/Browser tests, not inventory alone |
| 4 product-agnostic core and host mapping only in adapters | generic HubDatabase/Registry/HTTP/SDK identity, `apps/api/src/observability` mapping; independent verified Browser backend and actual Python/C# processes | Observed independent consumers work without Jupiter business imports/cookies; no customer-domain FK or role copied into Hub |
| 5 existing infrastructure with independent deployment capability/no new speculative stack | generic constructor-provided DB/provider/vault/identity interfaces, PostgreSQL outbox per approved override, versioned HTTP endpoint examples | Reuse/portable boundary verified in independent fixtures, not a claim that a separate production service was deployed |
| 6 six reusable package boundaries/no public publish | contracts/core/browser-sdk/react-adapter/node-sdk/nestjs-adapter manifests/source, topological builds/typechecks/unit tests and independent reference | Builds/tests executed; no npm/registry publication requested or performed |
| 7 App/environment/opaque-tenant/actor/Event/Issue/Incident/Feedback/Investigation | dedicated observability schema/RLS/composite FKs, generic principals and typed contracts; actual A/B same-identifier isolation SQL/HTTP/AI/native | Same opaque identifiers never confer cross-App/tenant access; normal trusted ingestion mapping still required |
| 8 full14-item Registry/new-App creation/disabled-ingest/Audit | A01 inventory and2026-10-23 reconciliation below; RegistryConfiguration/IngestionPolicy/AccessCredentials plus existing Rules/Maintenance/Investigator controls | Source and executed actual HTTP/native management behaviors present; final A01 signoff must retain identity/read-only key semantics and concrete RLS/current-grant/Audit proof |
| 9 versioned/documented/strict/idempotent/rate-limited/language-neutral/no Jupiter session dependence | public OpenAPI61-operation actual HTTP traversal, real parallel/lost-ACK receipts, native120/min pacing, Python/C# reference runs | Contract/workflows verified locally; Java is standard HTTP compatibility, not a promised Java SDK. Loopback acceptance is not public TLS deployment |
| 10 Browser vs Server credential security | Registry hashed parent/child tokens, Browser5min scope from trusted backend, Server scoped/revocable keys; native issue/rotate/revoke/parent invalidation/one-time secret and origin/auth SQL tests | No permanent Browser secret; origin auxiliary only. Actual default key/public metadata never authorizes actor/tenant; secrets excluded from evidence/source |

Developer example README contained stale pre-DEC-055 text implying grant/rotation
are still service-only. Corrected documentation to the actual supported ADMIN
HTTP/Console boundary; bootstrap/global authority remains deployment-owned.
No public contract/code/deployment changed in that documentation correction.

### 2026-10-23 reconciliation of the remaining A01/A07 boundaries

This is a fresh source/test-scope review, not a completion certificate. The
active final-source gate must finish and the entire original specification still
needs reconciliation. No extra staging/deployment requirement is introduced.

| Original requirement | Current authoritative implementation | Actual acceptance boundary to retain |
| --- | --- | --- |
| Section8 identity, name, description, environment/origin/enabled controls | RegistryService createApplication/applicationConfiguration/updateApplication/configureEnvironment; RegistryConfiguration.tsx | DEC-053 actual HTTP/native create, same-ID disable/resume, source metadata fields, explicit origin validation and actor Audit; immutable ID/key semantics recorded |
| Section8 ingestion/sampling policy | ingestionPolicy/configureIngestionPolicy and actual IngestionService exclusion; IngestionPolicyPanel | DEC-054 actual policy save plus real accepted/rejected/duplicate/severity sampling behavior, not merely stored JSON |
| Section8 retention/monitoring/AI/access/credential controls | RetentionService+MaintenancePanel, MonitoringEngine+rule editor, InvestigatorPanel, AccessCredentialsPanel | Existing actual SQL/HTTP/native configuration, rule PUT, current grants/manual revoke/managed boundaries, one-time masked issue/rotate/revoke with child invalidation; A12 expands optional AI controls separately |
| Section41 search/filter/group/sort/drill-down/releases | OperationsService.filters/list/detail, issueOrdering, IssueExplorerControls and Console detail | DEC-056 global-group/whole-cohort order, same-event release/category and bounded affected-release SQL assertions; native keyboard grouping/status filter/sort/paging/drill-down, late response discarded, v1/v2 observed releases |
| Section41 timeline/related feedback/human owner/status/note | Existing bounded Issue detail events/feedback/activity arrays and table rendering; OperationsService.manageIssue | Existing scoped SQL/HTTP detail/human-write/Audit tests; native status+assignment+note yields three real actor Audits. Do not infer a populated related-feedback browser panel solely from the releases screenshot |
| Section42 separate Summary/Impact/Timeline/Issues/Feedback/AI/Causes/Notes/Assigned/Status/Actions/Audit | IncidentWorkspace named semantic sections; OperationsService incidentDetail projection | DEC-057 actual SQL/HTTP and native populated fixture, distinct route/reload/Back/Forward, human-state updates and read-only AI hypothesis/actions; bounded recent notes separately verified DEC-058 |
| Section42 host integration and decision separation | /operations fragment and /platform?section=observability embedding | Actual compiled Jupiter authenticated host/worker capture→Incident, direct-link/reload/return/native Back, both standalone/embedded four-width checks; no model-driven business mutation |

Current source has implementations for all named A01 items and A07 panels;
the final audit must use these specific executed assertions rather than the
historical PARTIAL statements or generic 'all tests passed'. A12 full delivery,
updated47-section evidence index and remaining sections1–73/A–I still not signed
off. Do not manufacture missing UI proof, nor demand every unrelated Jupiter
domain workflow as a new acceptance criterion.

### A12 — approved preamble optional operational request/cost ceilings (gap)

2026-10-23: IMPLEMENTED/functional LOCAL QC VERIFIED by499-test full serial gate,
both fault scripts, scoped SQL/HTTP/UTC/parallel/UNKNOWN/retry/rate snapshot/native
four-width acceptance, migration073 rehearsal+guarded local apply and runtime
Helpv4/v3 readback. Optional settings remain null on live App/100000 preserved.
Only post-gate test-log migration counter corrected; focused host follow-up and
scoped commit/remote CI pending. This closes the concrete A12 implementation gap,
not the full original Goal audit. Historical findings below remain audit history.

DEC-062 remediation now implements migration073/nullable policy, whole-App atomic
token/request/cost gates, immutable rate/reserved-cost snapshots, verified actual
settlement/reconciliation and scoped known/unpriced reporting. Strict HTTP/
OpenAPI, compact Persian controls and Help source updated.20 focused tests pass
(pure/SQL/UTC/retry/concurrency/schema/full61-operation HTTP contract), Console34
and native save/reload/reset/zero-denial/four-width pass. Expanded native known+
UNKNOWN cost rendering also passes, with real rate-window pacing before existing
context/grant checks (browser3). Main DB83 unchanged; full gates/local migration/
runtime Help/commit/remote acceptance still required. Earlier finding below is
historical, not the current implementation boundary.

Additional observed QC before A12 acceptance: native cost screenshot renders
AI_REQUEST_LIMIT_EXHAUSTED as the only denial explanation. Add a Persian-first
human-readable reason while preserving the safe diagnostic code (section62),
and assert native denial wording/keyboard inner-scroll to far-left cost columns.
Do this only AFTER active full-run17923 terminates; then focused/native and
final-source gates again. Do not hide the observation behind the no-overflow pass.

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
