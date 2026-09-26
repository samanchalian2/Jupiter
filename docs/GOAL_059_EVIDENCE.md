# GOAL-059 — Staging Release Readiness & Deployment Gate Acceptance

## 1. Initial Staging Readiness Inventory

Audit date: 2026-09-08. The repository contains local release tooling:
application Dockerfiles, local Compose dependencies, transactional migration
runner, DB-backed readiness, API request IDs/structured request logs, Nginx
browser-security headers, a health-only smoke tool, restore procedure and a
Windows/WinSW Directory Connector package. It does **not** contain a staging
endpoint, deployment manifests for a staging provider, registry configuration,
secret-manager identity, DNS/TLS configuration, managed-backup access,
monitoring/alerting integration, or a reachable Windows/AD staging host.

This workstation has no staging-related environment variables and no Docker
CLI/runtime. Consequently, no local result is represented as a staging PASS.

## 2. Release Candidate SHA

- Candidate source SHA: `45bd3f10e988213a2f402e6b81f918a5cde044aa` (`main`)
- Source commit time: `2026-09-08T13:50:06+03:30`
- Pre-audit working tree: clean.
- `origin/main` resolved to the same source SHA during the audit.

No immutable deployed release candidate was created because no staging
deployment target is available.

## 3. Artifact/Image Provenance

**BLOCKED.** API and Web Dockerfiles exist, but this host has no Docker runtime
and no image registry/repository or deployment target was configured. No image
was built, pushed, pulled, or deployed; no digest exists. `latest` was not
used as a release identity.

## 4. Secret Injection

**BLOCKED.** The Dockerfiles do not copy `.env`, and the runbook requires
deployment-owned secret injection. The actual staging secret manager,
identities, mounted/injected variables and image-layer inspection cannot be
verified without the staging platform. No secret values were read or recorded.

## 5. Migration

**BLOCKED for staging.** The runner applies each SQL file in a transaction and
records it in `schema_migrations`; a rerun skips recorded migrations. Its
current source set ends at `056_appearance_custom_primary.sql` (65 migrations
in the local rehearsal recorded by GOAL-058). No staging schema state was
available, and no migration was run outside the migration system.

## 6. Health/Readiness

**BLOCKED.** `/api/v1/health` is process health and `/api/v1/health/ready`
checks PostgreSQL with `SELECT 1`, but no staging ingress exists to verify HTTP
200, dependency readiness, or ingress routing.

## 7. HTTPS/TLS

**BLOCKED.** No staging hostname, DNS record, certificate or ingress was
provided. The local address is not staging evidence.

## 8. Security Headers

**BLOCKED.** Nginx config declares CSP, `X-Content-Type-Options`, frame
protection, `Referrer-Policy` and `Permissions-Policy`; API middleware also
sets security headers. HSTS is an ingress policy and no staging edge response
was available to verify it or CSP runtime behavior.

## 9. Logging

**BLOCKED.** Source review confirms a generated/propagated `X-Request-Id` and
structured request log fields limited to event, ID, method, path, status and
duration. Staging log transport, correlation, validation/unauthorized error
paths and real redaction cannot be verified without log access.

## 10. Business Smoke

**BLOCKED.** No authorized staging tenant or staging endpoint is available for
the requester/staff/admin smoke. GOAL-058 local evidence is deliberately not
substituted.

## 11. Tenant Isolation

**BLOCKED.** No two staging tenants or staging DB/RLS session were available.

## 12. Attachments

**BLOCKED.** No staging object-storage endpoint, credential injection or
authorized staging fixture was available.

## 13. AI

**BLOCKED.** No staging Platform Admin, tenant fixture or approved provider
failure mechanism was available. No provider secret was accessed.

## 14. Commercial Metering

**BLOCKED.** No delivered staging Smart Action or staging usage ledger was
available for reconciliation.

## 15. Assist

**BLOCKED.** No staging Assist fixture, support grant or capacity allocation
was available for request/accept reconciliation.

## 16. Public Onboarding

