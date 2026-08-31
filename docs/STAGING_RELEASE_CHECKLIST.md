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
- [ ] Public organization onboarding is checked at 375/768/1024/1440 px:
      account verification, application submission and status do not disclose
      another applicant's data.
- [ ] Organization administration is checked at 375/768/1024/1440 px:
      owner-only commercial summary, directory pairing/sync state, AI setting
      guidance and compact contextual Help controls are legible in RTL.
- [ ] Platform controls are checked at 375/768/1024/1440 px: application
      review, commercial/Assist policy, appearance presets and Product Help
      authoring are Platform Admin-only.
- [ ] Help Center/export is checked for anonymous, organization-owner and
      Platform Admin audiences; draft/unpublished content and unauthorized
      slugs remain non-disclosing.
- [ ] Directory connector deployment is a Windows service with outbound HTTPS
      only. Pairing is short-lived, device identity is revocable and no AD
      credential appears in cloud logs, configuration or support evidence.
- [ ] A delivered commercial Smart Action, provider retry/diagnostic and
      Jupiter Assist acceptance are reconciled: only the delivered action and
      permitted acceptance consume the appropriate tenant allowance/capacity.
- [ ] `pnpm load:smoke` succeeds against staging at the agreed concurrency.
- [ ] A restore drill has passed for the current schema and its evidence is
      linked to this release.
- [ ] Rollback owner, alert channel and maintenance window are recorded.
