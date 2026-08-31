# Directory Connector Technology Validation — GOAL-036

Date: 2026-08-30

This is a validation record, not an implementation commitment. The cloud
control plane implemented in GOAL-036 is independent of the eventual Windows
runtime. It accepts only a short-lived pairing code and returns a rotating,
revocable device token once; it never accepts, stores or logs Active Directory
credentials.

| Decision area | Candidate | Status for GOAL-036 | Required validation before GOAL-037 adoption |
| --- | --- | --- | --- |
| Windows service host | PowerShell ActiveDirectory module with WinSW | Selected for V1 | Uses the customer-supported AD tooling, WinSW automatic restart and Windows Event Log; installer has an explicit repair path. |
| Windows service host | Native Windows worker | Candidate | Equivalent lifecycle, signed installer, observability and maintenance-cost comparison. |
| Local secret storage | DPAPI | Selected for V1 | Service-local protected configuration; no AD secret or device credential is sent to the cloud. |
| Local secret storage | Windows Credential Manager | Candidate | Non-interactive service access, rotation, backup/restore and supportability. |
| Connector request proof | One-request rotating device token | Selected for V1 | Every accepted heartbeat, preview and apply rotates the server-stored hash; a replayed prior token is rejected and revocation is immediate. |
| Connector request proof | Request signing | Candidate | Clock skew, nonce retention, canonicalization and proxy compatibility. |
| Connector request proof | mTLS | Candidate | Certificate issuance, rotation, revocation and customer deployment burden. |

## Fixed security invariants

- The connector runs as an on-premises Windows service and calls Jupiter over
  outbound HTTPS only.
- No AD/LDAP password, bind credential or directory secret is accepted by the
  cloud control plane.
- Pairing codes are organization-bound, cryptographically random, hashed at
  rest, single-use and expire in 15 minutes.
- Device identity is an independent UUID plus a hashed token; revocation clears
  its usable credential and invalidates unconsumed pairing codes.
- GOAL-037 delivers the outbound-only PowerShell/WinSW service scaffold,
  DPAPI-protected local configuration and rotating-device-token protocol. The
  server accepts approved directory identity attributes only; it never accepts
  an AD bind password.
