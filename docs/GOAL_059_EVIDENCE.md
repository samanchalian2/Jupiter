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

## 37. Authorized preview theme synchronization (2026-10-05)

The protected credential source was used only in memory for the already
authorized server connection; no credential or secret was written to source,
Evidence, logs or deployment artifacts. The earlier authentication failure was
caused by the local SSH client path rather than a rejected server credential.

The existing clean preview checkout was fetched and fast-forwarded only from
`7fc5137` to `e4b8587`. API and Web production builds completed on the host.
Only `jupiter-ip-preview-api` and `jupiter-ip-preview-worker` were restarted;
both services and Nginx were active afterward. The Web root and
`/api/v1/health` returned HTTP 200, the deployed CSS contained the canonical
Lavender `#A89BBE`, and the checkout remained clean.

Authenticated server inspection confirmed Jupiter continues to use its
isolated `jupiter` PostgreSQL database and dedicated runtime role. No migration
was executed and no unrelated database, role, table, process, service or proxy
configuration was changed. The co-hosted application remained untouched.

The real preview URL rendered the Persian RTL login with the Lavender/Beige
identity and available light/dark control. At the exercised browser viewport,
`document.documentElement.scrollWidth` did not exceed its client width, so
there was no document-level horizontal overflow.

This synchronization does not change the official verdict: GOAL-059 remains
**BLOCKED** pending canonical DNS/TLS, immutable image provenance, managed
secret injection, backup/restore proof, monitoring/alerting and an approved
Windows/AD Connector host. GOAL-060 is not started.

## 38. Lavender/Beige balance acceptance (2026-10-05)

Following owner feedback, the supporting Beige was promoted from a mostly
latent token to visible low-fatigue surfaces: compact shell header,
page-context wash, secondary controls and empty/helpful states. Lavender
remains the primary action, selection, focus and logo color; ordinary work
surfaces remain neutral. The preview was fast-forwarded and rebuilt through
`e4e712c` without a migration or service/database change.

Authenticated browser acceptance on the organization Knowledge route confirmed
the canonical Beige `#D8C3A6` and soft Beige `#F8F2EA` are active. Computed
contrast was `6.47:1` for secondary-control text and `13.80:1` for empty-state
text. The page had no document-level horizontal overflow. The co-hosted
application and its PostgreSQL data remained untouched.

## 39. Deeper Lavender and white-foreground remediation (2026-10-06)

The canonical Jupiter primary was deepened to `#796E89`, with hover
`#6D627D`, active `#61566F` and white foreground. The primary-to-white contrast
is `4.77:1`, satisfying WCAG AA for ordinary control text. The same action
family is used in Light and Dark themes so primary button text does not switch
to a low-emphasis dark foreground. Beige `#D8C3A6` and its low-fatigue support
surfaces remain unchanged.

API/Web canonical tokens, server validation, reset behavior expectations,
appearance placeholders, default-logo treatment, Persian Help and design
documentation were updated together. OCEAN/TEAL and explicit Custom Primary
values remain backward-compatible. No migration or commercial, lifecycle,
authorization or tenant-data behavior changed.

The authorized preview was built and deployed at `cb875ce`. Web and API health
returned HTTP 200 and the checkout remained clean. Runtime Help publication
created one new revision for `platform-appearance`; 14 other published articles
were unchanged. No credential or protected environment value was recorded.

Authenticated dashboard acceptance computed primary `#796E89`, hover
`#6D627D`, active `#61566F`, white `onPrimary`, a primary-button background of
`rgb(121, 110, 137)` and white text. The dashboard loaded successfully after
session refresh and had no document-level horizontal overflow. The first
request exposed an existing session-expiry presentation weakness: an expired
access token reached the dashboard as HTTP 500 before concurrent refreshes
completed; retry with the refreshed session succeeded immediately. This is not
caused by the palette remediation, but should be normalized to a 401/transparent
single-flight refresh in a future scoped Goal.

## 40. Authorized final-preview synchronization (2026-10-10)

The existing clean Preview checkout was fetched and detached at application
commit `f64d218`. Dependency installation used the repository-pinned pnpm
version; API and Web production builds completed successfully on the host.

