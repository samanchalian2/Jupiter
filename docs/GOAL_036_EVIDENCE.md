# GOAL-036 Evidence — Directory connector domain, pairing and control plane

Date: 2026-08-30

## Delivered

- Migration `037_directory_connector_control_plane.sql` adds
  `directory_connectors` and `directory_connector_pairings`, both protected by
  organization RLS and composite tenant integrity.
- Organization owners and administrators can create a connector, issue one
  short-lived pairing code, inspect safe status and explicitly revoke the
  device identity. Issuing a later code invalidates an earlier unused code.
- The connector pairing exchange atomically consumes a 15-minute code and
  returns a device UUID and one-time device token. Neither raw value is stored
  or written to audit metadata.
- The Persian RTL organization-administration workspace now includes a compact
  «اتصال دایرکتوری» page. It explains that pairing is available now and user
  synchronization is deliberately deferred.
- `docs/DIRECTORY_CONNECTOR_VALIDATION.md` records the Windows runtime, secure
  local storage and request-proof candidates required by DEC-023. It does not
  prematurely select Node/WinSW, DPAPI or a request protocol.

## Security and scope

- The cloud control plane has no AD/LDAP bind/password field or storage.
- Pairing material and device credentials are SHA-256 hashed at rest; replay,
  expiration and revocation are rejected by the service.
- The planned on-premises service remains outbound HTTPS only. No Windows
  service, AD/LDAP client, directory object transfer or synchronization job is
  present in this Goal.

## Validation

- Migration 037 applied locally.
- API suite: 24 files / 64 tests passed. New integration coverage proves
  owner authorization, RLS organization isolation, one-time pairing replay
  denial, expiration, device revocation and absence of raw secrets in storage
  and audit records.
- Root API/Web typecheck, 64 API tests, 11 Web tests and both production builds
  passed; `git diff --check` passed.
- Authenticated browser acceptance confirmed the directory connection page at
  375, 768, 1024 and 1440px with no document-level horizontal overflow.

## Persian Help impact

The workspace describes temporary pairing codes, safe revocation and the
explicitly deferred synchronization step in Persian. Runtime Product Help
remains deferred to GOAL-046.

## Deferred scope

GOAL-037 owns the Windows service, selected secure local storage/request proof,
directory preview/mapping and idempotent synchronization lifecycle.
