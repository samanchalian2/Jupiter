# Next Task

## GOAL-069 — Reusable Observability Hub (IN PROGRESS)

Bounded retention (DEC-040/migration 069) now has policy/status APIs, hourly
durable jobs/continuations, parent/child scope safety, immutable Audit and a
Console form. The local zero-expiry batch completed with all counts zero.
Next verify authenticated responsive maintenance UI, then implement the full
self-monitoring set and missing alert sources/flood handling, and complete the
independent Browser/offline/Help and remaining full-scope acceptance. Maintenance
status explicitly is NOT complete self-monitoring; do not shrink that requirement.
Extend the current 44-operation OpenAPI parity whenever adding further routes.

The public OpenAPI and executable C#/Python examples now exist and are tested
against real HTTP/PostgreSQL, including actual separate-process replay/retry and
credential/redirect failure behavior. Keep the document synchronized whenever
remaining requirements add routes. Continue this same Goal with missing alert
types/flood controls, retention/self-monitoring, richer operational workflows,
the independent Browser reference app and real IndexedDB offline/logout/scope
acceptance, runtime Help publication and final requirement-by-requirement QC.
Do not equate these backend reference clients with the full Browser reference.

2026-10-18: durable recipient inbox, delivery worker, scoped/read APIs,
Console inbox and Jupiter NotificationService source adapter are implemented.
Continue the same Goal: complete alert trigger breadth (important feedback,
pipeline/worker failure), explicit flood/recipient-bound handling and final
notification acceptance, then maintenance/self-monitoring, OpenAPI and the
remaining A–I requirements. Do not declare all alert requirements accepted
merely because durable delivery works. No Preview/main promotion.

2026-10-17 continuation: the provider-choice blocker is resolved by the owner's
explicit GapGPT settings and 100,000 monthly token budget. Local configuration
and real successful bounded AI calls are now established. Do not ask for an
OpenAI key or silently switch providers. Continue the full Goal's remaining
requirements: richer evidence/analytics, complete
incident management, alerts/delivery, maintenance/retention/self-monitoring,
OpenAPI, second reference consumer, actual offline/browser identity acceptance,
Product Help and final requirement-by-requirement QC. AI/Console implementation
alone does not complete the Goal. Local workspace cleanup/management amendment
is recorded in DEC-039 and `docs/LOCAL_WORKSPACE_ADMIN_EVIDENCE.md`.

Unknown-usage Console control is now implemented and locally browser-checked
without submitting invented counts. Incident notes/assignment and related
Issue/Feedback/AI projection are implemented with real DB security/Audit tests.
Next continue alerts/delivery, maintenance/retention/self-monitoring, remaining
incident/analytics completeness, OpenAPI and independent-reference/offline/Help
acceptance. Do not shrink the original A–I Definition of Done.

Current continuation (2026-10-17): host adapters and the independent Console
now exist. Read the latest Evidence checkpoint before acting. Continue this
same Goal with independent Investigator configuration/encrypted credentials,
atomic token budget/scheduling/evidence validation, alert delivery and
retention/self-monitoring; complete Console gaps and API/OpenAPI, then real
second-consumer/offline/identity/browser/Help acceptance and final QC. Do not
treat the earlier foundation checklist below as the current implementation
boundary. Local API 3000 and Jupiter Web 5174 are the acceptance services;
5173 belongs to another application and must not be stopped or repurposed.

Implement the approved Observability plan in internal phases A–I. The full
scope and acceptance checklist are in `docs/GOAL_069_EVIDENCE.md`; DEC-038
records boundaries, PostgreSQL queue, independent permissions, offline identity
and operations-AI policy. Local development/acceptance only. Complete all gates,
commit/push and verify remote SHA, then stop for owner audit. GOAL-059 remains
BLOCKED. Historical GOAL-060 Personal Service is not renamed or overwritten.

Implemented checkpoint: contracts/core, Browser/Node SDKs, React/Nest adapters,
Registry/credentials, RLS migration, atomic ingestion and leased queue. Continue
with full OpenAPI and Jupiter identity/capture adapters, then
feedback, engines, Console, AI and independent-client/browser acceptance. Do not
equate foundation tests with complete platform acceptance. Generic Node HTTP
ingestion/Registry/health routes now pass real HTTP plus PostgreSQL tests
(25 server tests; Hub total 65). CORS/host integration and full public API
coverage remain required.