Before changing schema, a protected custom-format rollback backup was created
from the isolated `jupiter` database. Migrations
`057_personal_workspace_foundation.sql` through
`060_personal_payments.sql` then applied successfully, bringing the migration
ledger to 71 records. No other database was backed up, migrated or queried for
application data. Runtime Help publication created the four Personal Service
guides and left the 15 existing guides unchanged, for 19 published guides.

Only `jupiter-ip-preview-api` and `jupiter-ip-preview-worker` were restarted.
Those services and Nginx reported active; `/`, `/api/v1/health` and
`/api/v1/health/ready` returned HTTP 200 from both the host and the deployment
client. The checkout remained clean and exactly at `f64d218`; service journals
contained no warning-or-higher entries from the synchronization window.

The in-app browser opened the real Preview URL. The Persian login rendered the
canonical 1774×887 Jupiter asset successfully and the exercised viewport had
equal document client/scroll widths, proving no document-level horizontal
overflow. The co-hosted application, its PostgreSQL database, roles, services
and proxy configuration were not changed.

This operational synchronization does not convert the temporary HTTP Preview
into official staging. GOAL-059 remains **BLOCKED** on canonical DNS/TLS,
immutable image provenance, managed secret injection, managed backup/restore
proof, monitoring/alerting and the approved Windows/AD Connector host.

## 41. Preview regression hardening and repeat acceptance (2026-10-10)

An authenticated route sweep and API journal review after the final-preview
synchronization exposed two hidden Preview defects even though most pages
visually recovered: `GET /api/v1/admin/branding` returned HTTP 503 when the
optional S3-compatible store was not configured, and several tenant read
models used `Promise.all` against the same checked-out PostgreSQL client. The
former was swallowed by the Web fallback; the latter emitted the pg warning
that overlapping client queries will become an error in a future pg release.
The previously recorded expired-access-token presentation weakness was also
included in this bounded reliability remediation.

The API now returns `{logo_url:null}` only when the optional storage adapter is
not configured, allowing the built-in canonical identity to render. It does
not suppress other storage failures and does not make logo upload available
without configured storage. Tenant queries in commercial summaries, reporting,
tickets, setup and personal capacity now run sequentially on their owned
client. Central JWT verification maps invalid or expired token-library errors
to `UnauthorizedException`/HTTP 401.

Verification before deployment:

- API: 32 files, 139 tests passed.
- Web: 4 files, 14 tests passed.
- API and Web typechecks passed.
- API and Web production builds passed.
- `git diff --check` passed.
- New regression coverage verifies canonical branding fallback and JWT error
  normalization.

Commit `73c93a0` was pushed and deployed into the existing clean Preview
checkout. No migration or Help publication was required for this remediation.
Only the Jupiter API and worker were restarted; Nginx and the co-hosted
application were not changed. Root, health and readiness checks returned HTTP
200 after startup, and the checkout remained clean at the deployed commit.

Authenticated in-app browser acceptance covered the dashboard, tickets,
knowledge, reports, organization members, organization settings/branding,
catalog, Directory, Help and Platform surfaces. The earlier responsive sweep
covered 375, 768, 1024 and 1440 widths; the repeat post-deployment sweep used
the active 597×754 viewport because this remediation did not change Web/CSS.
All checked pages were Persian RTL with zero document-level horizontal
overflow, zero broken images and no visible generic/internal loading error.
Browser console output was empty. The dashboard was left open for owner review.

Server-side acceptance after the browser sweep showed recent branding reads as
HTTP 304/200 cache-success responses rather than 503, an invalid protected
request as HTTP 401, no post-ready 5xx, no warning-or-higher API journal entry,
and zero `client already executing a query` warnings. PostgreSQL, roles and all
data belonging to the co-hosted application were untouched.

This remediation does not represent the IP Preview as official Staging.
GOAL-059 remains **BLOCKED** on its external infrastructure gates, and no later
Goal is started by this evidence update.

## 42. Complete mobile wordmark remediation (2026-10-10)

