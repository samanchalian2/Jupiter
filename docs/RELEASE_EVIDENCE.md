# Release-gate evidence

## Locally proven

- Type checking, linting, unit/integration tests and production builds run via
  `pnpm verify:release`.
- Liveness and database readiness are available at `/api/v1/health` and
  `/api/v1/health/ready`.
- Request security headers, a deploy-time Content-Security-Policy, per-client rate limiting, request IDs and
  structured request timing logs are implemented and covered by API tests.
- The load smoke runner checks concurrent liveness/readiness requests without
  requiring credentials or tenant data.
- The web shell is RTL, keyboard-focus-visible and uses semantic form labels;
  browser checks must still be recorded per release in staging.

## Local execution record — 2026-08-31

- `pnpm verify:release` passed: lint, typecheck, 82 API tests, 11 web tests
  and both production builds.
- `pnpm load:smoke` completed 40 concurrent local health/readiness requests
  with zero failures at 268 requests per second on a fresh API start.
- An isolated rehearsal applied the upgrade forward from migrations `001`–`032`
  to `045a`; the outcome had 48 migration records, six Product Help articles
  and five roles. The temporary database was removed.
- Authenticated Persian RTL acceptance of public onboarding, organization
  administration, platform controls, Product Help and the directory contextual
  trigger passed at 375/768/1024/1440 px with no document-level overflow.
- A mobile platform tab strip was replaced with a labelled selector below
  700px, eliminating its clipped horizontal navigation in the final pass.
- The notification center now opens the canonical `/notifications/events`
  stream endpoint; a fresh authenticated browser load recorded no 404.

## Requires a staging environment

The repository has no deployed staging ingress, managed backup location, image
registry, secret-management identity, or Docker runtime in scope. Therefore
image validation, staged deployment, edge TLS/CSP verification,
production-like load baseline, managed-backup restore and full browser E2E
evidence remain release gates, not completed claims. Use the staging checklist
and restore drill documents to record those results.
