# System Architecture

DEC-062 extends the existing operational Investigator (migration073, no new
service/operation/provider contract) with optional per-App UTC-month attempt/
estimated-USD-cost ceilings. Existing advisory lock covers all environments and
tenants atomically. Rates/reserved costs are immutable attempt snapshots, not a
commercial pricing model; known settlement/reconciliation uses that snapshot.
Scoped reports expose only known estimated sums plus unpriced counts. Optional
policy null defaults preserve existing providers and mandatory token budgets.

DEC-061 opts into fixed related-Issue context on the existing Event list. Default
contract stays; one bounded link batch after authorized page fetch under current
grants/RLS and composite tenant identity. No N+1/entity/migration/new operation.
Reusable Live table and detail-safe timer do not alter collection/business work.

DEC-060 adds seed-bound Event correlation to existing OperationsService/HTTP
and reusable Console. Current RLS-readable seed precedes exact App/env/tenant
identifier match; no new entity, tracing service, migration or provider work.
Bounded chronological fixed-field evidence is not a synthetic causal trace.

DEC-059 exposes existing Investigator configuration limits in the reusable
Console. Shared CommandContext owns save/analyze/reconciliation completions by
client/App/environment/tenant; server auth/budget/provider contracts unchanged.
No new endpoint/migration/service; Audit adds only validated non-secret limits.

DEC-058 refines existing Incident detail activity to newest100 with stable ID
tie-break and adds human_notes (newest100 NOTE_ADDED independently), under the
same tenant RLS/current grant. No migration/new entity/expanded result limit.

DEC-057 gives reusable Console a strict scoped Incident fragment route, separate
workspace and native reload/history support without taking over host routing.
Existing detail gains bounded timeline, narrow Audit/assignee/can_manage/allowed
transitions. Read exact Incident under runtime tenant RLS first; same transaction
temporarily enters existing control role for current-authorized fixed Audit/
principal projection, restores runtime in finally. No new DB grants/migration.

DEC-056 adds bounded Issue sort/group projections and retained affected releases
inside existing OperationsService/HTTP/OpenAPI and Console. No migration/service.
Grouped counts share the full authorized filtered SQL cohort, separate from
paginated rows. Release/category predicates correlate to one retained event.

DEC-055 adds supported access/integration credential commands and safe own-
identity projection to the existing generic Registry/HTTP/Console boundaries.
No migration, external identity creation or business import; host-owned mappings
remain distinct. Current whole-App grants authorize management; safe lists and
one-time secret responses are separate. All generic dispatch adapters now inherit
the no-store header rather than relying solely on Node handler policy.

DEC-054 keeps effective ingestion/sampling in the existing generic Registry and
IngestionService. The bounded Application policy JSON supplies a versioned source
allowlist/category basis points; public operations use the same verified generic
principal and whole-App grant boundary. No worker, cache, schema, provider or
commercial module is added. Existing accepted receipts precede new filtering;
new exclusions produce terminal non-persistence ACKs, not fake events. SDK-local
sampling and Feedback/diagnostic channels stay independent. Browser/Node SDKs
recognize explicit policy exclusions without misreporting loss/recovery.

DEC-051 adds scoped, coalesced recovery notifications to the Browser SDK and
optional current-scope wiring in Jupiter's existing fetch adapter. Notifications
schedule only the existing authenticated/due-time/ACK flush path; no probe
service, queue, network dependency or product import enters reusable packages.
Fetch observation never awaits recovery, retries a business request or turns
an observer error into a business error. Existing automatic triggers remain.

The existing generic React adapter isolates SDK startup/cleanup, route effects
and boundary reporting from consumer rendering. It keeps the same Browser SDK
dependency and synchronous start/returned-cleanup contract, adds no Jupiter
business import, and never awaits diagnostic reporting or recurses on its faults.

Jupiter's host fetch adapter separates diagnostic preparation/completion from
the sole business dispatch. Preparation failure forwards original arguments;
completion never retries or replaces a business outcome. Diagnostic promises
are not awaited and failures are consumed without recursive reporting. This
restores section-55 failure isolation within the existing adapter boundary.