Owner review identified that the canonical wide logo was still incomplete in
the mobile Header: the shared `compact` crop intentionally exposed only the
planet and therefore hid the `Jupiter` wordmark. The source asset was healthy;
the defect was the 42px mobile frame inherited from the collapsed-sidebar
variant.

The mobile Header now reuses the existing safe vertical transparent-margin crop
but exposes the full 124px image width. The symbol-only 42px crop remains scoped
to the genuinely collapsed desktop sidebar, where a full wordmark cannot fit.
The mobile drawer, Login and expanded desktop brand placements remain full-logo
contexts.

Web tests (14), Web typecheck, Web production build and `git diff --check`
passed. Commit `955ce4b` was pushed and only the Jupiter Web build was updated
on Preview; API, worker, Nginx configuration, PostgreSQL and the co-hosted
application were not changed. Web, health and readiness returned HTTP 200.

Authenticated Browser inspection showed the complete planet-and-`Jupiter`
wordmark in both the Header and opened mobile drawer. The canonical image had
its expected 1774×887 natural dimensions, no image was broken, no generic
application error appeared and document-level horizontal overflow was zero.
This visual fix does not change GOAL-059's blocked staging verdict.

## 43. Login wordmark frame correction after owner review (2026-10-11)

The first mobile-Header remediation did not resolve the owner's selected Login
placement. Browser measurement proved the remaining defect rather than relying
on visual inference: the Login image rendered at 154×77 inside a 154×54
overflow-hidden frame. Its lower artwork could therefore be clipped while the
source PNG's large transparent canvas still made the visible logo feel
undersized and poorly balanced.

The canonical source asset and its colors/geometry remain unchanged. Full-logo
placements now use a wordmark-shaped frame with absolute 100% image bounds and
centered `object-fit: cover`, which removes only transparent outer canvas. Login
uses a dedicated 184×60 frame; compact Header and collapsed-sidebar behavior
remain separately scoped.

Web tests (14), Web typecheck, Web production build and `git diff --check`
passed. Commit `63ce07f` was pushed and only the Jupiter Web bundle was rebuilt
on Preview. Web, API health and readiness returned HTTP 200; API, PostgreSQL,
Nginx configuration and the co-hosted application were not changed.

The repeated Browser screenshot visibly showed the complete planet and entire
`Jupiter` lettering without the former blank frame. Computed browser evidence
reported equal 184×60 bounds for the frame and image, natural source dimensions
1774×887, zero broken images, no generic application error and zero
document-level horizontal overflow. This correction does not change the
official GOAL-059 staging verdict.

## 44. Owner-authorized isolated main-host publication (2026-10-11)

The preview-approved dataset and release `5ba3ae8011dc` were published to the
authorized main host. After the owner added the Cloudflare DNS record, public
resolvers returned the protected-host address, the HTTP ACME challenge passed,
and a dedicated Let's Encrypt certificate was issued for
`https://jupiter.arandi.io`. The former `https://arandi.io:8443` endpoint now
returns a permanent redirect to the canonical hostname. The existing
co-hosted application was first mapped read-only and remained bounded to its
own filesystem tree, service, loopback port, Nginx virtual host, PostgreSQL
database and database role. Jupiter received a distinct system account,
`/srv/jupiter` release tree, `jupiter-main-api` and `jupiter-main-worker`
services, loopback API port 3100, PostgreSQL database/runtime roles and an
independent TLS listener on 8443. No co-hosted application table or application
file was read or changed.

The Jupiter database restore retained 71 migration records, 30 workspaces and
332 users from the accepted preview dataset. Runtime dependencies were rebuilt
inside Jupiter's release after a Windows pnpm archive failed to preserve two
transitive module links; no build or package operation ran in the co-hosted
application directory. Temporary database dumps were removed from the hosts
and their local temporary copies were zeroed after restore.

Acceptance returned HTTP 200 for canonical Jupiter Web and `/api/v1/health`; the stored
Platform administrator completed login, authenticated profile and refresh
rotation with a Secure, host-only `jupiter.arandi.io` refresh cookie. The
in-app browser rendered the Persian Jupiter Login page from the canonical HTTPS
endpoint. The co-hosted application service
remained active and its public HTTPS endpoint returned HTTP 200 before and after
the deployment. Final Jupiter services and Nginx were active, and the host had
9.5 GiB free at 75% filesystem utilization.

