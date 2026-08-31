# Security and Privacy

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
delivery require HTTPS, while `LOCAL_TEST` is non-production only. The local
inbox is process-local, requires the matching authenticated public account and
is unavailable in production. Normal API responses, audits and logs never
return raw verification tokens.

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