Operational checkpoint: migration 064 and Feedback/Issue/Monitoring services
are implemented. Feedback HTTP submission/own tracking, targeted masking,
internal-reply exclusion, Application/environment isolation, idempotent
aggregation, browser-severity normalization and one burst Incident/Alert are
verified. Latest complete gate: 146 API/23 Web/73 Hub tests, 75-migration
rehearsal. Continue the full same Goal: complete all rule scenarios (including
actual release-change/baseline checks), issue management and mutation Audit;
then public operational queries/OpenAPI, host/Jupiter adapters, Console, AI,
offline/reference acceptance, Help and final QC. No target host deployment.

## GOAL-068 — Platform Administration UX redesign (complete)

The complete Platform UX redesign and its shell-navigation remediation are
deployed and accepted on Preview and the canonical main host through commit
`c2aeedb`. The canonical immutable release is
`c2aeedb-rtl-drawer`. Desktop Sidebar and right-edge mobile Hamburger/Drawer acceptance
passed for both tenant-member and Platform-only administrator contexts; no
promotion remains. Do not start another repository Goal automatically.

## Personal Service program — COMPLETE

GOAL-060 through GOAL-066 are complete. Cross-domain acceptance, migration
rehearsal, isolation/security checks, authenticated responsive browser coverage
and fixture cleanup are recorded in `docs/GOAL_066_EVIDENCE.md`.

No repository implementation Goal is approved to start automatically. Preserve
the established architecture and wait for an explicitly scoped next Goal. Do
not treat the Personal Service completion as GOAL-059 staging acceptance.

GOAL-067 safe organization deletion is complete and deployed at canonical
release `1b1b667-safe-org-archive`. It adds reversible, audited archival and
restore-to-suspended controls without physical tenant data deletion.
Authenticated acceptance passed and its temporary fixture was removed.
Evidence: `docs/GOAL_067_EVIDENCE.md`. Do not add physical purge or start
another Goal without an explicit owner request.

The Platform organization/application responsive-list and review-CTA
remediation is complete at `2867dd1`. Preview and the canonical main-host
release are current; no further promotion remains. GOAL-059 remains blocked by
its independent infrastructure gates.

The organization-application applicant UX is now one-step at commit `51b64d9`:
the single primary action creates/updates and immediately submits, including
resubmission after a request for information. Internal lifecycle states and
existing APIs remain backward-compatible. The tested Web bundle is live on
Preview and the canonical main host; no further promotion remains.

The icon-button hover-contrast remediation is committed at `93e41dd` and is
deployed to both the IP Preview and the owner-authorized canonical main-host
publication. No further promotion action remains for this remediation.

The broader interaction-state audit is also complete at `5c6eb6e`: every
strong brand Hover/Focus/Active rule is guarded by a source-level regression
test and the tested Web bundle is live on Preview and the canonical main host.
No follow-up deployment remains for this audit.

The public-registration and verification-provisioning RLS defects are
remediated. The canonical main host runs release `fe39351-verify-rls`: account
creation returns HTTP 201, SMTP handoff/DKIM signing and real mailbox receipt
are confirmed, and personal membership provisioning now selects the resolved
tenant context while remaining subject to the runtime RLS role. Preview
remains non-delivering. The failed pre-fix consumption transaction rolled back,
so the account owner's same unexpired link remains usable for the final
user-visible retry. Do not expose the DKIM private key or verification token.

## Deferred deployment gate — GOAL-059 remains BLOCKED

An owner-authorized user-facing publication is operational at the canonical
`https://jupiter.arandi.io` hostname with an automatically renewable dedicated
TLS certificate. The former port-based endpoint redirects to the canonical
hostname. It is isolated from the co-hosted Arandi application
by OS user, filesystem path, system services, loopback API port, Nginx listener,
PostgreSQL database and role. Use the local workstation for development and
initial tests, the authorized IP host for preview acceptance, and update this
main-host publication only after an explicit owner instruction. This deployment
does not replace the remaining managed-secret, immutable-provenance,
backup/restore, monitoring and Windows Connector acceptance gates.