The certificate renewal dry run completed successfully. Plain HTTP and the
former port-based HTTPS entry both return `301` to the canonical HTTPS URL;
canonical Web and API health return `200`. API, worker, Nginx, PostgreSQL and
the co-hosted application service remained active, and the post-cutover Jupiter
journal contained no warning-or-higher entry.

This is an owner-authorized operational publication, not an official GOAL-059
staging PASS. Managed secret injection, immutable release provenance,
backup/restore rehearsal, monitoring/alerting and a validated Windows Directory
Connector host remain outstanding acceptance gates.

## 45. Icon-button hover contrast remediation (2026-10-11)

Owner review on the canonical Login identified an unreadable password-visibility
icon when Hover applied a strong brand background while the glyph retained a
dark foreground. The cause was a specificity conflict between the global
`button:hover:not(:disabled)` rule and the softer shared icon-button rule.

Shared icon buttons now pair strong hover, keyboard-focus and active surfaces
with the deterministic `on-primary` foreground. The rule also targets the SVG
glyph explicitly, preventing a nested icon from retaining a stale brand color.
Soft brand and Beige secondary controls keep their existing accessible dark
foregrounds.

Fourteen Web tests, Web typecheck, Web production build and `git diff --check`
passed. Commit `93e41dd` was pushed and only the Jupiter Web bundle was rebuilt
on the isolated IP Preview. Web and API health returned HTTP 200; no API,
migration, PostgreSQL, Nginx configuration or co-hosted application change was
made. Browser interaction on the real Preview Login exercised the
password-visibility control and displayed its filled hover state. The canonical
main-host publication was initially left unchanged.

The owner then explicitly requested publication. The identical tested Web
bundle was placed in immutable release directory `93e41dd-hover` and the
Jupiter `current` symlink was switched atomically; the prior release remains
available for rollback. API/worker processes and the database were not
restarted or changed. Nginx validation passed before reload. Canonical Jupiter
Web and health, plus the co-hosted Arandi Web endpoint, returned HTTP 200 and
Jupiter API/worker, Nginx and `arandi-platform` services all remained active.
Browser acceptance on `https://jupiter.arandi.io` visibly confirmed the
password-visibility button's filled Lavender hover state with a white glyph.
This remediation does not alter the GOAL-059 **BLOCKED** verdict on its separate
external infrastructure gates.

## 46. Program-wide interaction contrast audit (2026-10-12)

The owner expanded the selected Login defect into a program-wide requirement:
whenever Hover changes a control to a dark brand surface, its text and icon must
become the matching readable foreground. The follow-up audit enumerated all
Hover, Focus and Active rules in both Web stylesheets rather than limiting the
fix to the password icon.

The global `button:hover:not(:disabled)` contract now declares both the strong
brand background and `on-primary` foreground. Nested SVGs inherit that resolved
foreground. Primary-button states explicitly repeat the invariant, and brand
states that previously hard-coded white in composer utilities, send controls,
mobile navigation and header disclosures now use `on-primary`; this preserves
the deterministic dark foreground selected for an approved light Custom
Primary. Soft brand, warm Beige and neutral hover surfaces retain their
accessible dark semantic foregrounds.

`interactionContrast.test.ts` parses both shipped stylesheets. It fails if any
Hover/Focus/Active rule uses a strong `primary`, `primary-dark`, `color-brand`,
`color-brand-hover` or `color-brand-active` surface without `on-primary`, and
also protects SVG foreground inheritance. All 16 Web tests, Web typecheck,
production build and `git diff --check` passed.

Commit `5c6eb6e` was built on the isolated IP Preview; Web and API health
returned HTTP 200. After the previously explicit owner instruction to update
the Web version, the identical tested bundle was promoted through immutable
canonical release `5c6eb6e-hover-audit`, preserving the previous release for
rollback. Nginx validation passed and only the Jupiter Web release symlink was
changed; API, worker, PostgreSQL and migrations were untouched.

