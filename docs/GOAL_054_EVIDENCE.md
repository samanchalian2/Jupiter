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
- Preview/run history records classifications and counts, policy/mapping
  versions and final `SUCCEEDED`/`PARTIAL` state. A conflict is persisted with
  a safe correction message; safe items continue in the same run and no
  identity is silently merged.
- Directory role mappings permit only REQUESTER, EXPERT and SUPERVISOR.
  The apply routine removes only grants it previously created, preserving
  manual roles and always leaving ORG_ADMIN/ORG_OWNER manual.

## Security and lifecycle

- Pairing material is one-time, organization-bound and short-lived. Revoke
  clears device identity and unused pairing material. Raw pairing codes and
  device tokens are excluded from audit metadata.
- Users without email remain supported through the existing DirectoryPrincipal
  model. `objectGUID` is the external identity key; changed email/account name
  updates the same principal. A conflicting email is a safe conflict, not a
  merge.

## Verification completed

- `pnpm --filter @jupiter/api migrate` applied migrations 054, 054a, 054b,
  054c and 054d in the local environment.
- API and Web typechecks passed.
- API integration suite passed: 26 files, 96 tests; Web suite passed: 2 files,
  11 tests. Coverage includes pairing
  and revoke, no-email principal, rotating credential, role mapping, Sync Now
  idempotency and a partial conflict run that applies the safe record once.
- API and Web production builds passed. `git diff --check` passed.
- The updated Persian `organization-directory` article was published through
  the local Product Help draft/publish workflow; the repository seed remains
  initial-publication-only as required.

## Browser acceptance status

The local application successfully authenticated at the default desktop
viewport using the approved local credential. After the local API restart, the
in-app Browser URL policy blocked the required reload; therefore acceptance at
375/768/1024/1440 remains unverified and is not claimed. No credential was
written to files, logs, audit metadata or this Evidence.

## Known limitations

- Connector auto-update, inbound LDAP, password sync, writeback, SSO and
  device management remain explicitly out of scope.
