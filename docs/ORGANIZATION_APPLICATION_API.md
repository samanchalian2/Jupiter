# Organization Application API — GOAL-033

Base path: `/api/v1`. Public onboarding, Platform Admin review, safe tenant
provisioning, canonical tenant context and resumable setup are available.

## Public account and email verification

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/public/accounts` | Create a public account and queue verification delivery. |
| POST | `/public/accounts/verify-email` | Consume one raw verification token. |
| POST | `/public/accounts/verification/resend` | Request a replacement delivery for the signed-in account. |
| GET | `/public/accounts/status` | Return the signed-in public account's verification state. |

`POST /public/accounts` accepts `email`, `displayName`, and a 10–200 character
`password`. Its response never contains the raw verification token. Jupiter
stores only a SHA-256 token hash. Delivery is deployment-configured:

- `LOCAL_TEST` is the development default and keeps the raw token only in the
  API process's ephemeral local test inbox. It is never returned during account
  creation or resend.
- `WEBHOOK` posts a verification URL (not a raw token) to the configured HTTPS
  delivery endpoint.
- `DISABLED` reports `PENDING_CONFIGURATION` without logging or exposing a
  token. This is the safe production fallback.

The development-only `GET /public/accounts/test/verification-deliveries?email=`
route requires the matching signed-in account and is unavailable in production.
It exists solely to make the local end-to-end flow testable; it is not a mail
delivery feature and must not be enabled or documented for customers.

Verification tokens are single-use, expire after 24 hours, and resend is
limited to one request per 60 seconds. A verified account can sign in before
it has an organization membership, but verification is required before it can
submit an organization application.

## Organization applications

All routes below require `Authorization: Bearer <access token>`.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/organization-applications` | Create an applicant-owned `DRAFT`. |
| GET | `/organization-applications/me` | List only the signed-in applicant's applications. |
| POST | `/organization-applications/:id` | Update an applicant-owned editable draft. |
| POST | `/organization-applications/:id/submit` | Submit a verified applicant's draft. |
| POST | `/organization-applications/:id/cancel` | Cancel a permitted applicant-owned application. |

Mutation routes require a UUID `Idempotency-Key` header. Repeating the same
command returns the resulting application without adding a second transition.

Create accepts `organizationName`, optional `preferredSlug`, `contactName`,
optional `contactPhone`, and optional JSON `details`. A preferred slug is a
request only; it is not an assigned tenant address.

The exact state model is:

```text
DRAFT
SUBMITTED
UNDER_REVIEW
NEEDS_INFORMATION
APPROVED
REJECTED
CANCELLED
```

Applicants may create or update a `DRAFT`/`NEEDS_INFORMATION`
application, submit a verified `DRAFT` or `NEEDS_INFORMATION` application, and cancel `DRAFT`, `SUBMITTED` or
`NEEDS_INFORMATION`. Application ownership is enforced in the service;
attempts to read or change another applicant's record receive no record access.

## Platform review and provisioning

All routes below require a signed-in active Platform Admin and a UUID
`Idempotency-Key` on mutations.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/platform/organization-applications` | List the platform review queue and completed decisions. |
| POST | `/platform/organization-applications/:id/start-review` | `SUBMITTED` → `UNDER_REVIEW`. |
| POST | `/platform/organization-applications/:id/request-information` | `UNDER_REVIEW` → `NEEDS_INFORMATION`; a user-facing note is required. |
| POST | `/platform/organization-applications/:id/reject` | `UNDER_REVIEW` → `REJECTED`; a user-facing note is required. |
| POST | `/platform/organization-applications/:id/approve` | `UNDER_REVIEW` → `APPROVED` and atomically provision a setup organization. |

Approval accepts a Platform Admin-selected `slug` and optional `note`. It
creates one new organization in `setup`, reserves the slug, creates an active
membership for the applicant, and assigns `ORG_OWNER` plus `ORG_ADMIN`. The
same command key is idempotent; a later retry of an already approved,
provisioned application returns the existing organization instead of creating
another one. A slug conflict rolls the whole command back—no partial
organization, membership, role or approval is left behind.

Existing organizations remain `active` or `suspended` and receive no automatic
owner assignment. Their existing `ORG_ADMIN` memberships are not changed.

## Canonical tenant context and setup

The web workspace uses `/o/{slug}` as its canonical address. A legacy path is
redirected only for a signed-in person with one unambiguous organization;
people with multiple organizations select one explicitly. Platform management
remains outside tenant context.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/tenant-context/:slug` | Resolve a slug only for an active member; returns the server-authorized tenant context. |
| GET | `/admin/tenant-setup` | Return the current tenant's setup status and readiness. |
| POST | `/admin/tenant-setup/complete` | Backward-compatible alias of canonical Go-Live; Owner-only and idempotent. |
| GET | `/admin/platform/organizations/:id/members` | Platform Admin-only list of active eligible members. |
| GET | `/admin/platform/organizations/:id/owners` | Platform Admin-only list of explicitly assigned owners. |
| POST | `/admin/platform/organizations/:id/owner` | Platform Admin-only replacement of the owner with an active member. |

