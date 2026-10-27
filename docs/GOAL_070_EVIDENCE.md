# GOAL-070 — Saba onboarding remediation

Status: Implementation and Preview acceptance PASS (2026-10-27). Final Git delivery
is verified from the actual commit/push/CI handoff, not a predicted source SHA here.

Source: owner-approved plan and `output/saba-preview-walkthrough-report.md`.
One Goal only; GOAL-059 remains independently blocked. Main deployment excluded.

## Requirements / before evidence

| Priority | Requirement | Root cause confirmed in source | Acceptance |
| --- | --- | --- | --- |
| P0 | Public organization application | Membership redirects hide ApplicantWorkspace after personal provisioning | PASS — final evidence below |
| P0 | Honest verification delivery | Registration discards delivery outcome; resend conflates failed/disabled | PASS — final evidence below |
| P1 | Atomic SETUP + owner | Direct Platform create defaults active, lacks membership and transactional Audit | PASS — final evidence below |
| P1 | SLA V2 editor | Existing policies API absent from automation UI | PASS — final evidence below |
| P1 | Account-isolated search | Filter key omits user; stale UI completions not invalidated | PASS — final evidence below |
| P2 | Wizard counts | COMPLETE-only count ignores optional SKIPPED | PASS — final evidence below |
| P2 | Persian owner label | Member display dictionary omits ORG_OWNER | PASS — final evidence below |
| P2 | tickets/new | Detail matcher accepts reserved new as ticket identifier | PASS — final evidence below |
| P2 | Temporary password | No persisted first-login restriction or restricted challenge | PASS — final evidence below |
| P2 | Duplicate/ownerless precheck | No ownerless projection or clear setup creation workflow | PASS — final evidence below |
| Education | Eight report guide corrections | Guide assumes missing product paths and does not explain limitations | PASS — final evidence below |

## Safety and locked decisions

- Preserve existing Saba organizations, accounts and tickets 5140/5141.
- Separate uniquely named acceptance fixture; remove only this Goal's temporary data after evidence.
- No SMTP/Webhook activation. Controlled delivery tests are not Inbox acceptance.
- New temporary passwords/admin resets only; no retroactive user promotion/password reset.
- Preview only; no Arandi service/database changes or shared PostgreSQL restart.
- Preserve pre-existing user edits in AI gateway and website training prompt, output/tmp and AGENTS.md.txt.
- No secrets/challenges/passwords in logs, Audit metadata or tracked evidence.

## Historical implementation checkpoints (superseded by final acceptance below)

- 2026-10-26: re-read current repository/report and confirmed pre-existing dirty files.
- Initial Web regression: 54 tests pass (11 files), including membership-independent
  route rendering, delivery wording, account-scoped keys, stale completion guards,
  Wizard counts and rejecting challenge-as-session payloads.
- Focused compiled-process HTTP integration + auth/delivery: 16 tests pass (4 files).
  Actual endpoints verify atomic concurrent SETUP provisioning/idempotency, invalid-
  owner rollback, legacy ownerless compatibility, disabled/failed delivery, foreign
  applicant denial, temporary-password challenge/no access/replay/parallel completion,
  previous access revocation, SLA tenant separation and tickets/new controlled404.
- Isolated migration rehearsal: all85 migrations pass, including074. Temporary
  goal070_tests database removed; shared PostgreSQL role snapshot unchanged.
- API and Web typecheck pass at this checkpoint; API build passes. Initial diffcheck
  passes. Full regression/release gates are in progress, not yet accepted.
- The first HTTP harness attempted in-process Nest boot under Vitest; dependency
  metadata was unavailable and boot failed. Replaced with actual compiled main.js
  process on an ephemeral loopback port; successful16-test run uses that process.
- Preview/browser/guide/cleanup/deployment acceptance: NOT RUN yet.

### Regression checkpoint (not final acceptance)

- First full isolated API run:186 passed,2 failed,2 optional skipped. Failures were
  existing Worker-test races: asserting fallback before reading the503 response,
  and aggregating only the first10 jobs while earlier scenarios left more work.
  Both assertions retained; fixed synchronization/bounded complete draining.
  Focused Worker rerun:3/3 pass, automatic10-second flush/recovery observed.
