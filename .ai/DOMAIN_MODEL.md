# Domain Model

## GOAL-070 additions (DEC-066)

User gains must_change_password=false and credential_version=0 through migration074;
these govern local password access without splitting existing identities. New
temporary passwords/resets set the flag; successful initial change clears it and
increments version. Password challenge is short-lived and not a persisted session.
SETUP provisioning reuses Organization, Membership, membership roles and Audit in
one transaction. No parallel owner/entity or tenant identity is introduced.
Organization gains optional legal_name descriptive metadata (migration074), not
a unique key. Existing tenants remain null; no bulk normalization or merge.

DEC-065 adds Issue detail observed_impact, a read-only retained-link cohort with
counts/users/tenants/Applications0–1, tenant-free/feature counts/list<=20 and UTC
first-last/span. basis=RETAINED_LINKED_EVENTS; no entity/migration/persisted counter
change. Existing lifetime occurrence/first-last and rule-time Incident snapshots
remain distinct. Whole retained cohort is not the100 displayed Event rows.

DEC-064 extends only the existing immutable-at-detection Incident impact JSON
snapshot: exact Issue/App/environment/tenant retained window counts, distinct
non-null tenants/tenant-free events, explicit string feature count/list<=20,
unknown-feature events and first/last occurrence/span. No new entity or migration;
legacy missing fields remain unknown. Observed span is not measured downtime.

DEC-061 LiveEventRow is an opt-in Event read projection with related_issue:null
or fixed Issue id/title/status/severity/lifetime occurrence_count/first-last.
No new entity/history and no denormalized counters. Legacy EventRow stays.

DEC-060 EventCorrelation is a read projection: exact seed/scope/kind/identifier,
available flag, occurrence window/page/total and<=100 sanitized Event rows with
existing span/operation/route/status/duration. No new stored span/trace entity or
inferred parent relationship. Missing identifier produces empty evidence.

DEC-059 exposes existing AiConfiguration limits; no new entity or schema.
INVESTIGATOR_CONFIGURATION_CHANGED Audit metadata additionally records effective
output/context/concurrency/review interval, never ciphertext or plaintext key.

DEC-058 adds human_notes:existing IncidentActivity NOTE_ADDED projection<=100,
independent from activity<=100. Both newest-first with ID tie-break; no new
aggregate or persistent note entity and no change to immutable write history.

DEC-057 adds no entity. Incident detail has timeline<=100 retained linked events,
audit_history<=100 fixed-action projections, exact assigned_operator(id/name/
active), current can_manage and allowed_transitions from existing lifecycle.
Existing rule-time impact, human activity and successful investigations remain
distinct records, never merged into an AI-generated state.

DEC-056 adds projections only: Issue page sort/groupBy plus <=5 enum buckets
(Issue count across the complete authorized filter); Issue detail affected_releases
has <=100 nullable version/count/first_seen/last_seen groups from retained links.
No lifecycle state or persisted grouping entity is introduced.

DEC-055 exposes the existing Principal/AccessGrant/Credential model, not a new
identity service. Manual access references an already verified active principal
and explicit App/optional environment/tenant; null tenant means all tenants,
not tenant-free-only. managed_by grants remain host-owned. Integration metadata
selects parentless mint-capable all-tenant SERVER keys only, excluding sessions.
Rotation creates a new hashed key and revokes the old row atomically with Audit;
revocation/history remain persistent. Current identity projection adds no grant.

DEC-054 uses Application.policy.ingestion (version 1) for enabled event sources
and complete per-category integer sampling basis points (0–10000). Absent legacy
member resolves to all sources/full rates; other policy members are preserved.
Excluded events have no Event/receipt/job. Existing accepted receipt keeps the
same digest/idempotency rules after a policy change. No new commercial entity.

DEC-053 manages existing Application name/description/origins/enabled and existing
Environment enabled state. UUID, slug and environment key/kind are fixed identity/
historical context, not rewritten evidence. Disabled is not deleted or revoked:
historical data/grants/credential revocation records persist. No new entity,
configuration secrets, commercial state or migration is introduced.

DEC-052 Overview panels are bounded read projections over existing scoped
Events/Issues/Investigations, not a new health/deployment or commercial entity.
Current critical-issue count is distinct from filtered-window impact. Observed
health cannot establish uptime; release timestamps are first/last observations
within the window. AI summaries are persisted findings, not new provider work.

