# GOAL-069 — Preview and main deployment

## Authorization and release

On 2026-10-24, after LOCAL acceptance, the owner explicitly requested deployment
to both preview and main. This supersedes the earlier LOCAL-only release boundary
for this rollout only; it does not complete GOAL-059 or start another Goal.

- Runtime commit: `fe64140be8ba96405117d554a0f895b5323ea247`.
- Source: clean `git archive` of that exact commit, not the dirty working tree.
- Linux build artifact SHA-256:
  `2beb6dbf00b7a0c0a67075e201690e0f9a36f971e9ac73ea4c3aed67771c1687`.
- Preview: http://172.20.190.16:8088/operations
- Main: https://jupiter.arandi.io/operations
- Normal application entry points remain `/` and `/platform`; `/operations` is
  the authenticated monitoring console, not a replacement for ticketing.

## Preparation and data protection

Both existing deployments used the previous `c2aeedb` release and 73 migration
records through `062_safe_organization_archival.sql`. Each uses its existing
loopback PostgreSQL database named `jupiter` and dedicated `jupiter_runtime`.
No database was copied over the main or preview customer datasets.

Each host received a protected custom-format `pg_dump` before migration;
`pg_restore -l` verified archive readability. An AES-GCM-encrypted copy of each
backup was downloaded to ignored operator storage outside the application host
and authenticated decryption was verified. Backup/key paths and secret values
are deliberately excluded from Git. Prior release directories and protected
environment backups remain available for operator rollback.

A temporary `jupiter_goal069_rehearsal` database on preview was restored from
the real preview backup, advanced through all eleven new migrations on the
host's PostgreSQL 16, and dropped after success. Final temporary-database count
is zero. This rehearsal is not an assertion that the main backup was separately
restored or that a managed backup service is established.

No Arandi database, role, configuration, Nginx configuration, service or source
was altered. Only Jupiter services were stopped/restarted. Existing preview
Arandi backup/readiness service failures were observed before deployment and
left untouched; this rollout does not repair or certify those jobs.

## Build, migration and activation

- Dependencies linked from the frozen lockfile. The pnpm wrapper attempted
  automatic dependency verification/network access even for build commands.
  Registry metadata requests stalled; only the identified release-owned install
  processes were stopped. No existing application process was terminated.
- Invoked the installed, lockfile-resolved TypeScript/Vite tools directly in
  dependency order. All six SDK/adapter packages, server, Console, API and Web
  production builds passed. The existing nonfatal >500 KiB Vite warning remains.
- Copied the same completed Linux artifact to main and verified its checksum;
  no dependency install or compilation was performed on the memory-limited main
  host. Expanded release is approximately 257 MiB; compressed artifact 45 MiB.
- Applied only migrations `063` through `073` to each existing `jupiter`
  database, each in its own transaction with bounded lock/statement timeouts.
  Final count: 84 records and 27 `observability` tables on both hosts.
- Granted only the new Hub control/runtime/worker NOLOGIN role memberships to
  the existing Jupiter runtime identity. No broad PostgreSQL privilege or
  unrelated login change was made.
- Bootstrapped the existing active `admin@jupiter.local` identity explicitly
  through `RegistryService.bootstrap`, with deployment authorization recorded in
  Hub Audit. No new account/password, organization membership, or tenant role
  was created. Normal authenticated host mapping and scoped authorization remain.
- Created independent Jupiter registries/environments: `preview` / `STAGING`
  and `production` / `PRODUCTION`, with their exact respective allowed origins.
  The preview label does not establish formal GOAL-059 staging acceptance.
- Used existing service boundaries and ports: preview API loopback 13000,
  main API loopback 3100. Public routes remain behind existing Nginx; no port,
  firewall, TLS, domain or global service configuration was changed.
- Preview path `/opt/jupiter/ip-preview` now points to
  `/opt/jupiter/releases/fe64140`; prior tree retained as
  `/opt/jupiter/ip-preview-pre-goal069`.