DEC-048 isolates data-queue storage failures during retry, ACK, expiry and
identity cleanup using the existing bounded MemoryQueue. Generation/partition
guards prevent copying an obsolete envelope into a new identity. Diagnostic
journal writes retain their separate best-effort policy. No new persistence
channel, provider contract or schema is introduced; memory is not page-durable.

GOAL-069 DEC-046 adds a bounded read-only analytics projection to the existing
OperationsService/public HTTP contract and shared Console. It uses the same
current operational grants/RLS, parameterized 31-day event cohort and fixed SQL;
no business imports, warehouse, schema/provider/commercial changes. Ten report
tables are one Application/environment. DEC-047 adds read-only explicit-scope
comparison over 1–10 distinct Applications, one environment/optional tenant each,
with current grants and runtime RLS on every read. It has no global report role,
new worker, schema or commercial entity. Any target denial rejects the response;
the Console keeps selections inside Analytics and invalidates obsolete results.

## GOAL-069 Observability Hub (implementation in progress)

DEC-045 keeps logical sampling within the existing service/pool, but separates
its in-flight lifecycle from shared leased-job draining. A constant-size rotating
cursor and per-scope failure handling avoid first-scope starvation. No new worker,
queue, timer, tables or service is introduced; shutdown awaits pending sampling.
Cooperative work and statement budgets do not claim hard wall-time cancellation.

QueueWorker uses HubBinding's existing background-observation port for bounded
enumeration and per-job processing. Product services remain the authorities for
persisted retry/commercial outcomes; no new Hub dependency is added inside the
AI service. Persisted state can be read for diagnostics without changing its
return contract; failed diagnostic reads do not alter processing. The generic
Hub core still imports no product-domain model or service.

Observability is a reusable package boundary inside the initial modular host.
Contracts/core/SDKs depend on generic identity and telemetry only. Server
adapters own an independent `observability` PostgreSQL schema, Registry,
credential lifecycle, atomic event/receipt/outbox ingestion and leased jobs.
No foreign key or package import couples Hub to Jupiter business entities.
Jupiter integration belongs to its own host adapter. DEC-038 records the
approved extraction boundary and actual PostgreSQL queue choice; Redis/BullMQ
descriptions below are historical, not executable Worker dependencies today.

The current Jupiter adapter resolves identities/memberships server-side and
maps Platform Admin only to the configured Jupiter Application through a
managed grant, leaving manual grants distinct. `observability/console` accepts
a transport port, not Jupiter sessions; the host supplies authenticated fetch
and semantic theme tokens. Browser capture excludes Hub traffic and external
resource URLs to prevent recursion and signed-URL leakage. Control-plane
queries switch to the limited `observability_control` role; event/feedback
queries still switch to runtime RLS in the same authorization transaction.

## GOAL-060 Personal Service architecture

Personal service remains inside the modular monolith. A personal workspace is
an `Organization` tenant with an explicit `PERSONAL` workspace type and one
verified owner identity; it therefore keeps required `organization_id`,
composite tenant relations and PostgreSQL RLS. Its canonical client route is
`/personal`, while `/o/{slug}` remains reserved for organization workspaces.

The extension adds Personal Support and Payments application modules. Personal
Support owns its case/reservation lifecycle and reuses the global Jupiter agent
registry plus ticket-scoped, time-bound support grants; it does not reuse the
organization Assist commercial policy or grant organization membership to an
agent. Payments use a provider adapter, immutable order snapshots, server-side
verification and idempotent fulfillment. Zarinpal is the first adapter and
receives Toman as `IRT`; provider credentials remain environment-managed.

Platform configuration covers service availability, catalog/SLA, monthly
defaults, per-workspace overrides, package units/prices/validity and bounded
grant duration. Tenant isolation, verified account ownership, server-side
authorization, settlement/fulfillment idempotency, HTTPS callback validation
and secret handling are architecture invariants rather than settings.

GOAL-062 implements the Personal Support operational module before commercial
capacity. Its global catalog is Platform-owned; cases are tenant-scoped.
Acceptance uses the global Jupiter-agent registry, snapshots SLA/access
duration and issues one exact-ticket grant. The case/grant transaction never
creates a membership and organization Assist explicitly ignores Personal
Support grants. Capacity reservation and settlement are attached in GOAL-063.

