# GOAL-055 — Organization Setup Wizard Completeness

## Gap inventory

The prior setup screen stored only a confirmation timestamp and treated
organization settings plus one category as a client-facing checklist. It had
no versioned step state, shared readiness evaluator, optional-service summary,
safe resume model or usable setup-time routes to the existing administration
workflows.

## Implemented model

- Migration `055_organization_setup_wizard.sql` upgrades tenant-scoped progress
  with version, current step, wizard version, explicit step states and audit
  timestamps. `contact_phone` is optional organization-setting metadata;
  `contact_name` is deliberately not stored.
- The server is the source of truth for the ten-step Wizard. Profile completion
  requires only valid organization display name and IANA timezone. Ticket
  Configuration means at least one Ticket Category. Teams, SLA, extra users,
  Directory, AI, Assist and appearance remain optional.
- Go-Live requires a `SETUP` organization, active `ORG_OWNER`, valid profile,
  at least one Ticket Category and no fatal configuration inconsistency. SLA
  and all optional services are warnings, not blockers.
- Owner operational access is centralized in `OrganizationAccessPolicy`; it
  recognizes owner/admin operators without creating an admin role or promoting
  legacy members. Go-Live remains owner-only.
- `ORGANIZATION_SETUP_*` audits are minimal and never include credentials or
  connector/AI secret material. Activation notification is emitted only after
  the atomic transaction commits.

## Verification completed

- Migration 055 applied locally.
- Product Help seed published `organization-setup-wizard` locally: one new
  article, six existing articles unchanged.
- API suite: 26 files, 99 tests passed. It covers server-backed progress,
  required-step skip denial, stale version conflict, optional warning policy,
  owner-only/idempotent Go-Live and one activation audit.
- API/Web typechecks and Web test suite (2 files, 11 tests) passed.
- API and Web production builds passed.

## Authenticated browser acceptance (2026-09-03)

- A temporary `SETUP` organization was created solely for GOAL-055 acceptance.
  The existing local platform administrator received an active `ORG_OWNER` and
  `ORG_ADMIN` membership only in that temporary organization. The grant and
  revocation were audited as `acceptance_test.owner_role_granted` and
  `acceptance_test.owner_role_revoked`; neither audit metadata nor this evidence
  contains credentials.
- The authenticated owner journey saved the required profile, confirmed that
  the missing Ticket Category alone blocked Go-Live, created one temporary
  Ticket Category through Ticket Configuration, and activated the organization.
  Teams, SLA, extra users, Directory, AI, Assist and branding remained visible
  warnings and did not block activation. The compact Persian HelpTrigger opened
  the published setup guidance.
- The authenticated active dashboard was checked in RTL at requested viewport
  widths 375, 768, 1024 and 1440. At every width the measured document
  `scrollWidth` equalled `clientWidth` (360/360, 753/753, 1024/1024 and
  1440/1440 respectively); no document-level horizontal overflow occurred.
  The compact mobile menu was present at 375 and 768, while desktop navigation
  appeared at 1024 and 1440.
- Restoration completed in the same local database transaction: the temporary
  membership and role grants were removed, the temporary organization and its
  profile/category/progress data were deleted, and verification returned zero
  organizations with the acceptance slug. Both grant and revoke audit events
  remain. The temporary browser viewport override was reset. Published Product
  Help remains intentionally available as product data.

## Final quality gate

- `git diff --check` passed after the acceptance evidence was recorded.

## Known limitations

- Organization locale is not introduced because the current tenant model has no
  supported locale field; Persian remains the product default.
- No purchase, paid-service provisioning, Directory implementation duplication,
  custom workflow engine or `ACTIVE → SETUP` rollback is included.
