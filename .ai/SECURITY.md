# Security and Privacy

## GOAL-069 Observability Hub

Independent Browser acceptance uses a fresh headless context, random HttpOnly
fixture session, explicit operational grants and a disposable database, never a
signed-in user's profile. The sample backend resolves scope from its trusted
session port; browser-supplied mint scope and unauthorized tenant switches are
denied. Native browser fetch/IndexedDB/network interception run for real. Logout
revokes prior actor credentials and clears queue; next-actor and storage-denial
cases are separately verified. The controlled reference AI port makes no external
provider call and cannot consume the real configured budget. See the reference
README for production-consumer identity/CSRF responsibilities and limitations.

Operational retention (DEC-040) never touches business/security Audit or tenant
tables. Only application-wide ADMIN can shorten an Application's windows, with
reason/Audit; environment-only grants cannot escalate. Persisted lease metadata,
policy/environment locks, bounded parent/child deletion, atomic Audit/completion
and eight-day receipt retention protect cross-scope execution and eligible retry.
Active or recently discussed histories and pending aggregation are preserved.
Runtime gets SELECT only on maintenance state; worker cannot delete canonical
Audit or AI usage ledger. Maintenance API explicitly reports partial coverage,
not complete self-monitoring or staging health.

The public OpenAPI document is static code-derived metadata, not tenant/runtime
data. Its unauthenticated download is under the request limiter; it never reveals
credentials, encrypted configuration or actual Application IDs. Operational,
server-mint and browser ingestion bearer schemes remain distinct. External-client
examples require HTTPS except explicit loopback test mode, refuse redirects,
bound body/response/time/retries and never print credentials/raw server bodies.
Their acceptance child processes receive only scoped ephemeral fixture secrets,
not the parent's DB/provider secret environment. These memory-only examples do
not claim durable outbox or offline-browser guarantees.

Operational inbox access requires both a current operational grant and the
recipient principal in RLS. Even a Hub super-admin cannot acknowledge another
recipient's inbox row. Composite Application/environment/tenant FK prevents
cross-tenant alert attachment. Delivery snapshots active authorized operational
recipients only; revoked access denies subsequent reads. Jupiter notification
projection verifies the current account and synchronizes its managed Jupiter
grant on every read. No ordinary business role implies operational access.
Operational notices are not copied into organization ticket notifications or
stored in browser localStorage; the durable Hub inbox is their source of truth.

Investigator credentials are encrypted with Application-bound AES-256-GCM and
never returned by configuration APIs. External provider hosts are deployment-
allowlisted, redirects/query credentials are rejected, and response bodies are
bounded. The local owner-selected provider is GapGPT. Each provider attempt
reserves a conservative input-byte/output-token bound under an Application
advisory lock, across environments; uncertain usage remains held rather than
being released. Findings cite only curated authorized evidence; no tools or
business mutation are available to the model. AI failure never blocks ingestion.
Operational AI accounting is separate from Commercial/Personal customer pools.

Operational identity/grants are independent of Jupiter roles. Ingestion
credentials are scoped, hashed, revocable and browser short-lived. Runtime Hub
data uses dedicated RLS scopes and has no direct credential-hash privileges.
Raw events/receipts are immutable to the ingestion role. Browser queues contain
only sanitized envelopes and preserve original actor/tenant scope; credential
material stays in memory. Feedback AI processing follows DEC-038, not a separate
consent lifecycle. Full acceptance remains in progress.

Jupiter Browser minting re-verifies the active account and any requested
membership. Each subsequent Browser Hub call rechecks host-account/membership
validity; logout/password revocation invalidates Browser credentials. An old
account's late fetch completion is not recorded under a replacement identity.
The host's managed Platform Admin mapping neither creates HUB_SUPER_ADMIN nor
revokes independent manual Application grants. Operator mutation authorization
and RLS data writes share a transaction; Audit stores action references, not
feedback bodies or credentials. CSV neutralizes formula injection. Registered
origins are auxiliary to credential verification and changes are audited.

## GOAL-060 Personal Service security

Personal workspaces retain the normal tenant boundary: every ticket, message,
attachment, allowance, package allocation, support case and support grant is
bound to the personal workspace and protected by backend authorization,
composite tenant integrity and RLS. The canonical `/personal` route is only a
resolver convenience and never substitutes for authenticated ownership.

Email verification is required before automatic personal-workspace ownership.
Provisioning is idempotent and the unique owner constraint prevents duplicate
personal tenants. Jupiter agents receive no membership; each support read/write
requires an active, unexpired and unrevoked grant for the exact ticket.

GOAL-062 enforces the exact case/ticket relationship with a composite
organization/case/ticket foreign key and a unique personal-case grant. Catalog
writes require Platform Admin and are also revoked from the tenant application
role. Case content authorization, grant row lock and content read/write occur
in one tenant transaction, preventing access from surviving concurrent revoke
or expiry. Organization Assist queries explicitly exclude Personal Support
grants.