GOAL-063 adds a `PersonalCapacityModule` inside the modular monolith. It owns
two explicit pools (`SUPPORT`, `AI`), immutable UTC monthly windows, future
policy/override resolution, package catalog/allocation snapshots and atomic
reservation state. Personal Support calls this application service inside the
same tenant transaction; organization Commercial and Assist remain separate.
Payment fulfillment will target the same allocation aggregate in GOAL-064.

## GOAL-057 Appearance runtime

The Appearance module remains inside the modular monolith. It owns canonical
hex validation and the effective appearance projection; the React token helper
applies only that projection as CSS variables. Tenant runtime loading is
membership-bound and cancellation-safe on tenant switch, while public and
Platform routes bootstrap the global projection to prevent stale tenant theme
state.

MVP is an API-first TypeScript modular monolith: React/Vite SPA behind Nginx;
NestJS API and worker processes; PostgreSQL; Redis/BullMQ; and S3-compatible
object storage. REST is versioned under `/api/v1`; SSE publishes server events.

Modules are Identity & Access, Organizations, Directory, Catalog, Ticketing,
Conversation, Attachments, Assignment, AI Gateway, Notifications, Audit,
Search/Reporting, and Platform Administration. Modules communicate through
application services and internal events, not direct cross-module persistence.

Tenant data uses a shared schema with required `organization_id`, composite
relations, application scoping, and PostgreSQL RLS as defense in depth.
Transactional outbox records asynchronous work. Docker Compose is for local
development; production uses the same versioned images with managed TLS,
secrets, backups, and monitoring.

## Approved Master Upgrade extension

GOAL-031 implements the Public Accounts and Organization Applications
foundation. The wider Master Upgrade adds Tenant Provisioning/Setup, Directory
Connector Control Plane, Commercial Core,
Capability Resolution, AI Commercial Metering, Jupiter Assist, Product Help,
and controlled Platform Appearance as modules inside the same modular monolith.
They communicate through application services and internal events; no new
microservice boundary is introduced.

Canonical organization workspaces will use `/o/{slug}` after GOAL-034. The
server remains responsible for resolving that slug and verifying membership;
the client cannot select a tenant by URL alone. Platform management remains
outside tenant routes. See DEC-018 through DEC-027 and
`UPGRADE_MASTER_PLAN.md` for staged delivery constraints.

GOAL-036 implements the Directory Connector Control Plane as a Nest module in
the monolith. It owns tenant-RLS connector and pairing records plus the safe
pairing exchange; it has no AD/LDAP client, no Windows runtime and no sync
worker. The future on-premises service initiates outbound HTTPS requests, so
the platform does not need an inbound customer-network connection.

GOAL-046 adds Product Help as a platform-owned module and global versioned
publication store. It is intentionally separate from tenant knowledge tables:
Help has no organization identifier or tenant RLS policy. Repository Markdown
under `docs/help/` is an idempotent initial-publication input only; current
published database revisions are the runtime source of truth. Read APIs filter
the published revision by the caller's derived audience before returning any
article metadata or content.

GOAL-047 adds Platform Admin authoring to the same module: every edit creates
a new runtime revision; publication changes the article's current published
pointer, while restore copies a prior revision into a new draft. Platform
exports select only current published runtime revisions. The React Help Center
uses the existing shell/navigation and compact `HelpTrigger` entry point;
feature mapping is metadata-driven and never reaches tenant knowledge.

## GOAL-054 Directory Connector operations

The Directory module remains in the monolith. The Windows Connector remains
outbound-only; the worker only queues tenant-scoped commands and derives health.
Heartbeats carry lightweight telemetry and a pending command reference, while
scope/mapping policy is fetched only after a policy-version change. The scheduled
mode is `INCREMENTAL_SNAPSHOT`, not fabricated AD delta tracking; only a complete
`FULL` reconciliation evaluates absence lifecycle. Full snapshots are submitted
in bounded batches, and the cloud evaluates absence only after every announced
batch has been received.
