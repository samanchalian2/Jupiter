# GOAL-067 — Safe Organization Deletion

## Outcome

Platform Admin can remove an organization from service through reversible
«حذف امن». This is archival, not a destructive database cascade: tickets,
memberships, commercial records and audit history remain intact. DEC-035 owns
this lifecycle decision.

## Safety and authorization

- Platform Admin authorization is checked server-side for archive and restore.
- Only `ORGANIZATION` workspaces may be archived; personal workspaces are
  excluded.
- The tenant must first be `SUSPENDED`. `ACTIVE` and `SETUP` cannot jump to
  `ARCHIVED`.
- The request requires the exact slug, a 10–500 character reason and a valid
  idempotency key. The UI additionally requires an explicit impact checkbox.
- Archive sets actor, timestamp and reason and writes immutable transition plus
  general Audit records.
- Tenant actor resolution accepts only `SETUP` or `ACTIVE`; existing tokens
  cannot use suspended or archived tenants. Login/refresh omits archived
  memberships.
- Restore requires a fresh exact-slug/reason/idempotency confirmation and
  returns only to `SUSPENDED`. Activation remains a separate explicit action.

## Implementation

- Migration `062_safe_organization_archival.sql` adds the `archived` lifecycle,
  archive projection fields and idempotent `organization_archive_transitions`.
- Platform APIs:
  - `POST /api/v1/admin/platform/organizations/:id/archive`
  - `POST /api/v1/admin/platform/organizations/:id/restore`
- The Persian Platform organization list exposes «حذف امن» only for suspended
  organizations and «بازیابی» only for archived organizations. The confirmation
  dialog explains data retention and access impact.
- Product Help `platform-organization-applications` documents the workflow.

## Verification

- Migration applied to the existing local database successfully.
- API integration covers authorization, prior suspension, exact slug, reason
  bounds, idempotent replay, immediate tenant denial, transition/audit history,
  restore-to-suspended and explicit reactivation.
- Web regression coverage checks all layered confirmation controls.
- Final test/build/migration-rehearsal and authenticated browser results are
  recorded before acceptance and deployment.
- Clean forward rehearsal applied all 73 migrations through
  `062_safe_organization_archival.sql` to an isolated temporary database; the
  database was then disconnected and dropped.
- API: 33 files / 146 tests passed.
- Web: 7 files / 21 tests passed.
- API/Web typechecks and production builds passed; only the pre-existing Vite
  chunk-size advisory remained.

## Deployment and authenticated browser acceptance

- Commits `c24e73d` and `1b1b667` were pushed to `main`. Preview and the
  canonical publication now run the corrected build; the main release is
  `/srv/jupiter/releases/1b1b667-safe-org-archive`.
- Protected Jupiter-only database backups were created before promotion.
  Migration `062_safe_organization_archival.sql` is present exactly once in
  each target migration ledger. Runtime Product Help revised the existing
  organization-administration article without exposing credentials.
- Final service checks returned HTTP 200 for Preview Web, health and readiness,
  and for canonical Jupiter Web/health. The separately hosted Arandi service
  remained active and returned HTTP 200; its files, service and database were
  not changed.
- Authenticated canonical acceptance used a temporary `SUSPENDED`,
  membership-free organization with slug `goal067-acceptance`. The row exposed
  «فعال‌سازی» and «حذف امن» while the personal-workspace row exposed no delete
  control.
- At the exercised 648px viewport the confirmation dialog rendered Persian
  RTL, displayed the exact slug, required a 10–500 character reason and an
  explicit impact checkbox, and kept «حذف امن سازمان» disabled before those
  conditions were satisfied. Document `clientWidth` and `scrollWidth` were
  both 633px while the dialog was open, proving no document-level horizontal
  overflow.
- Acceptance deliberately closed the dialog without submitting, so no tenant
  data was archived. The temporary organization was then removed through a
  narrowly scoped cleanup that required zero memberships; a browser reload
  confirmed the slug absent and `clientWidth == scrollWidth` (648px). Normal
  Help runtime content remains published.

## Boundaries

Physical purge, retention automation, legal hold and backup destruction are not
implemented. They require a separate approved design. GOAL-059 remains blocked
by its independent staging-infrastructure gates.