DEC-047 product comparison is another scoped read projection over registered
Applications/Environments and Events, not commercial_products, a new Product
entity, global grant, stored selection or billing aggregate. Each row declares
its environment and tenant coverage. Opaque tenant/actor IDs in different Apps
remain independent; counts are never joined by those IDs across Applications.

GOAL-069 analytics (DEC-046) is a read projection, not a new aggregate/entity.
It derives scoped window occurrences, release operation rates, impact, resolved
durations and linked histories from existing Events/Issues/Incidents/Feedback.
Lifetime reopen counters and in-window occurrences are explicitly distinct;
no raw provider/customer payload or new commercial state is part of the report.

## Hub Product Help metadata (GOAL-069)

Eleven OBSERVABILITY_* feature codes and canonical /operations and /feedback
routes extend the existing Help registry. They map one-to-one to eleven stable
observability-* article slugs. Existing revision/publication entities and audience
model remain unchanged; no Hub entity or tenant record is embedded in Help.

## Automatic SDK diagnostic reports (GOAL-069, DEC-044)

Browser OfflineEnvelope adds METRICS in the existing IndexedDB object store.
Its fixed report payload is immutable through network retries; journal ACK
removes only that ID. Ten reports/16 KiB have a separate budget from user events.
Reports retain original partition and 48-hour expiry. Context/logout clears old
rows/deltas; Node deltas are process-level memory. No credential/file/raw payload
is added. The self-health projection describes scoped diagnostic coverage, not
overall service health or commercial consumption.

## Self-metric measurements (GOAL-069, DEC-043)

HealthReport is an immutable App/environment/optional-tenant scoped counter
delta with an idempotent UUID/hash and explicit SERVER_MEASURED, CLIENT_REPORTED
or SERVER_SDK_REPORTED provenance. It has no payload/actor/free-form metadata.
StorageSample is an hourly environment-scoped logical-row byte snapshot; growth
is nullable until two observations exist. These are not Issues, customer usage,
AI evidence or disk capacity. Reports survive at least eight days; snapshots use
the Application aggregate retention window. Worker-only bounded deletion does
not change canonical Audit or AI accounting. SDK buffers expose fixed deltas;
automatic transport/Console collection remains pending at this checkpoint.

## Critical/pipeline alert extension (GOAL-069, DEC-042)

MonitoringRule adds `CRITICAL_EVENT` to the existing nine codes. Existing settings
are preserved. Terminal durable job failures can create scoped window-deduped
Alerts without an Incident; those alerts use the same recipient inbox/delivery
pipeline and have a recursion guard. Fixed diagnostic log entries are not raw
telemetry, customer usage, or tenant business records.

## Bounded alert delivery (GOAL-069, DEC-041)

Alert delivery has a persisted UUID recipient cursor and completion timestamp.
Each at-most-100-recipient page shares a transaction with its continuation and
lease completion. Initial jobs are paced 15 seconds apart per Application/env;
no alert is dropped. Human triage of BUG/USAGE_PROBLEM feedback creates one
deduplicated operational alert, independent of customer ticket notifications.

## Operational retention (GOAL-069, DEC-040)

Existing Hub Application owns separate raw/aggregate/Incident/Feedback day
windows. An environment maintenance state holds last successful batch time and
safe category counts. Hourly RETENTION jobs and idempotent continuations use
the existing durable queue, not a new business scheduler. Old raw event removal
can expire source links while retained Issues/AI findings remain historical;
clients must not infer that an expired source is still fetchable. Canonical Audit
and immutable AI accounting have independent preservation and no purge here.

## Operational alert inbox (GOAL-069)

An Alert has a composite Application/environment/tenant identity. A durable
ALERT_DELIVERY job inserts one inbox row per authorized recipient principal;
the unique Alert/principal key prevents duplicate delivery. Each recipient owns
an optional read timestamp; read acknowledgement does not change the related
Incident lifecycle. Jupiter's NotificationService projects this inbox via an
account-scoped source port rather than creating a business-ticket notification.

## Operational Investigator (GOAL-069)

DEC-062 adds nullable monthly_request_limit/monthly_estimated_cost_micros and
paired explicit input/output per-million micro-USD rates to existing App config.
Attempt ledger adds immutable paired rate/reserved-cost snapshots plus a derived
estimated_cost_micros settlement, with exact arithmetic/terminal constraints.
Legacy attempts stay unpriced (null), never backfilled/revalued. No new entity,
customer commercial relation, invoice or actual provider charge is introduced.

