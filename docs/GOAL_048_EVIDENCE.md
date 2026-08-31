# GOAL-048 — Cross-domain hardening, migration rehearsal and final acceptance

## Local forward-migration rehearsal — 2026-08-31

An isolated PostgreSQL database was prepared at the pre-upgrade legacy
baseline: migrations `001` through `032` were applied and recorded. The
cluster-level `jupiter_app` service role was retained as an infrastructure
prerequisite; its role creation in migration `001` was not re-executed inside
the same PostgreSQL cluster.

The repository migration runner then applied migrations `033` through `045a`
without error. The resulting database contained 48 migration records, six
seeded Product Help articles and five roles. The temporary database was
terminated and dropped after verification; no `jupiter_goal048_*` database
remains.

## Automated quality gates

- `pnpm verify:release` passed: API/Web lint and typecheck, 26 API test files
  with 82 tests, 2 web test files with 11 tests, and both production builds.
- `pnpm load:smoke` passed locally: 40 concurrent health/readiness requests,
  zero failures, 268 requests per second on the freshly built API.
- `git diff --check` passed. The only output was existing CRLF normalization
  warnings; no whitespace error was reported.
- A fresh API start was exercised after the production build. It exposed an
  Appearance module dependency omission that typechecking could not detect;
  importing `AuthModule` in `AppearanceModule` resolves the controller's
  `AuthService` dependency. The API then started successfully and served the
  fresh local acceptance run.
- Fresh browser acceptance also exposed a web/API notification-stream path
  mismatch (`/notifications/stream` versus the API's `/notifications/events`).
  The web client now uses the controller's canonical event route; a fresh
  authenticated page load recorded no notification 404/error.

## Authorization and non-disclosure matrix

The integration suite proves the Master domains' critical boundaries:

| Domain | Evidence |
| --- | --- |
| Identity and public onboarding | additive legacy-login compatibility, verification expiry/replay protection, applicant ownership and no-email directory principal isolation |
| Tenant routing and ownership | canonical route membership resolution, explicit-only legacy owner assignment and no implicit ORG_ADMIN promotion |
| Directory connector | tenant-bound single-use pairing, rotating/revocable device credentials and tenant-bound lifecycle application |
| Commercial AI | platform-managed entitlement capability resolution, idempotent allowance operations, provider operations not billable, and one-time delivered Smart Action settlement |
| Jupiter Assist | no tenant membership for Jupiter agents; scoped, expiring, revocable and restricted-ticket access; independent case lifecycle and one-time acceptance capacity settlement |
| Appearance | Platform Admin-only, auditable allowlisted presets with no arbitrary code, remote logo or tenant theme override |
| Product Help | audience-restricted published-only reads; drafts, unpublished and unauthorized slugs are non-disclosing; Platform Admin-only authoring/export |

The named coverage is in `apps/api/test/organization-application.integration.spec.ts`,
`apps/api/test/product-help.integration.spec.ts`,
`apps/api/test/ai-gateway.integration.spec.ts`,
`apps/api/test/organization-branding.integration.spec.ts` and
`apps/api/test/ai-settings.security.spec.ts`.

## Authenticated Persian RTL responsive acceptance

The fresh local preview was authenticated as a Platform Admin/organization
administrator and was inspected in Persian RTL at 375, 768, 1024 and 1440 px.
The public account-registration/onboarding view, directory administration,
platform controls and Help Center all had no document-level horizontal
overflow. The directory Help trigger opened the correct published article, and
the Platform Admin Help editor, revision list and export controls were visible.

Visual review identified a mobile platform-tab strip that exposed a clipped
horizontal row at 375 px. It was replaced with a compact labelled native select
only below 700 px; desktop continues to use the accessible keyboard tablist.
The mobile selector opens the Product Help editor correctly and retains no
overflow. This is a presentation-only change: no API, authorization, data or
commercial behavior changed.

## Remaining release gates

No staging ingress, registry, secret-manager identity, managed backup target
or deployed staging environment is available in this workspace. Consequently,
the checklist items for HTTPS/HSTS, ingress security headers, staged image and
migration execution, managed restore drill and authenticated staging browser
smoke remain release gates. They are not product defects and must be completed
against a designated staging environment before production release.
