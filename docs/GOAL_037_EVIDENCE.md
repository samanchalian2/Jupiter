# GOAL-037 — Directory sync lifecycle evidence

Date: 2026-08-30

## External validation

The supplied domain controller was reachable on LDAP 389 and LDAPS 636. The
service account authenticated successfully over LDAPS. The validated scope is
`OU=Jupiter,OU=PNS,DC=PNS,DC=local`. No directory password was written to the
repository, application configuration, database, audit log or this document.

## Delivered boundary

- Migration 038 adds RLS-protected sync runs, source-tracked directory role
  grants, connector version/heartbeat/sync fields and replay-supporting state.
- A preview classifies `CREATE`, `UPDATE`, `SUSPEND`, `OUT_OF_SCOPE` and
  `UNCHANGED`; apply is idempotent. Disabled users suspend immediately and a
  full scope exit receives a seven-day grace before suspension.
- Identity uses immutable `externalObjectId`; email is optional. Only
  REQUESTER, EXPERT and SUPERVISOR can be source-managed; owner/admin remain
  manual. No hard delete, AD authentication or automatic department creation
  exists.
- `apps/directory-connector/` contains the outbound-only PowerShell/WinSW
  service scaffold, DPAPI local configuration and repair-oriented installer.

## Verification

- Migration 038 applied locally.
- API TypeScript check passed.
- API tests passed: 24 files, 65 tests. The added integration test covers token
  rotation/replay rejection, preview/apply, tenant role provisioning and a
  directory principal without email.

## Persian operator guidance

Create a connector, issue its temporary pairing code and install the local
service. Review preview counts before apply. AD passwords belong only to the
local Windows service configuration.
