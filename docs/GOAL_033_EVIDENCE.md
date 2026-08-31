# GOAL-033 Evidence — Platform review and tenant provisioning

Date: 2026-08-30

## Delivered

- Migration 034 adds the additive `setup` organization lifecycle, the
  `ORG_OWNER` role, review fields and a one-to-one provisioned organization
  reference on `OrganizationApplication`. Existing `active` and `suspended`
  organizations remain unchanged.
- Platform Admin routes and workspace controls support `SUBMITTED` →
  `UNDER_REVIEW`, required-note `NEEDS_INFORMATION`/`REJECTED`, and approval.
- Approval is one database transaction: it reserves the Platform Admin-selected
  slug, creates the organization in `setup`, adds the applicant as an active
  member with `ORG_OWNER` plus `ORG_ADMIN`, records minimal audits, and changes
  the application to `APPROVED`.
- Retrying the same command (or an already provisioned approval) returns the
  existing result. A conflicting slug rolls back with no partial tenant,
  membership, role or approval.
- Applicant status now presents a platform review note and, after approval,
  the allocated organization slug. Persian guidance and the API contract are
  updated.

## Validation

- Migration `034_platform_application_review_and_provisioning.sql` applied
  locally.
- API integration suite: 24 files / 61 tests passed. The approval scenario
  proves Platform Admin authorization, lifecycle transition legality,
  `NEEDS_INFORMATION` resubmission, slug-conflict rollback, idempotent
  approval, `setup` provisioning, initial owner roles and no automatic owner
  promotion for an existing `ORG_ADMIN`.
- API and Web TypeScript checks and production build passed.
- Authenticated local Platform Admin browser acceptance passed. The
  organization-application review queue is visible at 375, 768, 1024 and
  1440px with no document-level horizontal overflow. Native tab controls now
  use the tab role, a roving tab stop, `Enter`/`Space` activation and arrow-key
  navigation; keyboard checks switched between «سازمان‌ها» and
  «درخواست‌های سازمان» successfully.

## Persian Help impact

`PUBLIC_ORGANIZATION_ONBOARDING.md` now explains review, assigned organization
slug and the `راه‌اندازی` state. Runtime product Help remains explicitly
deferred to GOAL-046.

## Deferred scope

`/o/{slug}` tenant routing, resumed setup and activation are GOAL-034. No
existing organization was moved to `setup`, and no existing `ORG_ADMIN` was
promoted to `ORG_OWNER`.
