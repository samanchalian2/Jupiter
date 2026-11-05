# Self-service onboarding: implementation scope

Owner2026-11-05 requests review of full account/organization/member flow, safe
defaults, no Platform Admin approval. This is a new product change, not authority
to activate old tenants, promote members, enable paid services or verify emails.

## Reviewed current holds

1. Public identity creation immediate; email verification required before org
submission. Delivery disabled/failed is explicit; must not fake verification.
2. Organization application currently DRAFT→SUBMITTED→Platform review→APPROVED;
manual review is the primary hold to remove for NEW submissions.
3. Approval atomically provisions SETUP+owner/admin. Empty category now defaults
IT_SERVICES; timezone currently depends on a separate settings step.
4. Owner final Go-Live currently remains explicit. Requesters cannot operate
until ACTIVE, even with correct role; mere member creation isn't activation.
5. Username optional/email-only warning, role defaults REQUESTER, password8 and
first-login change already supported. No default/shared passwords permitted.

## Target acceptance matrix

- Verified self-service user explicitly submits organization creation; server
atomically creates organization+owner/admin+settings+IT category without Platform
Admin decision. Stable auto slug, safe defaults, rollback on any error.
- User action identifies creating a new tenant, never joining/claiming a tenant
based on name/domain. Duplicate retry/concurrency returns same organization.
- Contact name defaults actual account display name; phone/legal name optional.
- Default timezone Asia/Tehran for present Persian product, visible/editable;
don't silently overwrite an existing timezone or infer geography from email.
- Existing review endpoints/history/status codes preserved for legacy cases;
no mass approval of pending/rejected/cancelled applications.
- Explicit organization creation confirmation may authorize baseline activation
only through canonical lifecycle code with valid defaults/owner/readiness. No
global SETUP bypass and no activation through a GET or login side effect.
- Minimal member input: display name,valid email,password>=8 and defaultREQUESTER;
username optional, explicit email-only sign-in notice; no accidental admin role.
- Existing-user membership reuse never resets password or adds privileged roles
without normal authorized action; scoped lists and denial remain intact.
- Optional team/catalog expansion/branding/AD/SLA not blockers. Do not create
fake user details, external credentials or service/financial commitments.
- Help/UI must describe direct registration, not waiting for platform approval.

## Verification required before publication

Isolated full migrations/API/Web suite; positive creation without Platform actor,
ownership/email gate, duplicate/retry/concurrency, rollback, two-tenant isolation,
legacy review compatibility, no paid-service enablement, actual requester ticket
and owner-response scenario with disposable fixtures. Preview then main scoped
deployment/backup/readiness, Help publication. No GitHub push per current owner hold.

Status: architecture/workflow analysis recorded, implementation and publication
NOT completed. Existing main behavior unchanged by this document.