- API/Web builds and typechecks pass at this checkpoint. Web54/54 pass.
- A prematurely cancelled initial test invocation left one LOCAL obs069_host
  fixture. PostgreSQL directory creation08:14:37Z and fixture rows08:14:42Z matched
  this run (11:44 local), no live process/connections remained. Removed only that
  exact verified fixture; all obs069_/goal070_ temporary database count returned0.
  No Preview or main database/test records were removed.
- Guide source covers all eight educational findings. Preview-labeled28-page PDF
  generated; all28 rendered and four contact sheets inspected. No empty pages.
  Public website/PDF unchanged. Help runtime publication/Preview browser pending.
- Read-only Preview preflight: existing fe64140 release,84 migrations, API/worker
  active,7.2GiB free. Arandi active with unchanged baseline start2026-10-10 07:46:49Z.

### Additional safety audit

- Ordinary member-role replacement previously deleted ORG_OWNER implicitly.
  Retained protected Owner during ordinary role edits/import/reuse; only the
  existing explicit Platform owner-revoke command can remove it. Display editing
  excludes protected Owner from assignable roles. Regression added.
- Refresh results also bind to the original account identity, preventing a shared
  browser refresh cookie from silently switching another tab's signed-in account.
- Positive applicant test now uses real verification service + personal provisioning
  + existing membership + HTTP submit/review/approve. Added final-Audit-failure
  transaction rollback/retry, expired/wrong-purpose challenge, Directory-only
  reset denial, legacy credential compatibility and revoked-refresh regression.

## Final acceptance — 2026-10-27

### Supported Saba journey, not SQL provisioning

Preview `http://172.20.190.16:8088`, separate temporary slug
`saba-acceptance-070-1027`, legal/display names explicitly labeled GOAL-070.
Existing verified Saman retains personal+original Saba memberships. In Browser he
submits the global application, sees SUBMITTED, then APPROVED and «ورود به سازمان».
Real Platform Admin review/approval uses supported APIs; SETUP+Owner/Admin are atomic.
A second small SETUP fixture exercises the explicit Platform provisioning API with
Saman as owner. No verification/lifecycle/membership SQL inserts or auth bypass.

Supported APIs configure four members,9 categories/24 subcategories, IT team/Sahra,
all-department assignment, Asia/Tehran and workdays1,2,3,6,7 /480–1020. Browser saves
NORMAL SLA60/480/warning30→SUPERVISOR. Wizard shows6 completed/4 optional skipped/
0 pending and ready. Published Setup Help opens/readable RTL; Saman performs Go-Live.

Separate generated Melika/Sahra/Jalal fixtures do not reuse/reset original accounts.
Melika's temporary login shows only a restricted password-change screen; no tenant
UI/session. First change is completed through the actual supported API, NOT automated
UI credential entry. Normal subsequent Browser login succeeds. Compiled HTTP tests
prove wrong-purpose/expired/replay/parallel rejection, exactly one completion and
revocation of previous access/refresh. Legacy users default unrestricted; Directory
credentials and membership reuse never acquire a flag implicitly.

Browser `/o/{slug}/tickets/new` opens canonical `/tickets?compose=1`. Melika explicitly
submits network/wifi ticket5142; automatic Sahra assignment and SLA appear. Supported
API Sahra starts work, posts one public answer and resolves it; Browser Melika sees
RESOLVED/answer/reopen. API Jalal submits software ticket5143; Sahra starts work and
writes one internal note. Browser Jalal sees IN_PROGRESS/conversation0, no internal
text; Browser Sahra sees the note. Four actual negative API checks reject cross-
requester, requester Admin and foreign-tenant requests (401/403/404).

Same-tab Melika search→logout→Jalal shows empty queue/global query and only Jalal's
ticket. Unit tests additionally prove scoped keys, late-result invalidation and
account-bound refresh. Platform ownerless filter finds original active `azla` without
promotion; member list/shell show «مالک سازمان» instead of ORG_OWNER. Existing quick-
ACTIVE remains an explicitly advanced option, off by default. Legal name is only
descriptive metadata, never a merge/unique-identity key. DEC-066 records boundaries.