GOAL-063 applies RLS and composite tenant FKs to personal override, monthly
window, allocation and reservation rows. Tenant-role writes are revoked from
Platform-owned overrides and allocations. Organization/pool advisory locks,
unique idempotency keys and immutable issued windows/snapshots prevent quota
oversubscription and history rewriting. Owner projections are membership-bound;
Platform operations require an explicit personal workspace and real actor.
Capacity audit metadata contains only pool/source/unit/commercial facts, never
ticket content or credentials.

GOAL-064 snapshots payment amount, package identity, units and validity server-side
before provider creation. Callback query values are untrusted until the server
verifies authority and amount with the provider. Order transitions and package
fulfillment are locked and idempotent. Provider secrets are environment-managed
and excluded from database rows, logs, audit metadata and client responses;
card data and raw provider payloads are never stored. Production callbacks
require HTTPS. The deterministic local adapter is unavailable in production.
Platform settings cannot weaken these controls, and the tenant application role
cannot write payment or Platform-owned allocation rows.

## GOAL-057 Appearance input boundary

Appearance accepts only server-normalized uppercase six-digit hex values.
It rejects raw CSS, variables, URLs, gradients and HTML/script payloads before
persistence. Platform appearance is Platform Admin-only; organization primary
writes run under active membership and tenant RLS. Audit records retain only
event facts and source, never raw payloads or secrets. The effective theme is
loaded per tenant so one organization's primary cannot be read or applied in
another organization's context.

## GOAL-055 Setup Wizard

Wizard APIها tenant-bound هستند و actor از membership سروری گرفته می‌شود. `OrganizationAccessPolicy` اختیار عملیاتی Owner/Admin را مرکزی می‌کند؛ Go-Live و skip صرفاً Owner هستند. optimistic version از overwrite حالت stale جلوگیری می‌کند. projection readiness هیچ credential Directory، token جفت‌سازی، کلید AI یا secret را برنمی‌گرداند و Audit فقط step/action و شمار blocker را ذخیره می‌کند.

## GOAL-052 recurring Smart Action allowance

Policy و override فقط Platform-Admin هستند؛ override سازمان هدف صریح، RLS tenant-bound و Audit دارد. Worker هیچ actor کاربری جعل نمی‌کند و metadata اتوماسیون حداقلی ثبت می‌شود. Owner فقط projection سازمان خودش را می‌بیند.

## GOAL-051 complete AI Smart Action coverage

Telemetry is RLS-protected and immutable to the application role. It may contain operation/outcome, provider/model, token counts, audio duration and estimated cost only; prompts, ticket text, transcript, files and credentials are excluded from telemetry and settlement metadata. Owner and Platform reports are server-side projections of permitted fields only.

## GOAL-050 commercial subscription lifecycle

Transitionهای اشتراک Platform-Admin-only، tenant-bound و audited هستند. سازمان هدف برای هر تغییر صریح است؛ اعلان lifecycle فقط برای ORG_OWNERهای فعال همان سازمان، با dedupe پایدار، ارسال می‌شود. پذیرش جدید Assist همان resolver سروری capability `JUPITER_ASSIST` را اجرا می‌کند و هرگز از اشتراک محصول نامرتبط مجوز نمی‌گیرد.

## GOAL-049 commercial remediation

Commercial overage policies, requests and alert marks are tenant-RLS scoped. Platform review/apply requires an explicit organization target; owner controls use the authenticated tenant actor. Audit records retain the actual actor and minimal event facts, not request secrets.

Primary threats: cross-tenant IDOR, privilege escalation, session theft, XSS/
CSRF, malicious files, secret leakage, AI data disclosure, prompt injection,
and rate abuse. Controls: backend policy checks, tenant context, composite
constraints/RLS, short access tokens with rotating hashed refresh tokens,
CSP/sanitization/CSRF checks, allowlisted validated uploads and short-lived
signed URLs, rate limiting, encrypted secrets, redaction/minimal AI context,
and structured logs with retention policies.

Audit all authentication-sensitive, permission, assignment, state, and AI
setting operations. Never place raw secrets or sensitive content in general
logs. Future RAG must treat retrieved content as untrusted data.

## Master Upgrade security controls

Organization applications, approval/provisioning, commercial adjustments,
directory pairing/scope/sync, Assist grants and Help publishing/export require
minimal non-sensitive audit events. New tenant-scoped data uses RLS, composite
integrity and backend authorization; tenant URL resolution never substitutes
for membership verification.

GOAL-031 public verification tokens are short-lived, single-use and stored only
as hashes. Directory authentication is out of scope: no AD password or service
credential reaches cloud storage or normal logs. Connectors are organization
bound, outbound-only, pair with short-lived single-use material, and have
rotatable/revocable device identity with replay protection.

GOAL-036 enforces those controls with RLS-protected connector/pairing records,
15-minute hashed pairing codes, a one-time hashed device token and explicit
revocation that clears usable device credentials and unused pairing codes.
The initial control-plane exchange carries no directory data and no AD/LDAP
credential. The request-proof protocol for future device calls remains a
validated candidate rather than an unreviewed security assumption.

