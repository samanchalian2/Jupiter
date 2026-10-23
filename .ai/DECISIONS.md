# Architecture Decisions

## DEC-063 — Stable Help domain relevance on a fresh catalog

Actual clean CI PostgreSQL acceptance exposes an existing search ranking defect:
a newer partial title match outranks the exact domain tag (e.g. ticket setup vs
ticket lifecycle). Reproduce with two temporary published articles through normal
authoring; do not relax expected search relevance or alter runtime seed history.
Keep API shape/audience/publication/query filters. Rank exact title, exact tag
with title match, exact tag alone, partial title, partial tag, category, then
summary; earlier title match precedes publication time/title/slug tie-breakers.
This also prevents a newer generic notification guide with the same tag from
outranking the matching subscription-title guide. No slug-specific boost, new search engine, migration
or authorization change. Generic red/green SQL integration plus original Persian
queries and fresh remote CI are required. This is a release-gate remediation
within GOAL-069, not reopening/changing the scope of GOAL-056.

## DEC-062 — Optional operational request and estimated-cost ceilings

Status: implemented, LOCAL functional499-test/native/schema/Help QC verified;
scoped delivery/remote CI and whole-Goal original-scope audit remain separate.
Source: GOAL-069 approved preamble/A12. Keep mandatory combined monthly token
budget and the existing provider interface. Add nullable per-Application monthly
provider-attempt and estimated-cost ceilings to the existing configuration;
omission preserves an existing optional setting, explicit null removes it, and
new/legacy configurations default to null. No automatic activation, guessed
model rate, customer commercial pool, payment or invoice dependency.

An operational request means one persisted provider-dispatch attempt, including
retries/fallbacks and UNKNOWN outcomes; queueing/duplicate logical requests and
diagnostics do not create another attempt. Count reservations conservatively,
including interrupted dispatches, in their original UTC month across all App
environments/tenants. Request counts are not silently refunded after failures.
Use the existing App advisory lock for token/request/cost checks plus reservation
in one transaction, before decrypt/dispatch. Denial stops AI only.

Cost is explicitly an ESTIMATE in integer USD micro-units, not a provider bill.
Admins must supply BOTH input/output rates in USD micro-units per million tokens
before enabling a cost ceiling. Zero rates require explicit configuration; null
is unknown, never zero. Use exact integer arithmetic and upward rounding of the
combined input/output charge. Snapshot rates and the conservative reserved cost
on each new attempt; actual verified token settlement/reconciliation derives its
estimate from THAT snapshot, not current configuration. Preserve immutable ledger
identity/rates/reservation and existing terminal-state protection. UNKNOWN holds
its full cost just as it holds tokens; retries reserve separately.

Do not reprice/backfill historical attempts or manufacture provider usage. If
the current UTC month includes unpriced non-released attempts and a cost ceiling
is enabled, deny further dispatch with an explicit estimate-unavailable reason.
Expose known estimates and unpriced-attempt counts truthfully in the existing
scoped usage projection; never present incomplete totals as actual spend. Default
null limits/rates preserve the encrypted live key/model/enabled100000 policy.

Acceptance must include real SQL/HTTP concurrent reservations, UTC boundaries,
retry/UNKNOWN/reconciliation/legacy/rate-change semantics, immutable snapshots,
current-grant/RLS denial, full OpenAPI, compact Persian controls and actual native
save/readback/denial/nullable reset/four-width behavior. No new operation needed;
an additive migration/contract update requires full migration rehearsal/gates.

## DEC-061 — Bounded Live Monitor Issue context and non-destructive refresh

Keep existing events listing/filter/pagination and default response unchanged.
Add optional includeIssue=true|false ONLY on GET events list (not detail/export/
other resources). True adds related_issue:null or a fixed safe Issue projection
to each bounded page Event. Fetch links for<=100 already authorized Event IDs in
one batch, exact App/environment/Event/tenant composite plus existing RLS/current
grant. No N+1, unbounded Issue scan, migration, new operation or business coupling.
OpenAPI documents legacy EventRow versus opted-in LiveEventRow;61 operations stay.

Issue occurrence_count/first_seen/last_seen are lifetime aggregation observations,
not page/window Event counts or receive timestamps. Null is no recorded related
Issue, not zero/healthy or a claim that aggregation must be pending. Raw list
filters/default severities are preserved. Compact reusable Live table explicitly
shows current App/environment, Event time/severity/operation/correlation and the
related Issue lifetime context; no nested JSON dump/new main navigation/palette.

Pause/Resume affects automatic visible-tab ten-second refresh, not collection or
backend aggregation. Explicit manual refresh/filter changes remain deliberate.
Automatic refresh also waits while Event detail is open, so reading evidence is
not destroyed by the next timer tick; closing detail resumes cadence unless
explicitly paused. Real Browser tests observe new committed events during pause,
absence of list requests while paused/reading, then fresh rows on normal resume.

## DEC-060 — Seed-bound operational correlation, not global tracing search

Section23 requires an Operator-followable retained evidence chain. Add GET
/operations/applications/{applicationId}/events/{eventId}/correlation with explicit
environmentId, optional tenantReference, kind TRACE(default)/REQUEST and optional
from/to/page/pageSize. Authorize and read the exact seed Event under existing
current-grant/tenant RLS first. Match ONLY that seed's trace_id or request_id,
in its exact App/environment/tenant (IS NOT DISTINCT FROM, including tenant-free),
even when the caller has all-tenant access. No caller-supplied arbitrary identifier,
cross-product/tenant union, recursive OR matching or authorization by identifier.

Default window is seed occurred_at ±15 minutes; explicit window <=31 days uses
occurred_at inclusive, pagination1–400 and1–100 rows(default50). Chronological
occurred_at,event_id order, exact total and bounded sanitized fixed Event fields,
including existing span_id/operation/route/status/duration. Missing selected ID
returns available=false and empty items, never an unfiltered fallback. Retention,
sampling and missing instrumentation make this observed evidence, not a complete
causal parent-child trace; never invent spans or state that correlation proves cause.
No migration/new tracing infrastructure/provider work. Additive public OpenAPI
contract and reusable Console drill-through retain current scope and discard late
reads on context change. Validate strict query keys, UUIDs and window/pagination.

## DEC-059 — Operational Investigator controls and command ownership

Expose the existing validated per-Application configuration fields in the compact
Console: output128–4096 tokens, context2048–32768 bytes, concurrency1–4 and periodic
review300–86400 seconds, alongside monthly combined input+output budget. Existing
service defaults remain1024/16000/1/300. No new provider contract, endpoint,
migration or commercial allowance coupling. Exact reason/real actor Audit also
records these non-secret limits; existing encrypted credential is preserved when
replacement is blank and never returned. Limits are ceilings, not a promise to
run exactly on schedule or a guarantee of provider context/token usage.

Investigator reads/commands are owned by current client/App/environment/tenant.
Use the shared CommandContext guard for completion ownership, reset transient
forms/messages on scope change and invalidate on unmount. Late success/failure
may not clear new credentials/reason, refresh a new scope or show old notices.
This never cancels/retries a write already committed by the server. Reconciliation
uses the same rule before invoking its parent refresh callback. Current server
authorization remains authoritative. Native tests hold real authorized responses,
switch scope and verify committed Audit separately from discarded UI completion.

## DEC-058 — Bounded newest Incident activity and independent human notes

Section42's Human Notes must show the fresh note a human actually submitted,
even after >100 older activities or >100 later non-note activities. Existing
oldest100 activity projection is insufficient; filtering it in the UI cannot
guarantee note visibility. Use existing immutable incident_activity, no migration,
new entity, write behavior or expanded unbounded result.

Incident detail's activity becomes newest100 ordered created_at DESC,id DESC
(documented order refinement; previous contract did not promise ascending order).
Add human_notes: newest100 NOTE_ADDED rows with identical scoped fixed-field
projection/order, independent of status/assignment/rule activity count. No raw
payload, new permission or global Audit read. Retention still governs eligible
history; this is bounded recent evidence, not the entire archive. Additive API
field is documented in OpenAPI and follows existing tenant RLS/current grant.