**BLOCKED.** No staging email adapter/test mailbox, public staging URL or
authorized fixture exists. Verification was not bypassed.

## 17. Org Browser Acceptance

**BLOCKED.** No authenticated staging organization/session exists for the
375/768/1024/1440 RTL acceptance sweep.

## 18. Platform Browser Acceptance

**BLOCKED.** No authenticated staging Platform Admin/session exists for the
375/768/1024/1440 acceptance sweep.

## 19. Help

**BLOCKED.** No staging anonymous/requester/owner/Platform sessions exist to
verify audience separation, exports and unpublished content behavior.

## 20. Directory Connector

**BLOCKED (release-blocking).** The supported package requires an approved
Windows service host, outbound HTTPS route and AD scope. None is available.
The local-only connector implementation is not claimed as staging acceptance.

## 21. Load Smoke

**BLOCKED.** `pnpm load:smoke` defaults to 40 requests at concurrency 8, but
there is no agreed staging endpoint/configuration. It was not run against a
local URL as a substitute.

## 22. Backup

**BLOCKED.** No managed staging backup target or backup identifier is available.

## 23. Restore Drill

**BLOCKED.** No staging backup can be restored to an approved isolated target.
The local GOAL-058 migration rehearsal is not a staging restore drill.

## 24. Monitoring

**BLOCKED.** No staging health/5xx/restart/DB/worker monitoring or alert
channel was supplied.

## 25. Rollback Plan

**BLOCKED.** The repository documents forward-only compatibility rules, but no
staging rollback owner, decision authority, maintenance window or alert channel
was supplied for this candidate.

## 26. Cleanup

**NOT APPLICABLE.** No staging fixture, attachment, allocation, browser
session, connector record or Help draft was created.

## 27. Integrity

**BLOCKED for staging.** No staging database access exists for post-cleanup
integrity checks. GOAL-058 records the corresponding local integrity result.

## 28. Defects

No product-code defect was identified. The blocker is deployment infrastructure:
no staging ingress/DNS/TLS, registry, secret manager, backup/restore access,
monitoring/alert channel or Windows/AD Connector host is accessible here.
No security workaround or artificial staging fixture was created.

## 29. Quality Gates

**PASS locally; not staging evidence.** Migration check completed without
pending output. API tests passed: **27 files / 117 tests**. Web tests passed:
**3 files / 13 tests**. API and Web typechecks and production builds passed.
`git diff --check` passed. The web build emitted its existing advisory for a
minified JavaScript chunk above 500 kB; it did not fail the build. `git
ls-files` contains only `.env.example`, not an operational `.env`.

## 30. Staging Release Matrix

| Gate | Result | Evidence |
| --- | --- | --- |
| Release SHA | PASS (identified) | Section 2; source and remote main matched at audit time |
| Artifact/Image provenance | BLOCKED | No Docker runtime, registry or deployment target |
| Secrets | BLOCKED | No staging secret manager/injection visibility |
| Migration | BLOCKED | No staging schema/runner access |
| Health | BLOCKED | No staging ingress |
| HTTPS / HSTS / headers | BLOCKED | No hostname, TLS or edge response |
| Logging | BLOCKED | No staging logs/correlation sink |
| Business smoke / RLS / attachments | BLOCKED | No authorized staging fixtures/services |
| AI / commercial / Assist | BLOCKED | No staging control plane or provider fixture |
| Public, org, platform browser / Help | BLOCKED | No staging URL or authenticated sessions |
| Directory Connector | BLOCKED | No Windows/AD staging host |
| Load smoke | BLOCKED | No agreed staging endpoint |
| Backup / restore | BLOCKED | No managed backup or isolated restore target |
| Monitoring / rollback | BLOCKED | No deployment ownership/alerting context |
| Cleanup / integrity | NOT APPLICABLE / BLOCKED | No staging fixture or DB access |

## 31. Final Verdict

## BLOCKED

Jupiter is still **Local Release Ready**, not Staging Release Accepted. At
least the Directory Connector, deployment, TLS, secrets, backup/restore and
monitoring gates are unavailable. No partial local evidence is labelled as a
staging acceptance.

