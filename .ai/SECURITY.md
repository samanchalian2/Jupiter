# Security and Privacy

## GOAL-069 Observability Hub

DEC-052 Overview additions use the same revalidated grant and tenant-scoped
transaction as existing statistics; no cross-tenant precomputed health cache or
provider call. AI summaries expose only a bounded persisted summary/kind/time/
target reference under RLS, not credentials, raw attempts/cost or new authority.
Event filters require linked target evidence; unlinked summaries are excluded
instead of leaking a broader cohort. No-event health explicitly remains unknown.

DEC-051 recovery notifications carry only an expected scope, never a token,
URL/body or provider error. Current scope/generation are rechecked at scheduled
execution, with cancellation on context switch/logout/shutdown. Anonymous
activity and stale scope cannot authorize replay. A successful API response is
only a retry hint: existing credential/tenant checks, expiry, backoff and ACK
validation remain authoritative. No online/healthy status is fabricated.

DEC-050 rule cadence is deployment-owned, bounded and read once at boot. Invalid
values use a fixed safe default without logging their contents or disabling the
product. Rules cannot increase AI/maintenance frequency. Failure diagnostics
contain only existing fixed codes; no provider error, credential or raw input.
Runtime acceptance changes only an ephemeral child-process environment and
disposable Hub data, never live tenant settings or shared-role attributes.

DEC-049 Browser offline retention accepts only bounded integer durations; it
cannot extend the previous 48h event/24h feedback security limits. Absolute
enqueue-time expiry survives reload/retry without renewal. Constructor options
apply to new envelopes, not existing journal history; diagnostic TTL remains
separate. Actor partition purge, credential-free storage and server-side scope
validation remain unchanged. Native acceptance uses disposable verified sessions
and synthetic content, never production tenants or credential injection.

Actual Web acceptance checks a generated local DB namespace, rejects shared
development ports and uses a strict ephemeral Vite listener/proxy. API base is
explicitly overridden in harness memory to avoid inherited deployment URLs.
The fixture origin is explicitly registered; normal login/membership/minting is
used, never session injection or disabled browser security. Network faults target
only Hub batches; synthetic screenshots exclude login, secrets and real tenants.
Normal session logout/refresh denial and Browser/server teardown run in finally.

Actual-main acceptance uses only a generated local disposable database. Its
existing jupiter_app role is not recreated/altered; normal migration grants
refer only to new objects in that database, removed with teardown. Generated
password/JWT values stay in process memory/environment, never command arguments
or logs. Raw child logs are discarded; only allowlisted path/status outcomes
are retained. Normal scrypt/JWT/membership/session revocation remain enabled,
and no provider/storage secret or outbound AI/verification work is configured.

React diagnostic-failure containment introduces no new fallback log or data
channel; sanitization and safe component identification stay unchanged. Mounted
Browser fixtures use fresh contexts, synthetic form input and controlled SDK
ports without sessions/tenant data. React's expected caught fixture error is
counted safely; no raw component stack, input or diagnostic error is exported.

Jupiter fetch observation failure never authorizes retry of a business request.
Preparation failure forwards the original arguments once; diagnostic completion
cannot replace response/error. Failed or changed identity suppresses capture.
Callback failures are consumed without raw logging or recursively using Hub.
Native Browser acceptance uses a fresh local-only context and ephemeral HTTP
fixture, not a signed-in user profile or weakened production network policy.

DEC-048 does not promise physical erasure when browser storage rejects writes.
Unavailable old durable rows retain their original partition; fresh context
synchronization purges foreign rows before replay. Credentials are never stored,
and server scope checks/idempotency remain authoritative. Data fallback checks
generation and partition before copying retry state; logout stops active replay.
Memory fallback cannot guarantee survival across page loss. Real Browser quota,
foreign partition and forged-actor tests complement storage-write fault tests.

DEC-047 comparison preauthorizes every explicit target before data reads and
revalidates current grants under runtime RLS for each target query. Mixed-access
or revoked scope rejects the whole response without partial rows. One target per
Application prevents overlapping scope counts; server registry supplies names.
Strict 1–10 bounds and common validated window/filters apply. Operational rate
limiting precedes this read-only POST. Client labels/unknown fields are rejected.
Real SQL/HTTP grant-revocation and independent Browser late-response tests verify
the boundaries; client cancellation is complemented by a generation guard.

DEC-046 analytics uses current operational authorization and runtime RLS, never
worker/admin bypass. Fixed SQL reads only needed safe columns and returns bounded
projections. Unknown filters/status/pagination are rejected for this aggregate
endpoint; no arbitrary SQL/identifier, raw stack, provider body or credential is
exported. Real HTTP 401/403/400, tenant/App denial and missing-data tests cover it.