`POST /admin/tenant-setup/complete` delegates to the same canonical
`OrganizationSetupService.goLive()` flow as
`POST /admin/setup-wizard/go-live`. Both routes require `ORG_OWNER` and apply
the identical server-derived readiness, locking, idempotency, audit and
`setup` → `active` lifecycle behavior: an active owner, valid organization
name/timezone and at least one Ticket Category. It emits the canonical
`ORGANIZATION_SETUP_GO_LIVE` audit exactly once on successful activation; a
rejected readiness attempt does not claim a durable rejected audit because its
transaction is rolled back.
An active legacy organization stays operational without an owner until a
Platform Admin deliberately assigns one; no existing `ORG_ADMIN` is inferred
or auto-promoted.

## Manual and CSV user provisioning

An `ORG_OWNER` or `ORG_ADMIN` may continue to create and manage members one at
a time. CSV import is deliberately limited to local Jupiter users; it does not
create directory principals or call a directory connector.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/admin/members/import/preview` | Validate up to 500 rows and return safe row-level errors without writing data. |
| POST | `/admin/members/import/confirm` | Atomically create or update valid local members and roles. Requires `Idempotency-Key`. |

Each CSV row must provide `email`, `displayName`, `password` and one or more
roles; `username` is optional. Roles are `REQUESTER`, `EXPERT`, `SUPERVISOR`
or `ORG_ADMIN`. The browser accepts roles separated with `|`. The preview and
confirmed response never include passwords. A confirm retry with the same key
and unchanged non-secret row content returns its first row-level result; the
same key with changed content is rejected. Import audit records contain only
row counts, and the tenant-RLS-protected idempotency record contains no
password.

## Directory connector control plane

Directory control is available only to `ORG_OWNER` and `ORG_ADMIN` in the
organization context. It never transmits or stores AD credentials.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/directory/connectors` | List safe connector status for the current organization. |
| POST | `/directory/connectors` | Create an unpaired named connector. |
| POST | `/directory/connectors/:id/pairings` | Issue one 15-minute, single-use pairing code and invalidate an earlier unused one. |
| POST | `/directory/connectors/:id/revoke` | Revoke the device identity and all unconsumed pairing codes. |
| POST | `/directory/agent/pair` | Connector-only pairing exchange: consumes a pairing code and returns its one-time device identity/token. |
| POST | `/directory/agent/heartbeat` | Paired connector liveness/version update; returns a rotated device token. |
| POST | `/directory/agent/sync/preview` | Paired connector submits a FULL or DELTA identity preview. |
| POST | `/directory/agent/sync/apply` | Idempotently apply an accepted preview run. |
| GET | `/directory/connectors/:id/sync-runs` | Owner/admin sees safe recent lifecycle metadata. |

The web UI shows a pairing code only at issue time. The database retains only
SHA-256 hashes of pairing codes and device tokens. Replaying, expiring or
revoking a pairing prevents device activation. The connector uses outbound
HTTPS only; every accepted agent call rotates the device token. A replayed old
token, wrong device binding or revoked connector is rejected. Preview data
contains approved identity attributes only and cannot create owner/admin roles
or a cloud-held directory credential.

## Security and audit

- Existing email/username login continues through legacy `users` credentials.
- New public email-password accounts authenticate through the additive
  `authentication_identities` record.
- `directory_principals` are tenant-RLS-protected and may represent an AD user
  with no email and no Jupiter login yet.
- AD passwords are never accepted or stored by these APIs.
- Audit events include public-account creation, verification/resend,
  application transitions and provisioning, but never raw tokens, passwords or
  application content. Review notes are stored for the applicant but are not
  copied into audit metadata.