Hub Application configuration owns encrypted provider credential, enablement,
external-processing policy and combined monthly token budget. An Investigation
is Application/environment/concrete-tenant scoped with kind, safe target,
idempotency key, validated output and authorized evidence references. Each
provider attempt records reserved bound, UTC month, safe model/token outcome;
settled/released ledger rows cannot be rewritten and runtime cannot delete them.
Unknown attempts retain their reserved bound. No prompt or credential is stored
in the attempt ledger. Scheduled runs have no invented human requester.

## GOAL-067 safe organization archival

`Organization` adds the terminal-access lifecycle state `ARCHIVED` plus
archive timestamp, Platform actor and reason. `OrganizationArchiveTransition`
is immutable, organization-bound and idempotent for `ARCHIVED` and `RESTORED`
events. Archival preserves every tenant-owned aggregate. Restore clears the
current archive projection and returns the organization only to `SUSPENDED`;
the immutable transition and general Audit history remain.

## GOAL-060 Personal Service model

`Organization.workspace_type` distinguishes `ORGANIZATION` from `PERSONAL`.
A personal workspace has a unique `personal_owner_user_id`, one active
`REQUESTER` membership for that user and no owner/admin membership. A verified
public account owns at most one personal workspace; provisioning is idempotent
and does not remove later or existing organization memberships.

`PersonalServiceCatalog` is the Platform-owned support catalog and operational
SLA/access-duration projection. `PersonalSupportCase` links one submitted
personal ticket to Jupiter support without becoming an organization Assist
case. It records a fixed operational lifecycle, requesting owner, real assigned
Jupiter agent and snapshotted SLA/access terms. A Personal Support
`SupportAccessGrant` has an explicit source, exactly matches the case ticket and
is time-bound/revocable; it is not an Assist grant. A
`PersonalCapacityReservation` reserves either current monthly capacity or a
purchased allocation and settles at most once when an authorized agent accepts
the case.

`PersonalAllowancePolicy` and nullable `PersonalAllowanceOverride` define
future monthly support and AI capacity. Immutable monthly allowance windows
preserve history. `PersonalPackage` defines either `SUPPORT` or `AI` units,
price in Toman and a bounded validity period; `PersonalPackageAllocation`
captures the purchased snapshot and expiry.

`PersonalCapacityReservation` binds one logical SUPPORT case or future personal
AI action to either one current `PersonalAllowanceWindow` or one active
`PersonalPackageAllocation`. It is uniquely idempotent per tenant and is
`RESERVED`, `SETTLED` or `RELEASED`; one support case references at most one
reservation. Allocation snapshots preserve package code/name, pool, units,
Toman price, validity and source even after catalog edits.

`PersonalPaymentOrder` stores an immutable tenant/owner/package/pool/unit/
Toman-amount/IRT/validity/provider-mode snapshot and lifecycle.
`PersonalPaymentAttempt` stores safe create/verify outcomes;
`PersonalPaymentFulfillment` links one verified order to exactly one PAYMENT
package allocation. `PersonalPaymentSettings` stores only Platform-controlled
availability and mode, never a credential.
No entity stores card data or a payment-provider credential. A manual refund
record stores only amount, reason, external reference, actor and timestamps.

## GOAL-057 Appearance overrides

`PlatformAppearanceSettings.custom_primary` is an optional global canonical
hex override. `OrganizationSettings.appearance_primary` is an optional
tenant-RLS override. Neither stores derived tokens or inherited platform
values; those are a runtime projection with SYSTEM, PLATFORM or ORGANIZATION
source. Existing preset, density, radius and logo attributes remain separate.

## GOAL-055 OrganizationSetupProgress

`OrganizationSetupProgress` یک رکورد tenant-scoped و versioned برای Wizard V1 است: current step، JSON stateهای صریح، زمان شروع/تکمیل و actor تکمیل را نگه می‌دارد. این aggregate مالک تنظیمات عملیاتی نیست؛ وضعیت Category، SLA، Team، Directory و capabilityها را از aggregateهای موجود projection می‌کند. `contact_phone` metadata اختیاری `OrganizationSettings` است؛ شخص تماس آزاد یا `contact_name` جدیدی ساخته نشده است.