## 32. Known Limitations

To continue, provide an authorized staging URL/ingress, immutable image
registry path, deployment/secret-manager access, a sanitized staging fixture or
fixture policy, log/monitoring/backup access, a rollback owner/channel/window,
and an approved Windows/AD Connector host. The next execution must deploy a
new exact candidate and validate the real environment; GOAL-060 is not started.

## 33. Resume attempt — 2026-09-16

The GOAL-059 resume used the protected local credential source only for the
authorized server audit. `securedata/` is ignored by Git and the protected file
is neither tracked nor included in this Evidence, terminal report, source or
release artifact.

The existing staging host was audited without changing an existing service. It
already has Docker/Compose, Nginx, PostgreSQL, a restrictive firewall and
unrelated running services, so no duplicate runtime, database or proxy stack
was created. Docker has no Jupiter images, containers, volumes or build cache.
The root filesystem has only about 1.9 GiB free (92% used), which must be
remediated before building production images on this host.

### DNS gate result

**BLOCKED.** From the staging host, `jupiter.pnsoffice.ir` has no usable IPv4
or IPv6 DNS result and HTTPS cannot resolve the canonical hostname. The
canonical hostname must receive an `A` record pointing to the protected
staging server public IPv4; do not publish an `AAAA` record unless an approved
IPv6 ingress is provisioned. The protected IP is intentionally not copied into
this repository or Evidence. No hosts-file, alternate hostname, self-signed
certificate or TLS workaround was used.

No deployment, migration, bootstrap, public fixture, browser acceptance,
backup/restore drill, connector pairing or monitoring change was attempted
after this failed prerequisite. The exact current source release candidate is
`71f16a345bd8aa1724ecf943c2139a813fb8f598`, which matches `origin/main`.

## 34. Updated verdict

## BLOCKED

GOAL-059 remains blocked for official staging acceptance. An authorized
temporary IP preview exists, but it is not a replacement for the canonical
DNS/TLS, registry, secret-management, managed-backup, monitoring and
Windows/AD Connector gates. GOAL-060 is not started.

## 35. Authorized temporary IP preview (2026-09-26)

An authorized operational preview was prepared on the existing server without
changing the co-hosted Arandi application. The project data was copied from the
local Jupiter PostgreSQL database into a separate `jupiter` database and a
dedicated limited runtime role. The destination schema has all 65 migrations;
the source/destination verification matched 30 organizations, 332 users, 103
tickets and 15 published Help articles.

The API and worker run under a dedicated `jupiter` operating-system account.
The API listens only on loopback and Nginx serves the built Web application on
the explicitly authorized temporary HTTP preview port. Process readiness and
the rendered Persian login page were verified. The server checkout and source
repository are aligned at `7fc5137`.

The previous empty destination state was retained as a protected server-side
backup before import. Temporary local transfer artifacts were removed. No
secret, credential, protected host address or application data is recorded in
this evidence.

This is deliberately **not** a GOAL-059 staging PASS: it has no canonical
hostname or TLS, immutable image registry, deployment secret manager, managed
backup/restore proof, monitoring/alert channel or Windows/AD Connector host.
Those gates remain blocked and GOAL-060 must not start.

## 36. Runtime-role login remediation (2026-09-26)

The initial limited runtime-role configuration applied tenant RLS to the
unscoped authentication membership lookup. A platform administrator could
therefore authenticate but received no organization membership in the session,
which caused the web shell to fall back to Platform-only UI.

The dedicated Jupiter runtime role was corrected to perform only the required
trusted application platform/login reads. Tenant operations continue to enter
the database-owned `jupiter_app` role through `SET LOCAL ROLE`; a two-tenant
check confirmed the active tenant could read its own ticket rows and read zero
rows for a second tenant. A fresh administrator session returned the active
`jupiter-demo` membership and opened the full Persian organization dashboard,
including Tickets, Knowledge, Help, Reports, Organization Administration and
Platform Administration navigation. No Arandi role or database policy was
modified.
