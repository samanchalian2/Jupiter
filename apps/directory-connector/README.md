# Jupiter Directory Connector

This package is the on-premises Windows Service companion for GOAL-037.  It
uses the locally installed ActiveDirectory PowerShell module to read the
configured AD scope, sends a preview over outbound HTTPS, and applies only
after Jupiter returns an accepted preview id.

## Security boundary

- Bind credentials, the selected OU/group scope and the rotating device token
  remain on the Windows host.  They are protected with DPAPI under the service
  account; the cloud never accepts directory credentials.
- `connector.ps1` only calls the configured Jupiter HTTPS URL.  It creates no
  inbound listener and makes no LDAP write, GPO, SSO or password operation.
- A server response rotates the device token on every heartbeat/preview/apply.
  A revoked device is rejected immediately.

## Installation and recovery

Run `install.ps1` as an administrator once.  It creates a local service
account, writes DPAPI-protected configuration, then installs WinSW with
automatic restart.  Re-run it with `-Repair` after an interrupted update; the
script preserves the existing protected configuration unless explicit new
values are supplied.  Use `uninstall.ps1` only when intentionally removing the
connector; it stops the service before removing its local files.

The service performs an initial `FULL` preview, then a `DELTA` preview every
15 minutes.  A periodic full reconciliation is scheduled every 24 hours.
