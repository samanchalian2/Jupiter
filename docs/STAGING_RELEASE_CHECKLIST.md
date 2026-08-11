# Jupiter staging release checklist

Complete this checklist in the staging environment for each release candidate.

- [ ] Images are built from the tagged commit and deployment secrets are
      injected by the environment.
- [ ] Migrations applied once and `schema_migrations` matches the release.
- [ ] Health and readiness return HTTP 200 through the staging ingress.
- [ ] Edge responses contain the configured Content-Security-Policy and other
      browser-security headers; HTTPS/HSTS is enforced by the ingress.
- [ ] Request IDs and structured request logs are visible without tenant
      content or secrets.
- [ ] A requester creates a ticket, staff responds, and an organization admin
      performs an audited setting change.
- [ ] Two separate organizations are checked for RLS isolation.
- [ ] AI is disabled/enabled only by platform admin, an AI result requires
      human confirmation, and provider failure leaves manual ticket work open.
- [ ] Attachment access is checked for both authorized and unauthorized users.
- [ ] Browser E2E smoke covers sign-in, dashboard, ticket list, reporting,
      knowledge search, and keyboard navigation/focus visibility.
- [ ] `pnpm load:smoke` succeeds against staging at the agreed concurrency.
- [ ] A restore drill has passed for the current schema and its evidence is
      linked to this release.
- [ ] Rollback owner, alert channel and maintenance window are recorded.
