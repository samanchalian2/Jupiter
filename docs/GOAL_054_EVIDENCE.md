# GOAL-054 — Directory Connector Operational Completeness

## Implemented scope

- Audit of the existing connector found pairing, rotating device identity,
  tenant-scoped preview/apply and Directory-only role grants already present.
  GOAL-054 preserves those boundaries and adds operational scheduling, health,
  scope/catalog/mapping records, command/run/conflict history and UI.
- Connector health is derived from telemetry: HEALTHY below 5 minutes,
  DEGRADED from 5–15 minutes, OFFLINE afterwards, NEVER_CONNECTED before first
  heartbeat and DISABLED after revoke. The worker records a transition only
  when it changes and only notifies active owner/admin recipients for DEGRADED
  and OFFLINE.
- Heartbeat is organization- and connector-bound through the rotating hashed
  device identity. It carries only version, service status, policy version and
  a pending command reference. Full scope/mapping policy is fetched only after
  the version changes.
- The periodic mode is `INCREMENTAL_SNAPSHOT` every 15 minutes; it is not
  represented as AD delta tracking. A daily `FULL` reconciliation is queued
  for a paired connector and is submitted in bounded batches. Only a complete
  FULL absence is lifecycle-significant:
  selected scopes use seven-day OUT_OF_SCOPE grace; Entire Directory suspends
  the absent principal without hard deletion.
- The ordinary Preview API accepts only `INCREMENTAL_SNAPSHOT`; only the
  batch-complete reconciliation endpoint can create a FULL absence run.
- A Full reconciliation also refuses absence processing if its recorded Scope
  Policy version no longer matches the current policy at completion; it ends
  as `PARTIAL/FULL_RECONCILIATION_POLICY_CHANGED` with no lifecycle action.
- Preview/run history records classifications and counts, policy/mapping
  versions and final `SUCCEEDED`/`PARTIAL` state. A conflict is persisted with
  a safe correction message; safe items continue in the same run and no
  identity is silently merged.
- Directory role mappings permit only REQUESTER, EXPERT and SUPERVISOR.
  The apply routine removes only grants it previously created, preserving
  manual roles and always leaving ORG_ADMIN/ORG_OWNER manual.

## Security and lifecycle

- Pairing material is one-time, organization-bound and short-lived. Revoke
  clears device identity and unused pairing material. `DIRECTORY_CONNECTOR_PAIRED`
  and `DIRECTORY_CONNECTOR_REVOKED` audit events identify the user who issued
  pairing or revoke; raw pairing codes and device tokens are excluded from
  audit metadata.
- Users without email remain supported through the existing DirectoryPrincipal
  model. `objectGUID` is the external identity key; changed email/account name
  updates the same principal. A conflicting email is a safe conflict, not a
  merge.

## Re-pair remediation

- `POST /directory/connectors/:id/re-pair` is an explicit owner/admin-only,
  tenant-scoped operation for a `REVOKED` Connector. It keeps the same
  Connector ID, consumes every previous unused pairing code and issues a new
  hash-only code with the normal 15-minute expiry. Ordinary pairing issuance
  still rejects revoked records.
- Successful use of the re-pair code creates a new device ID and token and
  returns the same Connector to `PAIRED`. The revoked device ID/token, stale
  pre-revoke codes, superseded re-pair codes and a reused new code all fail.
  `DIRECTORY_CONNECTOR_REPAIR_REQUESTED` is durable; `DIRECTORY_CONNECTOR_PAIRED`
  records the successful new identity without storing raw code, token, hash or
  AD secret.

## Verification completed

- `pnpm --filter @jupiter/api migrate` applied migrations 054, 054a, 054b,
  054c and 054d in the local environment.
- API and Web typechecks passed.
- API integration suite passed: 26 files, 98 tests; Web suite passed: 2 files,
  11 tests. Coverage includes pairing
  and revoke, no-email principal, rotating credential, role mapping, Sync Now
  idempotency, rejection of a direct `FULL` preview, pairing/revoke audit
  events, a policy-version change during Full reconciliation that performs no
  absence lifecycle action, and a partial conflict run that applies the safe
  record once.
- Re-pair coverage proves the authenticated initial connector, immediate old
  credential rejection after revoke, stale-code rejection, cross-tenant denial,
  same-ID explicit re-pair, single-use replacement code, replacement device
  authentication and continued old-credential denial.
- API and Web production builds passed. `git diff --check` passed.
- The scope picker visibly includes each discovered OU/group's last discovery
  time and generation, so an administrator can identify stale selections.
- The updated Persian `organization-directory` article was published through
  the local Product Help draft/publish workflow. The local database confirms
  its published revision 2 is visible to `ORG_ADMIN` and `ORG_OWNER`; an
  unauthenticated public request is intentionally not an allowed audience.
  The repository seed remains initial-publication-only as required.

## Browser acceptance status

Authenticated local acceptance passed on `/o/jupiter-demo/admin/directory`.
At 375, 768, 1024 and 1440 pixels the Persian RTL Directory page rendered its
connector, operational, scope/mapping and run-history sections; the document
had no horizontal overflow at any tested width. At 375 pixels the compact
mobile header exposed «بازکردن منو» and the management section selector while
the Directory controls remained reachable. The viewport override was reset
after testing. No credential was written to files, logs, audit metadata or this
Evidence.

## Known limitations

- Connector auto-update, inbound LDAP, password sync, writeback, SSO and
  device management remain explicitly out of scope.