On live `https://jupiter.arandi.io`, CSSOM inspection evaluated all 12 strong
brand interaction rules and found zero foreground mismatch. Direct Browser
interaction with the password-visibility control measured button background
`rgb(109, 98, 125)`, button/SVG color and SVG stroke
`rgb(255, 255, 255)`, and equal document client/scroll width. Jupiter Web/API
health and the co-hosted Arandi endpoint all returned HTTP 200; Jupiter API,
worker, Nginx and `arandi-platform` services remained active. This visual audit
does not change the separate GOAL-059 **BLOCKED** infrastructure verdict.

## 47. Public registration audit-scope remediation (2026-10-12)

Canonical Browser feedback exposed HTTP 500 while creating a personal Jupiter
account. The API journal identified the exact failure without recording any
credential: insertion of the required public account audit event was rejected
by `audit_logs_tenant`. Public account creation deliberately has no tenant
scope, but SQL equality does not make two NULL scopes equal, so the transaction
rolled back and no partial user remained.

Migration `061_audit_log_scope_policy.sql` replaces ordinary equality with
`IS NOT DISTINCT FROM` for both policy visibility and insertion. This does not
open audit data across organizations: an unscoped audit row can be inserted and
read only in an unscoped request context, disappears after switching to a
tenant context, and an attempt to create an unscoped row while tenant-scoped is
rejected with PostgreSQL RLS error `42501`. The integration test exercises all
three invariants through the runtime role. Duplicate-email conflicts are also
translated to a Persian user-facing message rather than leaking a database
error.

The focused organization-application integration suite passed 35 tests. The
complete verification then passed 140 API tests, 16 Web tests, API/Web
typechecks, both production builds and `git diff --check`. Commit `7642bca`
was pushed.

Preview received migration 061 and the rebuilt API/worker after a protected
Jupiter-only backup. A real public registration returned HTTP 201 with delivery
status `PENDING_CONFIGURATION`; its user and audit rows were then deleted and
the cleanup query returned zero. No unrelated service or database changed.

The canonical main host received immutable release
`7642bca-registration`. Before applying migration 061, a Jupiter-only database
backup was stored at
`/srv/jupiter/backups/pre-061-20261012T104722Z.dump`; the release symlink was
switched atomically and only Jupiter API/worker were restarted. A real request
to `https://jupiter.arandi.io/api/v1/public/accounts` then returned HTTP 201.
The fixture cleanup trap completed and the authoritative database query found
zero `main-accept-*` users. Migration 061 is recorded exactly once.

Final canonical Jupiter Web and health and the co-hosted Arandi Web endpoint
all returned HTTP 200. Jupiter API, worker, Nginx and `arandi-platform` were all
active. No Arandi file, table, role or service configuration was changed.

At the time of this RLS-only remediation, both authorized Jupiter hosts set
public verification delivery to `DISABLED`, and no approved provider/webhook
secret exists in the project
secure inventory. Successful registration therefore returns
`PENDING_CONFIGURATION`; sending a verification email requires a separately
authorized delivery-provider configuration. The remediation neither exposes a
token nor bypasses the verified-email activation invariant. This operational
fix does not change GOAL-059's separate **BLOCKED** infrastructure verdict.

## 48. Production email-verification delivery (2026-10-12)

The owner requested completion of the verification delivery mechanism after
the canonical registration fix. DEC-034 extends the existing adapter boundary
with deployment-owned SMTP; token creation, hashing, single-use consumption,
24-hour expiry, resend throttling, audit and verified personal-workspace
provisioning remain unchanged. The adapter emits Persian text and HTML with the
canonical HTTPS verification URL, checks that SMTP accepted the intended
recipient, disables file/URL content access and uses bounded timeouts. Its
plaintext exception is accepted only for `localhost`, `127.0.0.1` or `::1`;
every non-loopback TLS bypass is rejected.

Three focused delivery tests cover the message projection, recipient rejection
and non-loopback TLS-bypass denial. The full release gate passed 142 API tests,
16 Web tests, API/Web lint and typecheck, both production builds and
`git diff --check`. Commits `88db77a` and `f4ad0e1` were pushed; Preview was
synchronized to `f4ad0e1` with delivery still disabled there.