## GOAL-052 recurring Smart Action allowance

`CommercialAllowancePolicy` سیاست global استخر `AI_SMART_ACTIONS` و `OrganizationAllowancePolicyOverride` استثنای nullable سازمان را نگه می‌دارند. Allowance، Add-on Allocation و Smart Action علاوه بر capability، pool مصرف را ثبت می‌کنند؛ Add-on تاریخ انقضا دارد و allocation دوره‌ای تاریخچهٔ immutable هر window UTC است.

## GOAL-051 complete AI Smart Action coverage

GOAL-051 associates `CommercialSmartAction` with its authenticated actor and a safe ticket/intake subject reference. `AiOperationTelemetry` is tenant-scoped, append-only operational metadata attached to an action when available; it never owns customer content or becomes a billing ledger.

## GOAL-050 commercial subscription lifecycle

`CommercialSubscription` اکنون وضعیت رسمی `TRIAL`، `ACTIVE`، `PAST_DUE`، `SUSPENDED`، `CANCELLED` یا `EXPIRED`، مهلت پرداخت و رخدادهای lifecycle را دارد. `OrganizationCommercialAgreement.grace_days` سیاست مهلت تجاری tenant-bound است. یک `Entitlement` product-bound فقط به subscription همان محصول تکیه می‌کند؛ بنابراین `JUPITER_ASSIST` از اشتراک AI نامرتبط مجوز نمی‌گیرد. این مدل هیچ تغییری در `Ticket` یا مالکیت داده‌های تیکت ایجاد نمی‌کند.

## GOAL-049 commercial remediation

`CommercialOveragePolicy` is tenant-scoped and unique per organization/capability. `CommercialRequest` is tenant-scoped, idempotent and auditable through PENDING, APPROVED/REJECTED and APPLIED. `CommercialNotificationMark` is a tenant-scoped dedupe key for commercial alerts.

`Organization` is the tenant boundary. `User` is global; `Membership` grants
a user organization-scoped roles and permissions. `Department`, `Location`,
`Discipline`, `Category`, and `Subcategory` form organization-scoped routing
metadata.

`Ticket` owns requester, lifecycle, classification, priority and typed tags.
`TicketTitleLibrary` owns approved and pending normalized title vocabulary per
organization. `Assignment`
and `StatusTransition` are immutable history. `TicketMessage`, `InternalNote`,
`Attachment`, `Activity`, and `Rating` attach to a ticket. `AIRequest`,
`AIResult`, and `AIFeedback` provide traceability. `Notification` is delivery
state; `KnowledgeCandidate` is reserved for future scope.

`TicketIntakeSession` is a temporary, owner-scoped pre-ticket aggregate. It
owns ordered `TicketIntakeMessage` entries (raw text or verified voice), their
transcripts, separate AI interpretation, primary/secondary issue evidence,
pipeline/retry state and versioned AI suggestions. On final draft creation it
becomes `CONSUMED`, links to the ticket, persists `TicketIntakeProvenance`, and
converts every verified voice message to a normal `Attachment` in the same DB
transaction.

Ticket states are fixed semantic codes: `DRAFT`, `OPEN`, `IN_PROGRESS`,
`WAITING_FOR_REQUESTER`, `RESOLVED`, and `CLOSED`. Organizations may configure
display labels and closure policy, not arbitrary workflow transitions.

## Master Upgrade aggregates

