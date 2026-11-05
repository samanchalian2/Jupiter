# Authorized Ramin workspace cleanup

Owner explicitly clarified: remove every Ramin workspace without sahra. Scope
limited to this account's memberships, not all platform workspaces. Read-only
plan found ramin-co,ramin5-co and personal workspace had no sahra membership and
no other member. Current tenant org-40f6e0e1-32fe-43a0-9a75-20d00d05ff18 protected.

Executed atomic guarded transaction through existing OrganizationService
setOrganizationStatus(suspended) and archiveWorkspace using actual active Platform
Admin actor, explicit slugs, reason and fresh UUID keys. Both status changes and
archives Audited. Organization/user rows locked, contexts scoped per Audit type;
no RLS, FK, trigger or other application's DB changed. No physical deletion,
password reset or role change. Full historical records retained for restoration.

Readback confirms all3 archived and protected tenant status unchanged. Actual
owner login201 afterward returns exactly1 workspace, protected tenant with
ORG_ADMIN/ORG_OWNER. This also proves automatic personal provisioning did not
reintroduce the archived workspace. Test session logout201 and in-memory tokens
cleared. Temporary server script removed. No credentials stored in evidence.

Existing open browser session may show stale workspace choices until logout/
login. No extra suspension or tenant activation performed. GitHub push deliberately
deferred by user; local records remain committed. No new Goal started.