### Defects discovered during actual acceptance

1. HTTP Preview lacks secure-context-only crypto.randomUUID. First Browser submit
   failed before HTTP. Shared requestKey now uses cryptographic random bytes and
   UUIDv4 bits when needed, never Math.random. Two regressions and actual successful
   subsequent Browser submit prove the correction in applicant/Platform/Admin scope.
2. Wizard links changed URL but outer App retained its initial pathname decision.
   SetupRoute now uses router location. Regression and Browser Wizard→SLA→Wizard
   pass without manual reload.
3. Long initial-owner options overflowed the compact creation grid. Scoped min-width0
   and bounded select fix intrinsic sizing; CSS regression and final four-width
   measurements pass. Failed initial measurements remain recorded, not relabeled.
4. Non-Platform login on the previous account's /platform URL could render a blank
   basename mismatch. Explicit denied state now offers authorized workspace selection;
   API permissions unchanged. Regression added.

### Browser and before/after evidence

Before: `output/saba-preview-walkthrough-report.md` records missing application CTA,
manual verification/SETUP/SLA fixtures,6-of10 count, raw Owner, stale search/new500.
Source review independently confirmed each mechanism before edits.

After: actual authenticated checks at375/768/1024/1440 for application, Wizard, SLA,
Wizard Help, first-login gate, requester ticket, Platform delivery and SETUP form;
also unauthenticated registration warning. All nine final surfaces are RTL with
document.scrollWidth <= clientWidth at all four widths. Registration says delivery
is unconfigured; Platform says disabled, not Inbox success. No new signup fixture
or test-verification bypass was required for these UI checks.

Artifacts: `output/goal070-browser/measurements.json`. Initial Platform form failures
are superseded by `platform-setup-fixed`. Browser full-page capture produced clipped
horizontal composition despite correct DOM geometry; those images are NOT visual
acceptance proof. Inspected actual viewport captures retained instead:
`platform-setup-viewport-{375,768,1024,1440}.png` and
`registration-disabled-viewport-{375,768,1024,1440}.png`. Actual AX observations
establish submitted/approved request,6/4/0, successful SLA save, Persian Owner and
5142/5143 role-isolated workflows. No narrower UI assertion substitutes for API tests.

### Education and Help

All eight report corrections are in guide/PDF: mandatory precheck; legal/display/
slug examples; canonical HTTPS+sender+SMTP/Webhook and actual delivery validation;
permanent applicant CTA/history; Composer inside tickets; immediate password change/
no public messenger; staff-only warning/role test; required/optional/skipped Go-Live.
Content/path/FAQ/progressive-disclosure/security verifier PASS. Preview-labeled
28-page PDF generated, all28 pages rendered and four contact sheets inspected.
Source/PDF overlay is pending public publication; arandi.io website/PDF unchanged.

Supported publish-help-catalog.ts with actual active Platform Admin:0 created,
6 revised,0 unchanged. Slugs: getting-started, organization-members-csv,
organization-setup-wizard, platform-organization-applications, sla-business-calendar,
ticket-lifecycle. Runtime Help and previous revisions preserved. Wizard Trigger
resolves published organization-setup-wizard with the new counts explanation.

### Migration, deployment and cleanup

Preview before fe64140/84 migrations. Jupiter-only backup restored into disposable
jupiter_goal070_saba_rehearsal;074/85 total pass, legacy flags false/version0,
legal_name null and original tickets preserved; rehearsal DB dropped. Encrypted
local backup round-trip verified in ignored securedata. Only Jupiter API/worker
initially stopped/restarted; no shared PostgreSQL/Arandi restart. Additive columns
preserve old-binary rollback. Web candidates separately built/atomically selected.
Final candidate `/opt/jupiter/releases/goal070-saba-v5`, source archive SHA256
`a1921c7d87d5b72cd6aa1673e1f015f8dbe3299c111eb041b26c4d14ba1a5095`.
Candidate label is NOT represented as a Git hash. Packaging excludes secrets and
exports the two unrelated dirty files from HEAD. Main remains unchanged.

