# Default IT-services category

Owner requested a safe default rather than a manual onboarding blocker. DEC-069
implements tenant-scoped helper during new SETUP provisioning and authorized
owner/admin Wizard reconciliation. Lock organization row, check empty catalog,
insert IT_SERVICES / خدمات فناوری اطلاعات, append real-actor Audit. Unique key
and transaction prevent duplicate creation. Preserve custom catalogs and ignore
active/personal/archived workspaces. Existing category entity, no migration.

API build/typecheck pass; isolated rehearsal85 and52 tests pass including full
organization application37, onboarding8, defaults5 and scoped regression2.
Prior stale optimistic-version assertion updated to deliberately obsolete first
version, preserving conflict test rather than removing it. Cleanup DB removed,
shared roles unchanged. Existing failure/rollback/Owner-only cases retained.

Main default helper/provisioning/setup modules deployed; backup existing modules
at /srv/jupiter/backups/default-category-20261105-before.tar.gz. API restart active.
Affected owner authenticated Wizard reads twice200/readytrue/blockers[]; catalog
contains exactly1 IT_SERVICES category. Test session revoked/tokens cleared.
Organization remains setup, no Go-Live, no role/password changes. User must choose
final activation. GitHub push deferred by owner. Browser visual not claimed here.