An authorized, HTTP-only IP preview is operational with the isolated full
Jupiter dataset, loopback-only API and dedicated system services. It is not an
official staging acceptance or a substitute for a canonical deployment.
The authorized preview host is synchronized through application commit
`5c6eb6e`; migrations 057–060 and the Personal Service Help catalog are live,
its Web, health and readiness endpoints return HTTP 200, and the Persian login
renders the canonical logo without horizontal overflow. Do not modify any
unrelated host service or database.
An observed expired-access-token race may transiently surface the first
dashboard request as HTTP 500 before refresh succeeds; address it only in a
separately scoped Goal, not by expanding GOAL-059.
The same preview has passed an authenticated regression pass for dashboard,
tickets, knowledge, reports, organization administration, branding, Help and
Platform routes. Optional-logo fallback, sequential tenant-client queries and
401 normalization for invalid/expired access tokens are deployed. No similar
5xx or PostgreSQL overlap warning remained after the post-ready route sweep.
The canonical mobile Header and drawer both show the full Jupiter
planet-and-wordmark; the symbol-only crop remains limited to the collapsed
desktop sidebar.
The Login placement also uses a verified 184×60 wordmark frame that trims the
source PNG's transparent margins without clipping its visible artwork.
Resume GOAL-059 only when the authorized staging ingress/DNS/TLS, immutable image
registry, secret injection, managed backup/restore and monitoring access,
rollback ownership, and Windows Connector host are available. Use
`docs/GOAL_059_EVIDENCE.md`; the personal-service product sequence does not
claim or replace staging acceptance.

The 2026-09-16 authorized server audit found a reusable host, but canonical
`jupiter.pnsoffice.ir` does not yet resolve there. Publish the protected-host
IPv4 `A` record before continuing; HTTPS/TLS and an immutable-image staging
deployment have not been attempted. The temporary IP preview is not an
official staging substitute.

## GOAL-058 — Full End-to-End Business Acceptance (complete)

GOAL-058 accepted the integrated business flows through supported paths, a
three-tenant isolation journey and authenticated RTL browser sweep. It repaired
the temporary Setup-fixture cleanup order discovered during acceptance, removed
all temporary data, and passed final integrity/migration/test/typecheck/build
quality gates. Evidence: `docs/GOAL_058_EVIDENCE.md`. GOAL-059 is not started.

## GOAL-057 — Appearance Theme Migration & Custom Primary Validation (complete)

GOAL-057 added tenant-safe, audited Custom Primary validation, inheritance and deterministic
white/dark foreground selection. Its reset-semantics remediation now makes
«حذف رنگ سفارشی» preserve preset, density, radius and logo. Quality gates
passed. Its historical `#315399` canonical color is superseded by the current
the 2026-10-05 Lavender/Beige theme remediation. Existing appearance presets and
tenant overrides remain backward-compatible; the visual remediation does not
change GOAL-059 evidence or status.

## GOAL-056 — Help Content Completeness (complete)

GOAL-056 با کاتالوگ ۱۵ مقاله‌ای، publication runtime اختلاف‌محور، registry feature/route، جست‌وجوی فارسی سبک، دسته‌بندی Help Center و Triggerهای contextual پذیرفته شد. پذیرش نهایی Setup Wizard در یک سازمان موقت `SETUP`، با عضو مجاز `ORG_OWNER` و مسیر canonical انجام و سپس fixture به‌طور کامل پاک شد؛ Help Trigger مقالهٔ `organization-setup-wizard` را در RTL و بدون overflow باز کرد. Evidence: `docs/GOAL_056_EVIDENCE.md`. GOAL-057 آغاز نمی‌شود.

## GOAL-055 — Organization Setup Wizard Completeness

GOAL-055 remediation is accepted: the legacy tenant-setup completion endpoint
delegates only to canonical Go-Live, and drift/concurrency coverage passed.
It does not start GOAL-056. Evidence: `docs/GOAL_055_EVIDENCE.md`.

## GOAL-054 — Directory Connector Operational Completeness

GOAL-054 با remediation جفت‌سازی مجدد کامل شد. Connector لغوشده فقط با
عملیات صریح owner/admin و کد یک‌بارمصرف هش‌شده می‌تواند در همان record دوباره
paired شود؛ credential و کدهای قدیمی همواره نامعتبر می‌مانند. Evidence:
`docs/GOAL_054_EVIDENCE.md`. طبق محدودهٔ مصوب، GOAL-055 آغاز نمی‌شود.

GOAL-053 کامل شد. Evidence: `docs/GOAL_053_EVIDENCE.md`.

GOAL-052 کامل شد. طبق محدودهٔ مصوب، Goal بعدی آغاز نمی‌شود.

GOAL-050 remediation پذیرش را گذراند. طبق محدودهٔ مصوب، Goal بعدی آغاز نمی‌شود.

## Master Upgrade complete

GOAL-030 through GOAL-048 are complete. The final local acceptance, migration
rehearsal and release-gate evidence is recorded in `docs/GOAL_048_EVIDENCE.md`.

Before a production release, execute the staging-only gates in
`docs/STAGING_RELEASE_CHECKLIST.md`; these require the deployment environment
and are not repository implementation work.
