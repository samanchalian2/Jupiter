# GOAL-032 Evidence — Public organization application experience

Date: 2026-08-29

## Delivered

- Added a quiet, RTL public registration and sign-in entry. The existing login
  remains intact and now offers a secondary route for organization applicants.
- Added email-verification landing, applicant draft/resume/update/submission
  and cancellation flow. A signed-in account without a tenant membership sees
  this applicant workspace rather than a tenant shell or a dead-end message.
- Added `GET /public/accounts/status`, authenticated local-test inbox access,
  `LOCAL_TEST`, `WEBHOOK`, and safe `DISABLED` delivery modes. Production does
  not fall back to token display or token logging.
- Added Persian applicant guidance in `PUBLIC_ORGANIZATION_ONBOARDING.md`.

## Validation

- API integration suite: 24 files / 60 tests passed, including verification
  status before and after confirmation, legacy authentication compatibility,
  token replay denial, applicant isolation and exact lifecycle status checks.
- Web suite: 2 files / 11 tests passed.
- API/Web TypeScript checks and root production build passed.
- Browser inspection at 375, 768, 1024 and 1440px confirmed the public
  registration surface has no horizontal document overflow. The sign-in entry
  and applicant-entry action were present. No personal data or external email
  delivery was used for browser validation.

## Operational notes

- Configure `PUBLIC_ACCOUNT_VERIFICATION_DELIVERY=webhook` and an HTTPS
  `PUBLIC_ACCOUNT_VERIFICATION_WEBHOOK_URL` for production delivery.
- `LOCAL_TEST` is intentionally limited to non-production. Its test retrieval
  route requires the matching signed-in account and is not available when
  `NODE_ENV=production`.
- GOAL-033 remains responsible for platform review, approval, tenant
  provisioning, slug allocation and owner assignment.
