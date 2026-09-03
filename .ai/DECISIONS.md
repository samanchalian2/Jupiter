# Architecture Decisions

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
