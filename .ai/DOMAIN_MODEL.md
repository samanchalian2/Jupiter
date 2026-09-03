# Domain Model

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
