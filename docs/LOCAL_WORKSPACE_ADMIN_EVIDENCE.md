# Owner-requested local workspace administration — 2026-10-17

## Scope and decision

The owner explicitly requested cleanup of unnecessary workspaces and an admin
management/removal mechanism. DEC-039 preserves reversible removal and all
shared identities. Existing organization-only archive/restore endpoints remain
unchanged in scope; new `POST /admin/platform/workspaces/{id}/archive|restore`
support both workspace types with independent Platform Admin verification.
There is no physical cascade purge and no mutation of Preview/canonical hosts.

## Safety and execution

- Read-only inventory found 35 local organization workspaces. `jupiter-demo`
  had 4 memberships/17 tickets and was retained for development/acceptance.
- The other 34, including legacy fixture workspaces, were explicitly enumerated
  in dry-run output before apply. The local-only utility resolves the existing
  active administrator, validates retained slugs, then calls supported status
  and archive services. It cannot target a non-loopback DB or production mode.
- Result: 34 archived, one active (`jupiter-demo`), zero physical row deletions,
  zero user deletions. Tickets, grants/history and configuration remain in the
  archived tenants; they are not reassigned to another tenant. Each transition
  is audited with the real actor and an owner-authorized cleanup reason.
- Recovery is available from the archive filter and returns to suspended only.
  Activating again is separate and explicit. This cleanup does not free storage
  by deleting retained records; it removes them from normal operational use.

## UI and security acceptance

- Admin has type filters for Personal/Organization and existing lifecycle
  filters. Default list omits archived entries; archive filter is explicit.
- Exact slug + 10–500-character reason + impact acknowledgement + idempotency
  remain required. Setup can be suspended, but cannot bypass canonical Go-Live.
- Personal acceptance test verifies non-admin denial, active-before-suspension
  denial, wrong-slug denial, legacy organization endpoint denial, idempotent
  removal, tenant-access denial, no automatic reactivation during provisioning,
  suspended-only restore, preserved owner user, and Audit transition history.
- Authenticated local browser showed exactly one default result and 34 results
  in the archive filter, with a visible recover-to-suspended control. No browser
  mutation was submitted during this read-only verification.
- No data/organization/workspace at an external provider was deleted. No main
  host, Preview host or co-hosted legal-case application was modified.

## Execution utility

2026-10-18 regression follow-up: five enumerated retained organization fixtures
were suspended/archived via the same supported local-only administrative path.
No physical rows or accounts were deleted. The final dry-run has zero targets;
`jupiter-demo` remains the sole non-archived workspace. Neither target host nor
external provider organizations/workspaces were changed.

Final checkpoint gate passes: 147 API tests, 28 Web tests, 105 Hub tests,
all builds/lint/typechecks, 78-migration rehearsal and `git diff --check`.
Serial API file execution prevents shared singleton fixture races; in-test
parallel acceptance/reservation coverage is preserved.

`apps/api/scripts/cleanup-local-workspaces.ts` defaults to dry-run and requires
`--local-only --user=<existing-admin> --keep=<slug>`. `--apply` is explicit and
must not be scheduled as an automatic cleanup task. It is an administrative
tool, not part of the user lifecycle or a cross-tenant deletion API.