GOAL-037 selects DPAPI-protected, service-local Windows configuration and an
outbound-only PowerShell/WinSW runtime. A device credential is stored cloud-side
only as a hash and rotates after every accepted request; a reused credential,
wrong connector/device binding or revoked connector is rejected. Preview/apply
records are RLS-bound to the connector organization. Directory payload
validation rejects credentials and owner/admin roles.

GOAL-032 delivery is explicit: production verification URLs and webhook
delivery require HTTPS; the approved SMTP adapter uses deployment-owned
configuration and a relay/MTA that is not exposed as an open relay. SMTP
credentials and DKIM private keys remain outside the repository and database.
Plaintext SMTP is permitted only across the same-host loopback boundary; the
configuration validator rejects TLS bypass for every non-loopback host.
`LOCAL_TEST` is non-production only. The local inbox is process-local, requires
the matching authenticated public account and is unavailable in production.
Normal API responses, audits and logs never return raw verification tokens.

GOAL-033 review and provisioning are Platform Admin-only and transactional.
An approved slug is unique, application approval is idempotent, and a slug
conflict cannot leave a partial tenant or membership. Audit metadata contains
state/action facts only; applicant review text remains in the application and
is not copied to general audit metadata. Existing owners are never inferred or
auto-promoted.

Commercial APIs independently enforce entitlement, organization setting,
platform availability and allowance. Support access is grant-scoped and
restricted tickets require an explicit matching grant. Product Help enforces
audience authorization; draft and unpublished revisions are never public.

GOAL-042 adds tenant-RLS-protected Assist policy and grant records. Only a
Platform Admin can manage Jupiter agents, policy/capacity or grants. A grant
check independently requires an active agent, matching organization, valid
time window and scope; full-support does not reveal a restricted ticket without
an explicit matching grant.

GOAL-045 platform appearance writes are Platform Admin-only and minimally
audited. The persisted record permits only enumerated presets and an internal
managed-logo path, rejecting arbitrary CSS/JavaScript and external URLs. Its
public read model contains no sensitive or tenant-scoped data.

GOAL-046 Product Help reads derive the caller's active memberships and
Platform Admin flag server-side. The query joins only the current published
revision and requires audience intersection before returning either metadata
or body; unauthorized, draft and unpublished slugs return the same 404 result.
Help is global platform content, so it cannot be selected with an organization
header or joined to tenant knowledge data. Repository seeds retain only a
source key/checksum and never overwrite existing runtime content.

GOAL-047 authoring, preview, publishing, restore, unpublish and export are
Platform Admin-only and audited. A preview is available only to that role;
public/user discovery still uses the published-and-audience query. The Help
reader renders Markdown as escaped text rather than injected HTML, so Help
authors cannot introduce executable markup through content.

GOAL-056 keeps Help global and Platform-owned. Its contextual feature/route
registry is allowlisted server-side; it exposes neither tenant data nor any
credential. The runtime publication utility requires an active Platform Admin
actor and only creates immutable drafts/revisions before publishing them.
# GOAL-053 — Assist capacity authorization

Only Platform Admin may create/suspend packages, allocate or adjust capacity, with an explicit organization target and mandatory adjustment/suspension reason. Owners may read their organization projection only. Ledger rows are tenant-RLS-scoped and application-role immutable; acceptance locks the organization and case to prevent a second settlement.
Platform Owner assignment and revocation are explicit, organization-targeted operations. Revocation removes only `ORG_OWNER`, records the actor and prior owner identities in audit metadata, and never automatically promotes an `ORG_ADMIN`.

## GOAL-054 Directory operational controls

Heartbeat, policy, discovery and sync requests use the rotating hashed device
identity and are organization-bound by application checks and RLS. Heartbeats
store only timestamp, version, service status and non-sensitive host metadata.
Conflict records contain a safe correction message, never a token, credential
or raw directory payload. Sync Now is owner/admin-only and returns an active
command instead of creating a parallel one. Revocation invalidates device
identity and unused pairing material without putting raw secrets in audits.
Explicit re-pair is tenant-bound and owner/admin-only; it can issue a new
hashed one-time code only for a revoked connector. Pairing creates a fresh
device identity/token in the same record, so the revoked credential never
becomes valid again and audit metadata contains no secret material.

## GOAL-065 personal UI and AI boundary

Personal routes require the canonical active owner/REQUESTER membership and do
not expose organization administration. AI reserve/settle/release re-check the
workspace type and personal owner boundary server-side; UI visibility is never
authorization. Platform AI credentials remain write-only and are not returned
to personal projections. Payment callback redirects contain only a normalized
status and optional order ID, never provider authority, merchant credential or
raw provider error. Contextual Help is global published content filtered by the
caller's active audience.

## GOAL-067 safe organization archival

Organization archival is Platform Admin-only and requires prior suspension,
exact-slug confirmation, a bounded reason and idempotency. Tenant actor
resolution joins organization lifecycle and accepts only `SETUP` or `ACTIVE`,
so an existing access token cannot use a suspended or archived tenant.
Login/refresh projections omit archived memberships. Personal workspaces cannot
enter this flow. Restore returns to suspended and therefore does not silently
restore access.