Workspace Human Notes reads this dedicated projection and explains newest-first
limits; current status is labeled current state, not an assertion that initial
rule-generated NEW came from a human. Actual new-note UI/HTTP/Audit tests run
against saturated disposable history; history counts/digests remain unchanged by
reads. Cross-tenant/App/environment and current revocation remain mandatory.
Also verify existing fragment links in Jupiter's embedded Platform tab, not only
the standalone /operations route, including real authenticated reload/back.

## DEC-057 — Addressable Incident workspace and narrow operational projections

Section42 gets a separate reusable workspace selected by fragment
`#obs/incident/{applicationId}/{environmentId}/{incidentId}?tenant=...` on the
current host page. Fragment navigation is intentional: the reusable Console is
embedded by Jupiter /operations, Platform panel and independent clients without
owning their routers. It creates a distinct reloadable/bookmarkable page with
native Back/Forward and does not rename the inline detail. Fragment carries no
credential, only explicit opaque scope; empty tenant is tenant-free, omission
is all-authorized scope. Links from lists bind the row's actual tenant, not a
wider selected filter. Strict UUID/path/query validation rejects malformed routes
without fetching another scope. Invalid recognized route is an error page.
Unknown fragments (including #alerts) remain host-owned. Current auth/grants/RLS
are rechecked by normal detail and command APIs on every navigation/refresh.

Existing Incident detail adds <=100 newest retained linked event timeline and
<=100 newest immutable Audit projection; existing activity/issues/feedback/
<=20 successful AI outputs remain. Timeline observes the related Issue history,
not proof that all historical events occurred during this Incident. Impact is
the existing rule-time snapshot; absent values remain unknown. Fixed AI schema
renders readable summaries, hypotheses/confidence/evidence and recommendations
separate from human status, notes and assignment. Nothing executes a suggestion.

Migration065 runtime has INSERT, NOT SELECT, on Audit; its RLS is App-only. Do
not broaden grants or query all App Audit. First read the exact App/environment/
Incident under normal tenant RLS/current authorization. In that same transaction,
temporarily switch to the existing control role, recheck the current grant,
and only then select fixed
INCIDENT_STATUS_CHANGED/INCIDENT_ASSIGNED/INCIDENT_NOTE_ADDED rows matching exact
incidentId. Project id/action/safe reason/actor/time only, never arbitrary metadata.
Assigned operator resolves only this exact Incident's principal id/displayName/
active flag, no global directory. Restore runtime role in finally before any
linked data reads. Control cannot read Incidents and receives no new grants;
exact Incident existence/tenant is established only by the RLS-protected read.
No migration, new endpoint, RLS weakening or global Audit read API.

Workspace mutations retain existing human-only APIs, safe reason and permitted
transitions. Status changes are separate from note/assignment, explicit unassign
is distinct from leaving assignment unchanged. Late read/mutation completions
are discarded after route/client/unmount change; no automatic command retry or
provider call. Back returns to Console in previous App/environment when known;
direct entry uses the route's scope, not a guessed default. Same theme/compact
RTL controls and inner-scroll tables; no new main navigation.

## DEC-056 — Bounded Issue Explorer query and affected-release projections

GOAL-069 section 41 extends the existing Issue list/detail contract, no migration.
Optional Issue-only sort is LAST_SEEN (default), FIRST_SEEN, OCCURRENCES or
SEVERITY, descending with ID descending as stable tie-breaker. Optional groupBy
is NONE (default), STATUS or SEVERITY. Group totals cover the entire filtered
authorized cohort, never only the current page; bounded enum buckets return
Issue counts, not occurrence totals. Rows are ordered by selected group then
selected sort, with pagination across that complete order. Severity rank is
CRITICAL, ERROR, WARNING, INFO, DEBUG. Status rank is lexical and documented.
Group selection is a normal status/severity filter, not implicit scope widening.
Issue status is validated against OPEN/INVESTIGATING/RESOLVED/IGNORED/REOPENED.

Issue category/release filters require a retained linked event in the requested
UTC window matching both supplied predicates on the same event. The Issue's
last_seen window remains the existing selection boundary. RLS/current grants
apply to both the Issue and event subquery. No raw payload or cross-tenant totals.
Other resources, Overview/detail/export reject Issue-only sort/groupBy parameters
instead of silently ignoring them. Existing defaults/response fields remain;
Issue pages additionally carry sort/groupBy/groups. No new operation or endpoint.

Issue detail adds at most 100 affected releases grouped from all retained linked
events, with nullable unknown release, event count, first/last occurrence, ordered
by count then release (NULL last). This is observed evidence, not release causality,
deployment history or lifetime impact after retention. Console makes that limit
and grouping/pagination semantics explicit, with keyboard-accessible drill-down.
No lifecycle, provider, authorization or customer allowance change.

## DEC-055 — Supported Application access and integration credential management

GOAL-069 section 8 extends the existing Registry, not a parallel identity/key
service. New public App-management reads/commands require current whole-App ADMIN
or Hub Super Admin; scoped ADMIN cannot use them to manage broader scopes.
Existing issue-server-credential API retains its environment ADMIN compatibility.
GET `/operations/identity` returns only the current active verified principal UUID
and display name, so a user can share their own exact reference with an App admin
without SQL or global principal search. It grants no App/tenant access and returns
no issuer/subject/email. The Console displays it read-only in a compact details
control, including when the account has no visible Applications.

GET/POST `/operations/applications/{id}/access-grants` lists bounded paged grants
and assigns a role to an exact already verified active generic principal UUID;
no public identity creation, cross-App user enumeration or credential lookup.
Optional environment must belong to the App; absent environment covers the App.
Absent/null tenant covers all tenants within that environment/App, as in the
existing grant model; it does NOT mean tenant-free-only. Existing grant principals
are displayed with names. New target UUID must come from trusted host identity
administration, not a Jupiter membership assumption. Duplicate active manual
scope returns a fixed conflict code, never raw SQL. Role changes are explicit
revoke/new-grant, not silently overwritten history. POST `access-grants/{id}/revoke`
preserves the record/Audit, is repeat-safe and cannot alter managed_by grants;
those remain owned by the trusted host mapping. Self-revocation is explicit and
may remove the operator's access; Hub Super Admin remains the recovery authority.

GET `credentials` lists only server integration credentials with mint permission,
parent NULL and no actor/tenant reference, tenant_all=true, with bounded paging;
no token/hash, Browser/session or host short-lived credential list is exposed.
POST `credentials/{id}/rotate` and `/revoke` require whole-App ADMIN and exact
composite integration target. Rotation rejects expired/revoked credentials and
disabled App/environment, locks the old row and atomically revokes it, issues a
90-day replacement with the same integration permissions and Audits the real
actor. Revocation stays possible while disabled/expired, repeats without a second
Audit, and invalidates old Browser children through existing parent checks.
Credentials are hashes only in DB. Issuance/rotation responses alone include the
new token once; never list/readback/log/Audit/Help or browser persistent storage.

The existing Console Applications section hosts compact reason/impact-confirmed
forms. A new token lives only in component memory until explicit dismissal,
App change/unmount; no auto-copy/download or automatic retry of a secret command.
An uncertain network result is NOT proof of rollback: refresh safe metadata and
reconcile/revoke before issuing another token. Obsolete response secrets are
discarded, not rendered in another scope. Current-grant validation, FK isolation,
atomic Audit and existing no-store HTTP boundary remain mandatory. No migration,
global role/grant management, external user provisioning or commercial changes.

## DEC-054 — Effective Application ingestion/sampling policy (GOAL-069)

The existing bounded Application policy JSON owns a version-1 `ingestion` member;
no parallel store/migration or customer allowance change. Defaults preserve all
four source types and 10000 basis points for every existing event category.
Whole-Application ADMIN or current Hub Super Admin may read/replace it through
GET/PUT `/operations/applications/{id}/ingestion-policy`, with safe mandatory
reason, strict complete schema and same-transaction real-actor Audit. Other
policy members remain unchanged. Scoped admins cannot change App-wide policy.

Ingestion validates/redacts/enforces identity first. For an active App/environment,
an existing accepted receipt wins over later policy changes (duplicate or content
conflict), before new policy decisions. New events must have an enabled source.
ERROR/CRITICAL bypass sampling but NOT explicit source disablement. Other events
use SHA-256 of lowercase App/environment/Event UUIDs, first 32 bits / 2^32 against category
basis points / 10000; retries use the same ID, not random draws or client hints.
Excluded events return existing terminal REJECTED ACK with fixed codes
SOURCE_DISABLED_BY_POLICY or SAMPLING_EXCLUDED; they create no receipt/event/job.
They are not persistence failures or billable actions. A deliberately resubmitted
previously excluded ID is evaluated against the then-current policy; excluded
IDs are not falsely represented as persisted/deduplicated evidence.

Policy applies to all event-ingestion clients, not Feedback/diagnostic channels.
SDK-local sampling stays independent; server filtering cannot recover events the
SDK never sent. No fabricated weighted analytics or automatic remote SDK config.
The policy is read within the event transaction, without shared mutable cache;
in-flight transactions may finish using the policy observed before an update.
Malformed stored policy fails retryably (no silent default/drop), while absent
legacy policy uses defaults. Console explains impact, protected severities and
terminal exclusion, requires reason/confirmation, and discards stale App replies.
Known terminal policy exclusions remove the SDK queue item without incrementing
failure/drop or retry-failure counters; other rejected ACKs retain their existing
drop behavior. Measured server rejected ACKs remain truthful totals. No excluded
event is counted as accepted, delivered recovery, or data-loss failure.

## DEC-053 — Explicit Application/environment lifecycle configuration

GOAL-069 section 8 adds supported GET/PUT /operations/applications/{id}/configuration
and PUT /operations/applications/{id}/environments/{environmentId}. Configuration
read/write requires a current whole-Application ADMIN grant (or Hub Super Admin),
not merely a tenant/environment-scoped ADMIN. Existing origin-only API stays
compatible. UUID, Application slug and environment key/kind are immutable identity
and historical-context fields; names/descriptions/origins and enabled status are
managed explicitly. No deletion, evidence relabeling or new grant is implied.

Configuration updates require a safe reason and lock the existing target row;
immutable actor-bearing Audit and update commit in one transaction. Environment
configuration accepts enabled status only, validates the composite App/env target
and records the prior/next state. Disabling denies existing and new ingestion
credentials through the current credential and ingestion gates; historical
evidence remains readable under normal grants and re-enabling restores that
same identity. No credential is copied/returned in configuration. Unsupported
properties and unsafe metadata are rejected. No migration, provider/commercial
contract, role expansion or host deployment. Sampling/ingestion-policy and
grant/credential management workflows remain required A01 work, not placeholder
controls or waived requirements.

## DEC-052 — Bounded, evidence-scoped Overview panels

GOAL-069 section 39 extends the existing Overview response additively with a
current-state critical_issues counter and four bounded projections: observed
applicationHealth, recentReleases, highImpactProblems and latestAiFindings.
Existing fields/roles/current-grant checks/RLS are preserved; no new route,
schema, service or provider call. Current active counts remain CURRENT_STATE;
all event-derived panels use the exact selected time/severity/category/release/
text cohort and authorized tenant scope. Tables return at most ten rows with
deterministic tie-breaking; no unbounded payload or credential projection.

applicationHealth is explicitly FILTERED_TELEMETRY_OBSERVATION, not an uptime
probe: no events => UNKNOWN, observed errors => ERRORS_OBSERVED, otherwise
NO_ERRORS_OBSERVED. It never asserts a healthy host from silence. Release
first/last observation is within the selected window, not deployment time.
High-impact problems rank matched ERROR/CRITICAL Issue events by distinct
affected actors, tenants, occurrences, then ID; counts describe that cohort,
not lifetime totals. Missing release/actor/tenant remains null/zero as appropriate.

Latest AI findings are successful persisted investigations created in the
selected window under the same scope. With severity/category/release/text
filters, only ISSUE/INCIDENT investigations whose target Issue has matching
events qualify; unlinked DAILY/WEEKLY summaries are excluded rather than
misrepresented as filtered evidence. Without these event filters, authorized
successful summaries may appear. Only ID/kind/summary/created time/target are
projected, no provider configuration, cost or raw attempt data. Querying persisted
findings does not run AI; missing findings are an empty list, not a provider
failure. Console shows scope/basis wording and compact tables, not a new nav.

## DEC-051 — Scoped, coalesced Browser recovery notifications

GOAL-069 section 19 adds non-awaitable Browser SDK notifications
`notifyApiConnectivity(expectedScope, successful)` and
`notifyAuthenticatedActivity(expectedScope)`. A trusted host calls the former
only after an actual successful API response/probe; a failed probe or
navigator.onLine is not API health. Activity requires a non-null current actor.
Both require the exact expected current Application/environment/actor/tenant
and only schedule the existing flush path. They do not authorize ingestion,
mint credentials, renew TTL, clear backoff or claim successful delivery.

Notifications coalesce into one pending task and at most one scheduled attempt
per two seconds per current context. Repeated activity during the cooldown
schedules one trailing attempt, never a request per business operation. The
callback rechecks identity/generation; context switch, logout and shutdown cancel
pending work. Shutdown suppresses new notifications immediately. Flush still
enforces due times, current credentials, generation guards and valid ACKs.
Notification/context/storage failures are best-effort and never propagate to
business work. Existing startup/visibility/online/ten-second timer remain.

Jupiter's fetch adapter supplies a current scope snapshot separately from the
existing identity guard. It notifies activity before dispatch and connectivity
only on a successful same-identity response, excluding Hub/self calls. It never
awaits recovery or retries a business request; session refresh synchronizes
context before activity notification. No new background probe service, schema,
wire/provider/commercial contract, credential persistence or business dependency
is introduced in reusable packages.

## DEC-050 — Bounded host monitoring-rule cadence

GOAL-069 section 34 uses deployment-owned
`OBSERVABILITY_RULE_EVALUATION_INTERVAL_MS`, default 60000, supported integer
range 10000–300000 milliseconds. Omission, malformed input and out-of-range
values safely resolve to the default; no supplied value/secret is logged and
an invalid optional setting must not prevent product boot. Changes take effect
on host restart. Existing two-second drain controls scheduling granularity;
this is a target interval, not a hard real-time guarantee.

Rule evaluation has its own last-attempt timestamp. It runs immediately on the
first worker drain, then no more frequently than configured, including failures.
The existing non-overlapping drain remains authoritative. Rule failures use the
existing fixed, rate-limited WORKER_DRAIN_FAILED diagnostic and do not prevent
other maintenance/queue work in that drain. The independent 60000ms maintenance
schedule for alerts, retention, self-metrics, storage sampling and Investigator
scheduling stays unchanged; rule cadence cannot increase automatic AI frequency.
No queue/service, database schema, customer allowance, rule cooldown, lifecycle,
auth or provider contract changes. The setting is not client-controlled.

## DEC-049 — Bounded Browser offline retention configuration

GOAL-069 section 14 adds optional `retentionMs: { events?, feedback? }` to
BrowserSdkConfiguration, without changing the envelope/wire schema, IndexedDB
version, authentication, queue caps or retry protocol. Each supplied duration
must be a finite integer in milliseconds from 1000 to the existing maximum:
48 hours for events and 24 hours for feedback. Invalid values fail constructor
validation with a fixed ContractError; omission preserves existing defaults.
The constructor snapshots these two primitive settings so later caller mutation
cannot silently change queued-data policy. Diagnostic METRICS retain their
separate bounded 48-hour journal policy (DEC-044).

Retention is assigned at enqueue time and persists as the envelope's absolute
expiresAt. Retry, memory fallback and reload never renew it. A later configuration
applies to newly enqueued data, not a rewrite/extension of existing envelopes.
Existing expiry deletion, current-identity partition purge and server credential
validation remain authoritative; no credential or additional raw content is
stored. This additive configuration is independent of server retention policy.

## DEC-048 — Data-queue write failure isolation

GOAL-069 failure isolation also covers retry/ACK/expiry/context cleanup writes,
not only initial capture or IndexedDB open. Data writes/removals fall back to
the existing bounded MemoryQueue on storage failure, never reject consumer work
because retry bookkeeping itself failed. Failed retry writes keep the SAME
envelope ID, payload, original expiry and partition; only attempt/due metadata
changes. A generation/context check prevents copying old-scope data into a new
memory partition. Permanent denials stay terminal in the active memory queue.

The SDK never claims physical deletion when the browser refuses durable writes.
Old inaccessible IndexedDB rows may remain until a later reload/available store;
fresh SDK context synchronization still purges foreign partitions before replay,
and server credentials/ACK idempotency remain authoritative. Memory fallback is
not durable across page loss. Logout/switch cannot relabel or send another actor's
rows. No credential is persisted and no fallback storage channel is introduced.

Automatic diagnostic journal writes keep DEC-044's separate best-effort policy:
their failure does not switch the business data queue or recurse into ingestion.
No auth, event/provider/commercial contract, TTL, retry limit or queue cap changes.

## DEC-047 — Explicit-scope multi-product impact comparison

GOAL-069 section 43 adds read-only POST /operations/analytics/products, not a
global grant or a new data warehouse. The caller supplies 1–10 distinct
Applications, each with exactly one concrete environment and optional explicit
tenant. One row per Application prevents overlapping scopes/double counting.
Every scope is pre-authorized before querying; each scoped query revalidates
current grants and uses existing runtime RLS. Any denied/invalid scope rejects
the entire response, never a partial result or silent omission.

All targets use the same validated <=31-day received-at window and event filters.
Ranking is error-event count, with measured HTTP failures/rate and distinct
affected actors/tenants as separate metrics; it is neither a global product
quality score nor a causal diagnosis. Application/environment names come from
the authorized server registry, never client display labels. Results identify
the exact compared environment/tenant coverage, sorted deterministically.
At most ten sequential bounded existing-DB queries, no fan-out worker or AI call;
existing pool/statement timeouts apply, not a production latency guarantee.
The Console adds/removes explicit current selections inside Analytics; no new
navigation or implicit all-product scope. Existing theme/contracts remain intact.

## DEC-046 — Bounded operational analytics projection

GOAL-069 section 43 requires reports beyond overview/CSV. Add a read-only
`GET /operations/applications/{applicationId}/analytics`, using the existing
operational identity, current grants, explicit environment/tenant and RLS.
Existing endpoints and ingestion/provider/commercial contracts are unchanged.
Reuse validated event filters and the 31-day maximum. Reject status/pagination
for this aggregate projection rather than silently ignoring them. Report tables
return at most 50 ranked groups or 750 hourly buckets and label that boundary.
Existing received-at/scope indexes and database statement timeout remain in use;
no warehouse, materialized migration or unbounded cross-tenant query is added.

Event-derived reports use one filtered event cohort. Issue recurrence counts
matching occurrences, not lifetime totals; reopen count is explicitly lifetime.
Incident reports use linked matching Issues, created/resolved dates in the window.
Unlinked Feedback is included only without severity/category/release filters;
its text search is on subject, not a fabricated technical link. Resolution
statistics exclude unresolved rows and negative intervals. Release deltas compare
measured HTTP operation failure rates in observed first-seen order, not causal
regression proof or the independent rule engine verdict. Unknown dimensions
remain null, never invented browser/device/version values.

This endpoint is one Application/environment. A one-row selected product report
must not be presented as the required multi-product ranking; cross-Application
comparison still needs separately authorized concrete scopes and acceptance.

## DEC-045 — Failure-isolated logical storage sampling

GOAL-069 keeps hourly exact logical-row snapshots, existing storage/RLS and API.
Sampling is best effort, not a physical disk monitor or a reason to stop leased
work. A single in-flight sampler per service rotates a constant-size last-attempted
App/environment cursor. Failed/locked scopes do not prevent later healthy scopes;
the next bounded selection wraps so a repeatedly failing first scope cannot
starve the remainder. Restart loses the cursor, not persisted hourly samples.

Each pass starts no further scope after a five-second work budget, uses a one-
second local SQL deadline and nonblocking advisory lock, and records only a fixed
failure diagnostic. Pool acquisition retains its separately bounded configured
timeout; five seconds is a cooperative work budget, not a hard process-level
timeout or query cancellation guarantee. No orphaned Promise.race DB work.
Host drain dispatches sampling without awaiting it; in-flight guard prevents
overlap and shutdown awaits outstanding sampling before closing its pool.
Timed-out scopes have no invented zero snapshot; a later pass may retry. No
commercial model, migration, identity, tenant boundary or API contract changes.

## DEC-044 — Automatic diagnostic reporting and durable Browser report replay

GOAL-069 SDK diagnostics reuse the existing authenticated metrics API. Browser
reports are journaled as a new METRICS envelope kind in the existing IndexedDB
object store (no schema/credential store migration). At most ten reports/16 KiB
are retained, separate from the 500-event/2-MiB budget. A journaled report has an
immutable UUID/body until ACK or bounded expiry/exhaustion; subsequent deltas
use another UUID. Counter increments before journaling and memory fallback are
best effort, explicitly not an exactly-once loss ledger. Metadata failures never
become event failures or recursively increase event-drop counters.

Reports inherit original App/environment/actor/tenant partition, never contain
credentials, expire at 48 hours and retry at most twelve times. Credential
refresh can replay the same report. Initial session synchronization removes
foreign partitions; context/logout cancels report requests and clears old data.
Node reports are bounded process-level memory deltas, not attributed to the last
async request. Both SDKs send at most six reports per minute and tolerate old
servers lacking the endpoint without changing customer execution.

Optional expected-App/environment headers are assertions only, compared with
the credential's authoritative scope; they cannot select/override scope. SDKs
always send both, preventing misconfigured opaque Node credentials from placing
metrics in another App. Existing manual clients without assertions remain bound
to their credential. The public contract/CORS and both host adapters preserve
these assertions. The Persian self-health panel keeps measured/reported and
unobserved/null states distinct; it adds no new product shell or brand palette.

## DEC-043 — Scoped self-metrics with explicit measurement provenance

GOAL-069 adds bounded health reports and environment storage snapshots inside
the existing Hub schema, not business telemetry or commercial usage. Server
ingestion counters are SERVER_MEASURED; SDK drop/retry-delivery reports are
CLIENT_REPORTED or SERVER_SDK_REPORTED, never trusted Incident evidence. The
credential supplies App/environment/tenant/source; the body contains only an
idempotent UUID, UTC observation time and three bounded counters. No actor,
payload, URL, exception, credential or free-form tag is stored. Report hashes
bind idempotency to the verified scope/actor without storing the actor itself.

Report replay is accepted for 48 hours and receipts retained at least eight
days. Counter reports are immutable; bounded retention can delete old metrics,
never canonical Audit/AI accounting. The server buffers a bounded amount of
metrics during storage failure, logs a fixed diagnostic on failure/overflow and
never changes a committed event ACK because a metrics write failed. Buffered
metrics are best effort across process loss; missing measurements are not zero
proof. Public readiness is not the authenticated self-metrics endpoint.

Environment-wide ADMIN alone reads the full health projection. Tenant-bound
grants cannot infer other tenants' queue/storage metrics. SQL scope/FKs and
current grants remain mandatory. Storage growth measures logical persisted rows
of explicitly enumerated environment-scoped Hub tables, not OS free space,
indexes, global registry or shared databases. Hourly snapshots make the interval
and nullable initial growth explicit. An actual retry ACK, not navigator.onLine,
counts as SDK recovery; retries discarded/expired after an attempt are failures.
Logout/context changes discard old-scope metrics, never relabel them.

These contracts support the full section-51 metric set. Source collection,
authenticated UI and real recovery/drop acceptance must all execute before full
self-monitoring completion is claimed. External probes/logs remain complementary.

## DEC-042 — Trusted critical events and out-of-band pipeline diagnostics

GOAL-069's required critical/pipeline alerts extend the existing engine and
PostgreSQL queue, not a parallel monitoring service. Migration 071 adds the
`CRITICAL_EVENT` rule code/one-event default without overwriting nine existing
rule configurations. OpenAPI gains that additive enum value and a ten-rule
maximum. A trusted SERVER/WORKER CRITICAL event qualifies; Browser severity is
still capped at ERROR and ordinary 4xx does not create an Issue/Incident. A 5xx
must not downgrade trusted CRITICAL to ERROR. Existing Incident cooldown,
dedupe and human lifecycle apply; no AI action mutates Incidents.

A bounded repair sweep observes only terminal FAILED aggregation, rule,
delivery and retention jobs from the last 24 hours. One warning per App/env/
tenant/kind/15-minute failure window is persisted, using fixed titles, no raw
failure text. Concurrent runs dedupe; ordinary pending retries do not alert.
Failed delivery of a pipeline warning is excluded to prevent recursive storms.
The host runs detection/enqueue before rule evaluation so a rule failure does
not hide already-terminal pipeline failures.

Storage/host failure cannot be solved by an inbox on that same storage/host.
A fixed-field structured-log reporter is independent of ingestion, bounds each
code to once per minute/process and swallows sink failure. Public health and
readiness retain their existing narrow contract; an independent HTTPS probe
and runbook complement them. This does not install Staging monitoring, expose
tenant metrics publicly, or complete the full required self-metrics deliverable.

## DEC-041 — Durable bounded alert fan-out and backpressure

GOAL-069 keeps the existing PostgreSQL inbox/queue boundary. Each delivery
transaction addresses at most 100 currently authorized active principals in UUID
order. Persisted cursor, inbox rows, continuation and lease completion commit
atomically; duplicate execution cannot create a second recipient copy. Successful
legacy jobs are marked complete by migration 070, not replayed to new recipients.
Grants are evaluated afresh per page; new principals behind the cursor do not
receive historical alerts. Revocation still denies inbox access immediately.

New alert starts are scheduled at least 15 seconds apart per Application and
environment under the retention/delivery advisory lock. No alert is discarded;
continuation pages are immediate. This is durable backpressure, not a promise
of instant critical delivery or a complete flood/health solution. Backlog remains
visible through existing queue status. Retention protects pending page jobs.

BUG/USAGE_PROBLEM feedback becomes important only after an authorized human
TRIAGED/IN_PROGRESS decision. One alert per feedback uses the locked persisted
scope and sanitized subject, never a client severity claim. Explicit tenant
matching precedes replies/Audit and the narrow worker-role alert insertion.
No business notifications, API shape, AI accounting or customer allowance changes.

## DEC-040 — Bounded operational retention and evidence preservation

GOAL-069 implements the already-approved per-Application retention policy in
the existing PostgreSQL queue, not a business-data purge service. Default raw,
aggregate, terminal Incident and closed Feedback windows remain 30/365/180/180
days. Application-wide ADMIN configures policy with a sanitized reason/Audit;
an environment-only administrator cannot shorten all-Application history.

Each hourly environment job processes at most 100 rows per category (hard cap
1,000), under the persisted lease and environment advisory lock. Parent locks
serialize human replies/reopen with bounded child/history deletion. Recent
activity, active incidents/feedback and pending aggregation are protected.
When a category reaches its bound, a uniquely keyed continuation drains later
batches. Policy update and batch execution share an Application policy lock.
The job scope/kind/dedupe must match the persisted leased row, not just its ID.

Ingestion receipts stay at least eight days and as long as the raw event exists:
the ingestion contract rejects events older than seven days, so deletion cannot
turn an eligible replay into new business effects. Alert delivery and retention
share environment locking; an alert is rechecked after locking before enqueue.
All deletes, maintenance counts, automation-attributed Audit and completion
commit atomically; Audit failure rolls them back. No worker delete permission is
added for canonical Audit, issue/human activity history or operational AI usage.
AI accounting and evidence findings remain separate from raw-source retention;
missing expired raw references must never be represented as available evidence.
No customer/ticket/tenant table is queried or deleted by the generic service.

Maintenance status is explicitly only queue/retention coverage, not full Hub
self-monitoring or Staging monitoring acceptance. The remaining self-health,
ingestion/drop/recovery/storage metrics and external monitoring remain required
within this same Goal; a green maintenance panel cannot stand in for them.

## DEC-039 — Explicit reversible workspace administration

The owner's 2026-10-17 request extends Platform administration to both personal
and organizational workspaces. The existing Organization archive endpoints
remain organization-only. New explicit workspace endpoints reuse the same
suspend-before-archive, exact slug, reason, idempotency, Audit and retained-data
boundary for Personal workspaces; they do not delete the owner identity or
shared user records. Restoration returns to suspended, never active. No
physical cascade purge, tenant cross-access or automatic recreation/reactivation
of an archived Personal workspace is introduced. Archived entries are hidden
from the default administration list but remain discoverable by archive filter.
The local cleanup keeps `jupiter-demo`, uses supported service transitions and
leaves both target hosts and co-hosted applications untouched.

## DEC-038 — Reusable Observability Hub (GOAL-069)

**Decision:** Hub contracts, core, SDKs, storage/queue, identity, AI and alert
ports are product-independent packages. Jupiter connects only through adapters.
Initially Hub is hosted by the existing API/worker and PostgreSQL, with its own
schema and durable queue. Redis/BullMQ is not a prerequisite: current executable
workers poll PostgreSQL. A standalone host must use the same packages/contracts.

**Authorization:** Application/environment/tenant scopes and generic principals
are enforced independently of Jupiter membership. Jupiter Platform Admin maps
only to the Jupiter Application. Explicit operational grants control other
Applications. HUB_SUPER_ADMIN is granted by audited, idempotent bootstrap or
secure role management, never inferred from Platform Admin. Local acceptance
bootstraps the existing administrator through a parameterized command; no
account identifier is hard-coded. The last active super-admin cannot be revoked
without an atomic replacement. Application creation requires registry-create.

**Durability/privacy:** Ingestion ACK follows an atomic event/receipt/outbox
commit; delivery is at least once with idempotent persistence. Browser storage
is bounded IndexedDB partitioned by application/environment/actor/tenant and
contains no credentials. Logout clears the previous identity; switching scope
never relabels queued payloads. API failure remains independent of business work.

**AI:** Investigator has an independent provider contract, operational budget
and encrypted credentials. Per-Application AI is initially disabled. Explicit
activation enables scheduled/event-driven read-only analysis. Every provider
attempt reserves an atomic token bound; unknown timeout usage stays reserved
until reconciliation. Customer Commercial and Personal allowances are untouched.
Technical feedback may be externally analyzed after targeted redaction and a
short notice, without a separate consent checkbox. Administrators can disable
external processing per Application. Attachments and private ticket content
are not evidence sources. Outputs must cite authorized persisted evidence.

**Delivery:** GOAL-069 supersedes the stale GOAL-060 identifier in the supplied
specification. Historical Personal Service Goals remain intact. This execution
is local development/acceptance; GOAL-059 remains BLOCKED and no next Goal or
host publication is implied.

## DEC-037 — Verified adapter-based payment and idempotent fulfillment

**Decision:** Online payment uses an internal provider adapter. Zarinpal is the
first implementation; Jupiter snapshots package, units, validity and Toman
amount, sends currency `IRT`, verifies callbacks server-side, and fulfills at
most once. Provider credentials remain environment-managed. The product issues
a receipt; refund is performed externally and recorded manually.

**Reason:** Provider isolation and immutable snapshots prevent catalog drift,
duplicate callbacks and a future gateway change from corrupting capacity.

## DEC-036 — Separate configurable personal support and AI capacity

**Decision:** Personal support and AI use separate monthly pools and packages.
Initial monthly defaults are 3 support cases and 10 Smart Actions, UTC calendar
month, no rollover. New purchased packages default to 365 days, with bounded
validity configurable per package. Platform Admin can manage future defaults,
explicit personal-workspace overrides, availability and package catalog; issued
history and security rules are immutable.

**Reason:** The two services have different cost and fulfillment semantics, so
a shared balance would obscure pricing and operational liability.

## DEC-035 — Personal support is distinct from organization Assist

**Decision:** Personal Support owns a separate case/reservation lifecycle but
reuses the platform Jupiter-agent registry and ticket-scoped support-grant
mechanism. Submission reserves monthly then purchased capacity; agent acceptance
settles exactly once. Agents never gain tenant membership.

**Reason:** Organization Assist depends on owner policy and commercial agreement,
whereas personal support is the core fulfillment path for a private customer.

## DEC-034 — Personal workspace preserves the Organization tenant boundary

**Decision:** A personal workspace is an `Organization` tenant with explicit
`PERSONAL` type, one unique verified owner and one active `REQUESTER`
membership. It uses canonical `/personal`; `/o/{slug}` stays organizational.
Provisioning is idempotent after verification and coexists with organization
memberships and applications.

**Reason:** Reusing the proven required `organization_id`, composite integrity
and RLS boundary is safer than introducing nullable tenant ownership or a
parallel ticket model. Organization-only features remain hidden and forbidden.

## DEC-033 — Governed inherited Custom Primary

Jupiter's built-in Light Theme primary is Lavender `#796E89`; warm Beige
`#D8C3A6` is a supporting, non-text surface token. Appearance stores only a
nullable, canonical `#RRGGBB` custom primary at Platform and Organization
scope; it never stores CSS, semantic colors or inherited copies. Resolution is
System → Platform → Organization. Reset Primary intentionally clears only the
local `custom_primary` and preserves preset, density, radius and logo. A
centralized server validator selects white or the approved dark foreground
deterministically by WCAG contrast and rejects values for which neither is
safe. The derived primary-text token may darken rendering on a light surface
but never mutates the saved primary value. The personal light/dark preference
is intentionally local UI state, not a persisted commercial or tenant setting.

## DEC-031 — Recurring shared Smart Action allowance

Commercial billing remains based on delivered Smart Actions, not tokens. The two current AI actions share one organization pool with a Platform-configurable default of 25 units per UTC calendar month and 3 bounded emergency units. Allowances never roll over; Periodic capacity precedes active Add-on, then Emergency, enabled per-capability Overage and denial. Add-ons default to a 12-month expiry unless Platform records an explicit agreement-derived expiry. AI exhaustion never restricts manual ticketing.

## DEC-032 — Package-backed Jupiter Assist capacity

Jupiter Assist capacity is a tenant-scoped, immutable-ledger commercial resource, separate from AI Smart Action allowance and Support Access Grants. A unit is settled only when a permitted agent accepts a queued Assist case in the same transaction; request, approval, queue and assignment attempts do not consume it. Valid included packages consume first by nearest expiry, then promotional/manual/legacy credits, then purchased packages, with stable created-at/id tie-breakers. Legacy policy capacity is migrated to open-ended `LEGACY_MIGRATED` credit so existing service is not lost; the former policy field is read-model compatibility only. New packages require a validity period, and expiry/suspension blocks only new acceptance—not already accepted case work.

## DEC-001 — TypeScript modular monolith

Approved plan: NestJS backend and React/Vite frontend. This keeps one primary
language while retaining explicit modules; FastAPI and microservices are not
chosen for MVP.

## DEC-002 — Central shared-schema SaaS tenancy

Use `organization_id`, server-side scoping, composite constraints, and RLS.
Schema-per-tenant and database-per-tenant add unnecessary MVP operations cost.

## DEC-003 — AI gateway and platform-controlled credentials

AI is asynchronous, replaceable, validated, and controlled by Platform Admin;
ticketing never calls a provider directly.

## DEC-004 — REST plus SSE

REST handles commands and reads; SSE supplies realtime notifications. WebSocket
is deferred because bidirectional persistent transport is not required in MVP.

## DEC-005 — Fixed ticket semantics

Organizations configure labels and closure policy but not arbitrary workflow.
This preserves reporting and authorization invariants.

## DEC-006 — Compile before running the NestJS development server

The API development command runs the TypeScript build and then Node on the
compiled output. This preserves NestJS decorator metadata required for
dependency injection; direct `tsx` execution was rejected after it produced
a runtime 500 response from the health controller.

## DEC-007 — Per-organization OpenAI-compatible credentials

Each organization owns one credential plus independent analysis and transcription
model identifiers. Platform Admin is the only role allowed to change this
configuration. Credentials are encrypted with AES-256-GCM using the deployment
secret `AI_CREDENTIAL_ENCRYPTION_KEY`; the database stores ciphertext, a unique
96-bit IV, and authentication tag, while API responses expose only `hasApiKey`.

The provider base URL is HTTPS-only in production and restricted by
`AI_PROVIDER_ALLOWED_HOSTS`. Loopback HTTP is accepted only outside production
to support deterministic provider fakes. `OPENAI_API_KEY` is a one-time local
migration source and is never read by the request path. Credential replacement
and removal are explicit audited actions, but audit metadata contains only
boolean change indicators and never credential material.

## DEC-008 — Pre-ticket intake session as a temporary aggregate

Text/voice AI runs against a tenant- and owner-scoped `TicketIntakeSession`
before a ticket exists. This preserves the fixed ticket lifecycle and prevents
provider latency or failure from creating incomplete ticket records. The
session owns temporary voice metadata, transcript, versioned suggestions,
per-field confidence, retry state, a five-minute processing lease, and a
24-hour expiry. The original typed description is immutable; a transcript is
appended to a separate combined description.

Only metadata-verified objects (MIME, size and signed duration metadata) can be
transcribed or attached. Valid suggestions require tenant catalog membership
and confidence of at least 0.75. Final draft creation, intake provenance,
attachment conversion and session consumption share one PostgreSQL transaction;
the already tenant-scoped object becomes persistent without copying. Unconsumed
expired objects are deleted by the worker. The additive REST contract is
documented in `docs/TICKET_INTAKE_API.md`.

## DEC-009 — Platform-admin AI connection diagnosis

Platform administrators may run a short, organization-scoped connection test
after saving AI settings. It uses the encrypted stored credential and the
configured analysis model to call Chat Completions with a fixed non-sensitive
prompt. The response exposes only a safe diagnostic category and Persian
operator guidance; credentials, provider response bodies and request content
are never returned, logged or audited. Each test is audited using only its
success flag and category. This endpoint is diagnostic only and cannot create
or modify a ticket, intake session or provider configuration.

## DEC-010 — Governed title and typed-tag intake contract

`ticket-intake.v2` extends pre-ticket analysis with a tenant title library and
typed ticket tags. The provider receives only active tenant values. It may
reuse their IDs or propose concise new values, but cannot activate vocabulary.
Only final explicit draft submission records a new candidate; Organization
Admin approval is required before reuse. Existing flat tags remain active
`OTHER` tags for compatibility. The lifecycle, original description and 0.75
confidence threshold are unchanged.

## DEC-011 — Multimodal guided ticket-intake conversation

`ticket-intake.v3` retains each requester text or voice contribution as an
ordered, tenant- and owner-scoped intake message. Voice transcripts and raw
typed text are immutable source evidence; neither the model nor the UI silently
rewrites them. The model returns a separate structured interpretation, primary
issue, optional secondary issues and one optional concise clarification question.
It may only ask when ambiguity materially affects classification. A requester
can always submit the primary ticket without answering; secondary-ticket
creation is a non-blocking explicit action and never occurs by default. All
verified voice messages transfer to the final ticket as attachments. This
extends DEC-008 without changing ticket lifecycle, credential policy, tenant
isolation, the 0.75 assignment gate or the 24-hour intake expiry.

## DEC-012 — Confirmed secondary-ticket batch creation

`ticket-intake.v4` may return up to two server-validated, privacy-preserving
secondary ticket proposals. They are never created by AI or selected by
default. A requester explicitly selects proposals and confirms a single batch
submission with the primary ticket. The tenant- and owner-scoped intake is
locked and consumed in the same transaction as every ticket; proposal IDs are
server-generated and client payloads cannot alter their ticket content. Voice,
files, raw messages and transcripts remain attached only to the primary ticket.

## DEC-013 — Reviewable low-confidence secondary proposals

`ticket-intake.v5` preserves the `0.75` confidence threshold for automatically
applying primary ticket fields, but separates it from a requester's explicit
choice to create a secondary ticket. A secondary proposal is selectable when
the server has independently validated its title, standalone description,
priority and any supplied tenant taxonomy values. A lower confidence score
marks it as requiring review; it never silently creates a ticket and is
repeated in the final confirmation. Incomplete or taxonomy-invalid proposals
remain unavailable. The API accepts only the server-issued proposal ID, locks
the owner-scoped intake and creates all selected tickets atomically.

When a requester needs to clarify a proposal, the client records a new text or
voice message rather than editing historical source evidence, then re-runs the
same conversation analysis. This invalidates prior proposal selections because
their server IDs and interpretation are no longer current.

## DEC-014 — Preserve the established primary issue during clarification

`ticket-intake.v6` carries the prior server-generated primary issue back into a
follow-up analysis. The first distinct requester issue remains primary while a
later clarification enriches a secondary proposal; only an explicit requester
correction or replacement can change it. Adding a message clears stale
secondary suggestions but preserves this anchor until the next analysis writes
the refreshed interpretation.

## DEC-015 — Organization-controlled Smart Intake policy

Provider credentials, Base URL and model selection remain Platform Admin-only
configuration. `smart_intake_enabled` is a distinct tenant-scoped policy that
an Organization Admin may toggle only when platform AI is enabled and has an
encrypted API key plus a valid analysis model. The requester-visible capability
contains only the effective boolean; it never exposes credentials or provider
configuration. Smart Intake gates only pre-ticket transcription and analysis:
manual text, file and verified voice attachment flows remain usable, and the
legacy ticket AI gateway remains governed by the platform AI setting.

## DEC-016 — Requester cancellation destroys an unsubmitted intake

A requester may explicitly cancel only their own unconsumed `TicketIntakeSession`.
The cancellation command locks the tenant- and owner-scoped session, removes all
temporary session and conversation voice objects, marks pending processing
outbox events complete, deletes the session and its cascading raw messages and
AI result, then writes an audit record containing only counts and no request
content. It cannot cancel or alter a ticket after final submission: a consumed
session is rejected. Keeping the cancellation destructive avoids retaining a
temporary conversation as an accidental ticket-history record.

## DEC-017 — Organization administration uses a route-addressable workspace

Organization Administration is organized as a presentational workspace with
grouped section navigation and one route per existing management capability:
members, catalog, vocabulary, teams, SLA/assignment, request/appearance
settings, and custom fields/email. This replaces the local in-page tab state
so deep links and browser back/forward preserve the selected section.

The change is frontend-only: the same panels, API requests, permissions,
tenant context and business rules remain in place. Desktop uses grouped
vertical navigation; mobile uses a compact labelled selector rather than a
horizontal tab strip. Future commercial or directory features have no
placeholder entry until a separately approved capability exists.

## DEC-018 — Additive identity evolution for public and directory users

The current global `User` and tenant `Membership` model remains the canonical
person and access foundation. It is not replaced. GOAL-030 compared: extending
only the existing `users` columns; staging directory records without users; and
an additive identity model. The selected model retains legacy user email,
username, password and refresh-session behavior during a staged transition,
then adds only the needed authentication-identity and tenant-scoped
directory-principal records.

This is selected because a `users`-only change cannot cleanly represent a
directory-managed person without email, a person linked to more than one
directory tenant, and an organization-scoped login while preserving the
existing global login contract. A staging-only model would duplicate
membership/provisioning logic and defer a required activation state. Directory
records never carry AD passwords. A directory-provisioned member is linked to
a global user only when an authenticated Jupiter account is ready; until then
it is explicitly not-ready for login. GOAL-031 must provide an additive,
data-preserving migration and compatibility tests before legacy credential
fields can become optional or deprecated.

## DEC-019 — Verified public account before organization application submit

Public account creation is allowed before a tenant membership exists. A public
account must complete email verification before its organization application
can transition from `DRAFT` to `SUBMITTED`. This reduces abuse and supplies a
recoverable contact for platform review without treating email verification as
organization approval.

Verification delivery is an audited, rate-limited notification abstraction.
Production delivery uses deployment configuration; local development uses an
explicit test-only sink. Tokens are short-lived, single-use, stored only as
hashes, and never returned by normal APIs or audit logs. Platform review may
still request further information or reject an application after verification.

## DEC-020 — Organization application and tenant lifecycle contracts

Organization application statuses are exactly `DRAFT`, `SUBMITTED`,
`UNDER_REVIEW`, `NEEDS_INFORMATION`, `APPROVED`, `REJECTED`, and `CANCELLED`.
They are separate from tenant lifecycle. Tenant lifecycle is `SETUP`, `ACTIVE`,
and `SUSPENDED`; existing active/suspended organizations retain their behavior
through a data-preserving compatibility migration.

Approval is audited and distinct from idempotent tenant provisioning. New
tenants enter `SETUP`, receive an approved slug and an initial owner, and reach
`ACTIVE` after the required setup gate. Existing tenants are never moved to
`SETUP` merely because they predate the model.

## DEC-021 — Explicit legacy-owner transition

`ORG_OWNER` is a new role for organization ownership, commercial authority and
owner-only controls. Existing organizations continue operating when no owner is
assigned; existing `ORG_ADMIN` permissions remain unchanged. No existing
administrator is automatically promoted.

Platform Admin explicitly assigns an eligible existing member or invites a new
owner, records the action in audit, and may replace that assignment later.
Owner-only commercial actions remain unavailable while an organization has no
owner. Newly provisioned organizations receive the approved applicant as their
initial owner. A future bulk-promotion policy needs its own approved migration
decision.

## DEC-022 — Slug-based tenant routes with conservative legacy compatibility

`/o/{slug}` is the canonical organization workspace route. The server resolves
the slug to tenant context and independently verifies membership. Legacy routes
redirect only when the authenticated user's target organization is
unambiguous—one active membership or an explicit persisted default. Zero or
multiple possible tenants require selection; no route guesses a tenant.

Platform administration remains outside organization route context. Old routes
remain supported during a measured compatibility period and are removed only by
a separately approved deprecation decision.

## DEC-023 — Connector security invariants and implementation validation gate

The directory connector is an on-premises Windows service with outbound HTTPS
only. The cloud never stores AD credentials. Pairing is organization-bound,
single-use and short-lived; a paired device identity is independently rotatable
and revocable. Connector requests must resist replay and tenant impersonation.

TypeScript/Node plus WinSW, a Windows-native worker, DPAPI, Credential Manager,
request signing, mTLS and short-lived device tokens are implementation
candidates—not master requirements. GOAL-036 records a technology validation
matrix covering service lifecycle, secure local storage, installation/update,
rotation, observability and support burden before GOAL-037 adopts a concrete
runtime protocol. The current validation matrix is
`docs/DIRECTORY_CONNECTOR_VALIDATION.md`; it deliberately selects no Windows
runtime, secure-store or request-proof candidate yet.

## DEC-028 — Directory Connector V1 runtime and replay proof

GOAL-037 selects the Windows PowerShell ActiveDirectory module hosted by WinSW
for V1, because it is available on supported customer domain hosts and gives a
recoverable service lifecycle with Windows Event Log observability. DPAPI under
the service account protects local configuration. The cloud accepts no AD bind
credential; the selected OU/group scope and all LDAP access remain local.

The paired device credential is opaque and hashed server-side, then rotates
after every accepted heartbeat, preview and apply request. The old credential
cannot replay a request, and revocation clears the usable hash immediately.
Directory payload roles may only grant REQUESTER, EXPERT or SUPERVISOR;
ORG_ADMIN and ORG_OWNER are never directory-managed.

## DEC-024 — Minimal commercial capability model

The first commercial model contains only Product, Subscription, Entitlement,
Usage Allowance, Usage Ledger, Add-on Package, Organization Commercial
Agreement, Platform Availability and Organization Feature Setting. Price and
agreement data are platform-managed and auditable; a payment gateway is not
required.

An API must calculate `effective` capability as entitlement AND organization
setting AND platform availability. UI hiding never substitutes for this server
check. Product versioning, invoices and a broad accounting model are deferred
until a concrete requirement requires them.

## DEC-025 — Commercial Smart Action settlement, not provider-call billing

A provider invocation, retry, diagnostic, connection test, health check,
embedding or other infrastructure operation does not consume customer
allowance. A billable AI unit is settled once, using an idempotency key, only
after a permitted commercial Smart Action produces valid output that the
application persists and successfully makes available to its authorized user.

Allowance reservation protects concurrent consumption; unsuccessful or
undelivered actions release their reservation. The shared organization pool
consumes periodic allowance, then purchased packs, then emergency allowance,
then permitted overage, and finally stops the Smart Action while leaving manual
ticketing available. Provider token/cost telemetry remains operational data,
not a customer-priced unit.

## DEC-026 — Delegated Jupiter Assist access is grant-scoped

Jupiter support agents do not receive ordinary tenant memberships. A separate
Support Access Grant is scoped, time-bound, revocable and audited. Assist
request state and SLA are independent of fixed ticket lifecycle. A restricted
ticket remains hidden unless a matching explicit grant permits it, including
when an organization has selected broad support scope.

An Assist unit settles only when a Jupiter agent accepts a permitted case;
routing, request, reassignment and reopening do not create additional units.

## DEC-027 — Product Help is separate from tenant knowledge

Jupiter's product Help is a platform-owned, versioned domain, distinct from
tenant knowledge articles. Repository content under `docs/help/` is a seed for
initial publication only; published runtime revisions in the database are the
source of truth. Help content has audience, route, feature, product-area and
tag metadata for authorization, contextual help and future RAG readiness.

Draft and unpublished content must never be returned to an unauthorized
audience. The existing `HelpTrigger` is the compact UI entry point; product help
does not alter tenant knowledge ownership or review semantics.

## DEC-029 — Controlled, preset-only platform appearance

GOAL-045 persists one platform-owned appearance record rather than allowing
free-form tenant themes. A Platform Admin may select only an approved primary
brand preset, density preset, radius preset and an internal managed logo path.
The selected palettes meet the application's primary-action contrast target;
semantic success, warning and danger colors are not configurable. Arbitrary
CSS, JavaScript and external logo URLs are rejected.

The precedence order is platform defaults, then an organization's approved
logo identity, then page content. Organization branding cannot change platform
tokens, layout density, radius, security-sensitive controls or semantic state.
The platform default logo is also the favicon where the current architecture
supports it. Changes are platform-admin-only and auditable; the public read
model contains no secret or tenant data.

## DEC-030 — Commercial lifecycle degrades paid capabilities, not ticketing

Subscription state is evaluated server-side as part of commercial capability
resolution. `PAST_DUE` retains paid capability only until the organization
agreement's configured grace end; `SUSPENDED`, `CANCELLED` and `EXPIRED` deny
new commercial Smart Actions and new Jupiter Assist acceptance. Ticket
creation, ticket history and already accepted Assist cases remain available,
so commercial administration cannot make an organization lose its support
record or core operating workflow.

## DEC-032 — Directory snapshot scheduling and absence safety

GOAL-054 uses a connector-provided `INCREMENTAL_SNAPSHOT` every fifteen minutes,
not fabricated AD change tracking. A complete FULL reconciliation is scheduled
at least daily and is the sole basis for absence lifecycle. Under selected
OU/group scope, absence becomes OUT_OF_SCOPE with a seven-day grace. Under
Entire Directory, absence in a successful FULL snapshot suspends the principal;
no Directory user is hard-deleted.

Connector health is a derived last-seen projection. The worker stores a health
transition only when the derived state changes and notifies owner/admin users
only for DEGRADED or OFFLINE transitions. This prevents periodic write/notice
noise while allowing another offline notice after a verified recovery.

## DEC-033 — Minimal, server-derived organization Go-Live gate

Organization setup progress is a versioned tenant-scoped read model and never
substitutes for actual operational configuration. The V1 Go-Live evaluator has
only five hard conditions: organization lifecycle `SETUP`, an active
`ORG_OWNER`, valid organization display name, valid timezone and at least one
Ticket Category. SLA, teams, departments, extra users, Directory, AI, Assist
and appearance remain optional and become warnings only.

`ORG_OWNER` receives organization-operational authority through the central
organization access policy, while only that role may skip an optional setup
step or activate the tenant. Contact responsibility is represented by active
ownership; no free-text `contact_name` is duplicated. Optional contact phone
metadata is non-blocking. After activation no `ACTIVE → SETUP` rollback exists.

The one canonical lifecycle implementation is `OrganizationSetupService.goLive`.
The legacy tenant-setup completion route is retained only as a compatibility
delegate, so it shares authorization, readiness, locking, idempotency and the
single successful activation audit. Readiness rejection is transactional and
does not claim a durable rejected-audit event. Platform status controls may
never change `SETUP` directly to `ACTIVE`; they cannot bypass Go-Live.

## DEC-034 — Deployment-owned SMTP for verification delivery

The public-account verification abstraction supports direct SMTP in addition
to the existing HTTPS webhook. This is an adapter choice, not a new product or
service boundary: account creation, hashed single-use tokens, 24-hour expiry,
resend throttling, audit and verified-account provisioning remain unchanged.

SMTP connection and sender settings are deployment-owned environment values.
Credentials are optional only for a loopback-restricted local MTA and are never
stored in the repository, database, delivery records, audit metadata or logs.
The application supplies the Persian text/HTML message and canonical HTTPS
verification URL; the MTA owns queueing, retry and DKIM signing. A local MTA
must listen only on loopback and permit relay only from loopback. Public sender
identity must align SPF, DKIM and DMARC. `DISABLED` remains the safe fallback,
and `LOCAL_TEST` remains unavailable in production. The SMTP adapter may ignore
STARTTLS only when its host is exactly loopback; every network relay must use a
valid TLS path.

## DEC-035 — Organization deletion is reversible archival

Platform Admin «حذف سازمان» is a lifecycle transition, not a physical cascade.
An organization must already be `SUSPENDED`; the actor must type the exact slug,
provide a 10–500 character reason, acknowledge the access impact and submit an
idempotency key. Personal workspaces are excluded. The transition changes the
organization to `ARCHIVED`, denies tenant access immediately and preserves all
tickets, memberships, commercial history and audit evidence.

Recovery is a separate Platform Admin-only transition requiring the exact slug,
a reason and a fresh idempotency key. It returns the tenant to `SUSPENDED`, never
directly to `ACTIVE`, so service restoration remains an explicit second action.
Both transitions have immutable history plus actor-bearing audit records. A
future physical purge requires a separate retention/export/legal design and is
not implied by archival.