Scoped cleanup requires exact UUIDs/two slugs/three usernames and rejects foreign
memberships/commercial usage. Normal FK/triggers, one transaction; no RLS/trigger
disable, replication-role switch or sequence reset. Two organizations, their
application/transitions/memberships/setup/tickets and three generated users removed.
Ignored generated credential file deleted. Permanent Audit and Help/history retained;
explicit cleanup Audit recorded. No original password reset.

At initial cleanup all checked fingerprints matched: both original Saba orgs,
4 accounts,4 memberships/5 roles,9 categories/24 subcategories, team/calendar/SLA/
rule/setup, original tickets5140/5141 and checked messages/activity/clocks.
Final readback after the live Worker continued naturally differs in SLA alert fields:
ticket5141 warning04:12:35.681Z, breach/escalation04:42:35.722Z on2026-10-27.
These are normal overdue-ticket events, not fixture writes; they were NOT rolled
back to avoid duplicate alerts. A second restore of the pre-release backup into
disposable jupiter_goal070_final_compare proves87 tenant tables byte-equivalent
(including original internal notes, assignments and team memberships). Only
audit_logs, user_notifications and ticket_sla_clocks differ; excluding warning_at/
breached_at/escalated_at, clock business fields are identical. Compare DB dropped.
Evidence: output/goal070-backup-compare.json. Original active ownerless azla stays.
Arandi active, start2026-10-10 07:46:49UTC/NRestarts0 unchanged. No arandi_platform/
codex_test DB query/write, shared role/ACL change, main or Arandi publication.
Two old RESERVED AI actions retained unchanged, no acceptance AI consumption.
Final Preview about6GiB free. Unrelated gateway/training/output/tmp/AGENTS.md.txt kept.

### Executed gates / explicit limitations

- API/Web typecheck and production builds PASS. Existing Vite>500KiB warning nonfatal.
- Final full isolated API42 files:191 PASS,2 optional skipped(193 total), exit0;
  `output/goal070-api-final-2.log`. Skips are separate Observability browser/performance
  flag scenarios, not onboarding/security tests.
- Web final source60/60 in12 files, exit0: `output/goal070-web-final-3.log`.
- All85 migrations rehearsed by isolated runner; temporary DB removed, shared-role
  fingerprint unchanged; separate Preview restore rehearsal PASS.
- Guide content/security verifier and git diff --check PASS; repeat staged check.
- Intermediate API host-listener wait hit ECONNREFUSED. No assertion/timeout changed:
  focused actual host2/2 and complete subsequent191-test run pass. Earlier Worker
  synchronization fixes preserve assertions and wait for actual503/complete draining.
- SMTP/Webhook connection, sender/DNS, Inbox/Spam and main HTTPS email lifecycle
  are NOT accepted by this Goal. Preview remains DISABLED; configuration validity
  and provider acceptance are not successful delivery or verified email.
- No next Goal, main rollout, retroactive flag, implicit owner promotion, provider/
  commercial contract change or original tenant rewrite.

### Actual Git delivery and final runtime verification

Code commit3cd85c4d83e3d27c9a23b0461a7a7a6e75626126 pushed; origin/main exact SHA
verified at that delivery. GitHub CI40453875707 completed SUCCESS: full workspace
build, lint, typecheck, isolated migration and tests. URL:
https://github.com/samanchalian2/Jupiter/actions/runs/40453875707
No runtime code changed after that green commit; this follow-up records evidence only.
286 runtime-source/migration/Help files on Preview match that code commit after
line-ending normalization. RELEASE_COMMIT records the actual code SHA. API/worker
restarted on the final candidate, readiness PASS, Arandi unchanged. Final admin
Help readback confirms the six published revisions (3/3/3/4/3/3 by slug), while the
reader correctly returns404 for a role-ineligible article; audience rules unchanged.
Temporary fixture credentials absent; only original Saman personal/Saba memberships
remain in the Browser chooser. User-owned dirty edits remain uncommitted.