GOAL-031 implements `OrganizationApplication`, `AuthenticationIdentity`,
`DirectoryPrincipal`, public-account verification token/delivery records and
immutable application transitions. `OrganizationApplication` is separate from `Organization`, with statuses
`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `NEEDS_INFORMATION`, `APPROVED`,
`REJECTED`, and `CANCELLED`. `Organization` gains the additive lifecycle
`SETUP`, `ACTIVE`, `SUSPENDED`; this does not alter ticket lifecycle.

`User` and `Membership` remain canonical. Additive `AuthenticationIdentity`
and tenant-scoped `DirectoryPrincipal` records support public accounts and
directory users without email while preserving legacy credentials during
migration. `ORG_OWNER` is a membership role. GOAL-033 assigns it only to a
newly provisioned applicant (alongside `ORG_ADMIN` for existing administrative
compatibility); existing organizations may have no owner until explicit
assignment.

GOAL-036 adds tenant-scoped `DirectoryConnector` and
`DirectoryConnectorPairing`. A connector begins `UNPAIRED`, becomes `PAIRED`
only through a consumed, short-lived pairing code, and becomes permanently
`REVOKED` when its usable device credential is cleared. Pairing records retain
only a hash and expiry; the raw pairing code and device token are one-time
delivery values, never domain history or audit metadata. These aggregates do
not own AD credentials. GOAL-037 adds tenant-scoped `DirectorySyncRun` and
source-tracked `DirectoryPrincipalRoleGrant`. A run has a preview/apply
lifecycle and provisions a backwards-compatible global `User` without email
when needed, then its tenant membership and principal. It creates no login
identity and never alters a pre-existing global user profile. Disabled users
suspend immediately; scope exit is recorded first and suspends after seven
days. Directory users are never hard deleted.

Commercial aggregates are `Product`, `Subscription`, `Entitlement`,
`UsageAllowance`, `UsageLedger`, `AddOnPackage`, and
`OrganizationCommercialAgreement`, plus availability and organization-setting
records. `CommercialSmartAction` is a tenant-bound idempotent reservation with
`RESERVED`, `SETTLED` or `RELEASED` state and a selected allowance source; its
settlement is distinct from provider usage.

GOAL-042 adds `JupiterSupportAgent`, `OrganizationAssistPolicy` and `SupportAccessGrant`. They are separate from `Ticket` and `Membership`: a Jupiter agent has no tenant membership, while a grant is tenant-bound, time-bound and revocable. `Ticket.is_restricted` is additive; restricted access always requires an explicit routed-ticket grant. GOAL-043 adds tenant-scoped `AssistCase` and `AssistAccessRequest`: their request/approval/queue/acceptance/SLA lifecycle is independent of `Ticket`; only an accepted permitted case settles Assist capacity.

GOAL-045 adds one global `PlatformAppearanceSettings` record. It holds only
approved preset identifiers and an optional internal logo path, and is owned by
Platform Admin. It contains no tenant branding, custom code or secret; an
organization logo remains a narrower identity override.

GOAL-046 adds global `ProductHelpArticle` and immutable-version
`ProductHelpArticleRevision` aggregates. An article has a stable slug and at
most one current published revision; a revision carries Persian title, summary,
content, category, audience, tags, product area, related feature/route and
source lineage. These records deliberately have no `organization_id`: Product
Help is platform content and must never share the tenant knowledge ownership or
review lifecycle.

GOAL-047 makes a `ProductHelpArticleRevision` append-only from the application
workflow: edits and restores create a new `DRAFT`, publishing selects exactly
one current revision, and unpublishing hides the article without deleting
history. Platform exports are projections of the current published revisions,
not a second content store.
# GOAL-053 — Assist capacity aggregates

`AssistCapacityPackage` is a Platform-owned package linked to the existing `CommercialProduct`. `OrganizationAssistCapacityAllocation` is tenant-scoped, time-bounded capacity. `AssistCapacityLedger` is append-only and records allocation, adjustment and one unique consumption per `AssistCase`. `organization_assist_policies.capacity_units` remains a compatibility read model only; positive legacy values migrate once to open-ended `LEGACY_MIGRATED` allocation.

## GOAL-054 Directory operations aggregates

`DirectoryScopePolicy` and `DirectoryGroupRoleMapping` are tenant-scoped,
versioned records. `DirectoryScopeCatalogItem` keeps connector-discovered OU /
group generation and last-discovery time. `DirectorySyncRun` is immutable run
history with policy/mapping versions and count projections. `DirectorySyncCommand`
is the bounded connector queue entry; `DirectorySyncConflict` is the safe,
tenant-scoped record for an identity correction.
`DirectoryConnector` retains its identity across explicit re-pair: a revoked
record receives new hashed one-time pairing material and only a successful
pair establishes its replacement device identity.

## GOAL-065 personal UX projections

`PersonalWorkspaceSummary` is a read projection over personal allowance
windows, active package allocations, service catalog and support cases; it is
not a second commercial aggregate. `PersonalPaymentReceipt` is a safe paid-order
projection and explicitly not an accounting or tax-invoice entity. Personal AI
actions reuse `PersonalCapacityReservation` with `subject_type=AI_ACTION` and a
capability-qualified idempotency key; no organization Commercial Smart Action
row is created for the personal pool.