The canonical host had no existing mail listener or MTA and outbound SMTP was
reachable. Postfix and OpenDKIM were installed without changing Nginx,
PostgreSQL, Jupiter database data or any Arandi file/service. Postfix listens
only at `127.0.0.1:25`, relays only for loopback, and hands outbound messages to
OpenDKIM at `127.0.0.1:8891`. The 2048-bit selector is `jupiter`; its private
key is root/service-owned under `/etc/opendkim`, mode 0600, and is not present
in Git, the database, application environment, audit metadata or logs.

Release `f4ad0e1-smtp` enabled canonical SMTP delivery from
`no-reply@jupiter.arandi.io`. A reserved-domain registration fixture exercised
the real public API, Persian message, local SMTP handoff and DKIM milter. It
returned HTTP 201 with `DELIVERED`, and OpenDKIM recorded that a DKIM signature
was added. The fixture account/audit/delivery records and its queued test/bounce
messages were then removed; the database fixture count and mail queue both
returned zero. Jupiter Web/health and Arandi Web returned HTTP 200; Jupiter API,
worker, Postfix, OpenDKIM, Nginx and `arandi-platform` were active.

The owner then published the deployment-generated SPF, DKIM and strict DMARC
records in the authoritative Cloudflare zone. Both Cloudflare public DNS
(1.1.1.1) and Google public DNS (8.8.8.8) return the expected records. The
SHA-256 digest of the DKIM `p=` value is
`df55b8f8eee310b4837ebc7c18845fffa3320e38bfc1143ff4e5e2a2a6879d13`;
the public key derived on-host from the protected private key has exactly the
same digest. This validates selector/key alignment without exposing private
material. The Postfix queue remained empty and canonical Jupiter Web/health,
Arandi Web and all six bounded services remained healthy.

The remaining user-visible check is the account owner's normal authenticated
«ارسال دوباره» action, mailbox receipt and consumption of the canonical link;
this is deliberately not replaced by a token/database bypass. No raw token,
credential or private DKIM key belongs in this Evidence. This operational
delivery work does not change GOAL-059's separate **BLOCKED** infrastructure
verdict.

## 49. Verification-to-personal-workspace RLS remediation (2026-10-12)

The owner confirmed receipt of a real canonical verification email. The first
link-consumption attempt returned HTTP 500. Sanitized API journal evidence
identified PostgreSQL `42501` on the `memberships` insert: email verification
begins as a deliberately unscoped public transaction, but personal workspace
provisioning attempted its first tenant-owned write before selecting the newly
resolved personal workspace as the local transaction context. PostgreSQL RLS
correctly denied that write. The transaction rolled back, so the token was not
consumed, the identity was not partially verified and no partial workspace or
membership remained.

`PersonalWorkspaceService` now resolves or creates the personal organization,
captures the caller's current organization context, switches the local
transaction context only for membership, requester role, tenant audit and
projection work, and restores the prior context on success. Any failure still
rolls back the complete verification transaction and its transaction-local
context. The implementation neither elevates the database role nor bypasses
RLS, verification, token expiry or single-use enforcement.

A new integration case runs public account creation and email verification
under `SET LOCAL ROLE jupiter_app` with an empty organization context. It proves
that the public portion remains unscoped and that exactly the resolved personal
tenant accepts the membership. The complete validation passed 144 API tests,
16 Web tests, API lint, API/Web typechecks, both production builds and
`git diff --check`.

Commit `fe39351` was fast-forwarded to the isolated IP Preview, where API and
worker restarted active and health returned HTTP 200. The same tested API
bundle was promoted as immutable canonical release
`fe39351-verify-rls`. After the brief restart window, canonical Web, health and
readiness all returned HTTP 200; API, worker, Postfix, OpenDKIM, Nginx and the
co-hosted `arandi-platform` service were active, and the isolated Arandi site
also returned HTTP 200. No database migration, Arandi file/table/role/service,
mail key or unrelated tenant data was changed. No email address, raw
verification token or credential is recorded here. This remediation does not
change GOAL-059's separate **BLOCKED** infrastructure verdict.