Real queued-service acceptance uses generated disposable DB/role, valid fixture
membership and encrypted random fixture key with a loopback-only provider.
Actual HTTP error-body marker is absent from stored operational events/warnings;
real failed review/text/voice reservations release without settlement. Normal
manual submit and review recovery remain functional. This supplements, not
replaces, authentication/tenant/provider secrecy and full host security tests.

DEC-045 sampling retains the fixed table allowlist, worker role and scoped
predicates. Cursor values are internal UUIDs, parameterized, constant-size and
not exposed as tenant data. Timed-out/locked scopes have no fabricated snapshot;
only fixed METRICS_STORAGE_UNAVAILABLE diagnostics are logged. Nonblocking
advisory locks and local SQL deadline bound shared-pool lock/scan pressure.
No dropped role, weakened RLS or privileged runtime API is introduced.

Queued Worker operations attribute only stored job organization IDs and null
automation actors. Controlled outcomes use fixed failureCode/retryExhausted
metadata, never request IDs as credentials, prompts, transcripts or raw provider
errors. Additional AI/intake persisted-state reads filter both ID and tenant;
their failure only logs a fixed observation warning and cannot stop business
processing. No exception/result change was made to AiGatewayService.process.
The normal SDK contract validates outcome events before HTTP; tests must assert
that rows actually persist, not merely that a report method was called.

Large-frame QC optimized email masking implementation, not secret policy:
domain-first matching plus backwards local-part scanning keeps the original
ASCII regex semantics and masking-rule order, checked against golden cases and
1,000 deterministic generated strings. Long invalid/no-email words no longer
force repeated greedy prefix scans. Other redaction rules are unchanged. Both
SDKs bound exact UTF-8 batch bytes as well as event count before transport; the
server limit remains independent and unchanged. Tests include failed outbound
attempts, not only successful responses, with no raw payload/credential logging.

The eleven Hub Help articles are public educational ALL content, never scoped
operational records or credentials. They do not confer Hub grants or expose
private existing Help. Jupiter's adapter uses normal authenticated Help lookup,
checks the returned slug, renders plain text and aborts/clears on close/session
change. Runtime publication requires the existing active Platform Admin and
validates every explicit catalog slug before any write; selection does not bypass
authoring authority. Actual browser acceptance logs out/rechecks refresh 401,
persists no credentials/session and verifies anonymous private-guide denial.

DEC-044 automatic reporting asserts expected App/environment against the verified
credential; headers never override scope. Both HTTP adapters and CORS preserve
them. Browser journal has no credential, only bounded fixed counters/original
partition. Initial synchronization purges foreign rows. Context/logout aborts
RPCs and serializes retry writes with purge; post-body generation guards prevent
late event/reply/metric results from reaching the next actor. Status reads also
synchronize scope, and stopped SDKs do not query a signed-out context. Real
Browser lost-ACK/reload proves one report; Node HTTP replay and wrong-App headers
are tested separately. ADMIN self-health source separation and Viewer denial are
verified in shared Console; no blanket host/UI/Staging claim follows.

DEC-043 self-metrics accept no identity/provenance/payload fields from clients.
Verified credentials bind App/environment/tenant/actor and report provenance;
hashes prevent same-ID mutation or another actor's replay. SDK reports have
strict ISO UTC/replay/count/rate bounds. Runtime cannot INSERT/UPDATE reports;
current environment-wide ADMIN authority is required for full health/storage.
Tenant-bound grants, other Applications/environments and revoked grants fail.
Metric write failure cannot alter a committed event ACK; bounded buffer loss is
explicitly logged with fixed fields, never raw exceptions. Browser context/logout
clears metric deltas before another actor can use them. Client-reported counts
are not trusted rule/Incident evidence. This is not full source/UI acceptance.

DEC-042 accepts critical-event classification only from trusted SERVER/WORKER
sources. Browser severity and ordinary HTTP 4xx cannot elevate Incidents. Pipeline
warnings include no raw failure content. The independent probe uses no bearer,
follows no redirect, bounds response bytes and deadlines, and rejects network
HTTP/credential-bearing targets. Structured fallback logs have fixed fields,
no exception/secret/payload, and per-code rate bounds; sink errors are contained.
External monitoring deployment remains separate from this local acceptance.

DEC-041 delivery checks current active scoped operator/admin grants on each
recipient page; inbox reads still reauthorize after revocation. Feedback replies
explicitly compare persisted tenant scope before any write, including privileged
actors. Only an authenticated human triage can create important-feedback alerts;
runtime ingestion gains no alert INSERT grant. Migration 070 adds delivery state
only and has been rehearsed in a disposable database and applied locally, not
deployed to target hosts.

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