- Main `/srv/jupiter/current` atomically switched from
  `/srv/jupiter/releases/c2aeedb-rtl-drawer` to
  `/srv/jupiter/releases/fe64140`. Existing `api` and `web` layout is provided by
  release-local aliases to `apps/api` and `apps/web/dist`.
- API and worker health checks passed after normal brief restart. Activation
  scripts included bounded readiness checks and application/environment rollback
  on failure; no rollback was required.

## AI and runtime Help

Approved `gpt-6-luna` / GapGPT configuration was transferred through encrypted
SSH, decrypted/re-encrypted in process memory using application-bound vaults;
the raw credential was not placed in a command, log or repository. Each target
received its own encryption key only because no key was previously configured.
Unrelated environment settings, SMTP and existing application data were retained.

Each independent deployment has enabled analysis and a 100,000 combined
input/output token UTC-month budget for its own Hub Application. These are
independent budgets, NOT one shared cross-server cap. Optional request/cost/rate
limits remain null. Customer Smart Action/Personal pools remain unrelated.
No manual provider connection/diagnostic/analysis call was made for acceptance;
automatic analysis is now subject to each deployment's normal scheduler/policy.
Final readback observed zero RESERVED attempts on both hosts. Audio operation
was not added by deployment.

The supported actor-authorized, slug-filtered Product Help publication utility
created the eleven published `observability-*` articles on each host. Other
Help content/history was preserved.

## Actual verification (2026-10-24, approximately 20:00–20:03 UTC)

On BOTH hosts:

- Web `/operations`: HTTP 200.
- API readiness: HTTP 200.
- Public Hub binding: enabled, exact runtime release SHA above.
- Unauthenticated operational applications API: HTTP 401.
- API, worker and Arandi system services: active.
- Existing Arandi loopback application: HTTP 200.
- Arandi `NRestarts=0`; service start timestamps remain 2026-10-10 on preview
  and 2026-10-12 on main, well before this rollout.
- Actual authenticated in-app-browser administrator login succeeded, permitted
  Jupiter/environment appeared, Overview loaded data and published contextual
  Help opened in Persian.
- Main viewport 1280: document width 1265; RTL, no document horizontal overflow.
  Production four-width acceptance was NOT rerun; earlier LOCAL four-width/513
  test acceptance remains separately documented. Preview visual check used the
  actual browser viewport, not an invented viewport matrix.
- Main Platform overview loaded its existing operational organization counts.
  Direct organization-ticket navigation with this platform-only account returned
  to `/platform`, consistent with no organization membership; no membership was
  added to turn that denial into a successful tenant test. No production ticket
  creation/mutation was performed for acceptance.
- Screenshots retained locally under ignored `output/goal069-preview-deployed.png`
  and `output/goal069-main-deployed.png`; no customer evidence exported to Git.

The complete 513-test LOCAL gate/CI applies to the exact runtime source; this
rollout rebuilt unchanged source on Linux and exercised live deployment smoke
checks. It does not claim running destructive fixture suites on production.

## Remaining operational limitations and rollback

Main free disk after rollout is about 2.9 GiB (93% used). Preview had about
9 GiB before rollout. No old release, database, backup or unrelated application
was deleted to obtain space. Plan a separately authorized bounded cleanup or
capacity expansion; monitoring data growth needs attention on main.

Preview remains HTTP-only. Existing managed-secret/backup/external-monitoring
and other GOAL-059 acceptance gaps are NOT closed by this deployment.

For application rollback, stop only Jupiter API/worker, restore the previous
Jupiter release pointer and the protected pre-rollout environment, then restart
and verify readiness/Arandi. Preserve the forward-compatible new schema; never
delete migration records, downgrade schema or restore over live data as a routine
rollback. Any data recovery requires a separate reviewed restore operation.

No next Goal was started. Development remains local; future main publication
continues to require the owner's deployment instruction.