## 50. One-step organization application UX (2026-10-12)

Owner feedback identified an avoidable applicant error: the public organization
form first presented «save draft» and only after that exposed a separate
submission action. A user could reasonably assume that saving had already sent
the request. The applicant surface now presents one primary action,
«ارسال درخواست ثبت سازمان». It calls the existing idempotent create/update
operation and immediately calls the existing submit operation. A returned
`NEEDS_INFORMATION` application follows the same one-step path with the label
«ارسال اطلاعات تکمیلی».

Email verification remains required and is explained beside the disabled
submission action. The approved domain states, transition audit, Platform
review workflow and API contracts are unchanged; `DRAFT` remains an internal
durable compatibility/recovery state rather than a normal applicant step. If a
network or submit failure occurs after the first operation, the form reloads
the durable request and retains an actionable error so the same single action
can safely retry without hiding the issue.

Two Web tests verify the exact create-then-submit and update-then-resubmit call
order with distinct idempotency keys. The complete gate passed 144 API tests,
18 Web tests, API/Web lint and typechecks, both production builds and
`git diff --check`.

Commit `51b64d9` was fast-forwarded to the IP Preview and its production Web
bundle returned HTTP 200 while API, worker and Nginx remained active. The same
tested bundle was promoted through immutable canonical release
`51b64d9-one-step-application`; canonical Jupiter Web and API health returned
HTTP 200, as did the isolated Arandi site, with all bounded services active.
No API, migration, PostgreSQL data, Arandi file/table/role/service or unrelated
tenant data changed. This UX remediation does not change GOAL-059's separate
**BLOCKED** infrastructure verdict.

## 51. Platform responsive lists and review workflow (2026-10-13)

Authenticated owner feedback exposed two defects in the Platform console. At
narrow widths, the organization and application tables kept their desktop
column geometry, so later rows and actions appeared incomplete. In addition,
the submitted-application CTA labelled «شروع بررسی» only selected a local row
and rendered the decision form below the long table; it did not call the
supported start-review transition or bring the form into view.

Both organization and application lists now use the same responsive contract.
At 900px and below each table row becomes a labeled stacked card, long slugs
and applicant identifiers wrap safely, and the action remains part of the
visible row. At 1100px and below the broad Platform tab strip is replaced by a
compact native section selector. Desktop retains the normal tab/table layout.

The submitted-row action now POSTs the existing
`/platform/organization-applications/{id}/start-review` endpoint with an
idempotency key. A successful response changes the selected projection to
`UNDER_REVIEW`, opens the review form and scrolls it into view. An already
started row says «ادامه بررسی». No API contract, authorization rule or domain
transition was changed.

Regression coverage verifies the exact start-review request and immediate
reviewable projection, plus both responsive list markers and media contracts.
The complete gate passed 144 API tests, 20 Web tests, API/Web typechecks and
production builds, and `git diff --check`.

Authenticated canonical browser acceptance recorded:

- 638px: compact selector visible; organization cells render as stacked cards;
  document `scrollWidth` equals `clientWidth` (623px).
- 827px: compact selector visible; organization and application rows render as
  complete stacked cards; the submitted request and «شروع بررسی» action are
  visible; document `scrollWidth` equals `clientWidth` (812px).
- 1440px: desktop tabs and table cells render normally; document `scrollWidth`
  equals `clientWidth` (1425px).

The real submitted owner application was intentionally not transitioned merely
for visual acceptance; behavior is covered by the new Web orchestration test
and the existing API integration suite. Thus no tenant data or application
status was altered during browser acceptance.

Commits `05e5bc8` and `2867dd1` were fast-forwarded to the isolated Preview,
where Web and API health return HTTP 200 with API, worker and Nginx active. The
tested Web bundle is the immutable canonical release
`2867dd1-platform-responsive`; canonical Jupiter Web/health and the isolated
Arandi site return HTTP 200, and Jupiter API/worker, Arandi, Nginx, Postfix and
OpenDKIM services are active. No migration, PostgreSQL data, Arandi file,
database, role or service changed. This remediation does not change
GOAL-059's separate **BLOCKED** infrastructure verdict.
