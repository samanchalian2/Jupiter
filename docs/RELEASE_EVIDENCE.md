# Release-gate evidence

## Locally proven

- Type checking, linting, unit/integration tests and production builds run via
  `pnpm verify:release`.
- Liveness and database readiness are available at `/api/v1/health` and
  `/api/v1/health/ready`.
- Request security headers, per-client rate limiting, request IDs and
  structured request timing logs are implemented and covered by API tests.
- The load smoke runner checks concurrent liveness/readiness requests without
  requiring credentials or tenant data.
- The web shell is RTL, keyboard-focus-visible and uses semantic form labels;
  browser checks must still be recorded per release in staging.

## Local execution record — 2026-08-11

- `pnpm verify:release` passed: lint, typecheck, 28 API tests and both
  production builds.
- Runtime health/readiness both returned HTTP 200. The liveness response
  included a request ID, `X-Frame-Options: DENY`, and
  `X-Content-Type-Options: nosniff`.
- `pnpm load:smoke` completed 40 concurrent local health/readiness requests
  with zero failures.
- An isolated PostgreSQL restore drill restored 14 schema migrations; a demo
  tenant saw three tickets while a separate tenant context saw zero.
- Local browser smoke covered login, report navigation and knowledge search;
  visible keyboard focus styles and labelled form controls were inspected.

## Requires a staging environment

The repository has no deployed staging ingress, managed backup location, image
registry, secret-management identity, or Docker runtime in scope. Therefore
image validation, staged deployment, edge TLS/CSP verification,
production-like load baseline, managed-backup restore and full browser E2E
evidence remain release gates, not completed claims. Use the staging checklist
and restore drill documents to record those results.
