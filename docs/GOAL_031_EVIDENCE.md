# GOAL-031 Evidence — Additive identity and organization application foundation

**Date:** 2026-08-29  
**Migration:** `033_public_accounts_and_organization_applications.sql`

## Delivered foundation

- Existing global `users`, `memberships`, email/username login and refresh
  sessions remain compatible.
- New public accounts use an additive `authentication_identities` password
  record; their legacy `users.password_hash` remains null rather than being
  repurposed.
- `directory_principals` are tenant-RLS-protected and may represent an
  Active Directory user without email or a Jupiter login.
- Verification tokens are SHA-256 hashes, single-use and expire after 24 hours.
  A delivery record never contains the raw token. The delivery abstraction uses
  a safe `PENDING_CONFIGURATION` default until GOAL-032 adds a deployment
  adapter; test delivery is injected only by automated tests.
- Organization applications are pre-tenant, applicant-owned records with the
  exact approved status constraint and idempotent transition history.

## API contract

See [Organization Application API](ORGANIZATION_APPLICATION_API.md) for public
account, verification and applicant application endpoints. Platform review,
approval and tenant provisioning are deliberately not included.

## Validation

- Migration 033 applied successfully to the authorized local PostgreSQL
  database.
- `pnpm --filter @jupiter/api typecheck` passed.
- `pnpm --filter @jupiter/api test` passed: 24 files and 60 tests.
- Root `pnpm build` and `pnpm typecheck` passed for API and Web.
- The new integration suite proves legacy login, additive identity login,
  password/token non-disclosure, verification-gated submit, replay denial,
  exact status constraint, idempotent transition, applicant isolation and
  Directory Principal RLS isolation.

## Persian Help impact

No public browser screen is delivered in this Goal. The user-facing Persian
registration, verification and application guidance belongs to GOAL-032. This
Goal records the secure API behavior and terminology in Persian-ready product
documentation without publishing a runtime Help article before the Help domain
exists.

## Recommended checkpoint

`feat(accounts): add public identity and application foundation`

Recommended push point: after API build, documentation consistency and diff
review pass.
