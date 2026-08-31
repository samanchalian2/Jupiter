# Execution Plan

## GOAL-001 — Project control plane and executable MVP roadmap

**Status:** DONE

**Purpose:** establish the versioned source of truth needed to deliver the
ticketing MVP safely in small, testable Goals.

**Scope:** root agent instructions; architecture, domain, security, AI,
testing, risks, master plan, execution plan, current state, next task, and
handoff documentation.

**Out of scope:** application source, dependencies, database schema/migration,
network services, and production secrets.

**Acceptance:** documents define approved architecture, roles, boundaries,
ticket lifecycle, tenant control, AI behavior, risks, and a dependency-ordered
Goal sequence; exactly one next Goal is prepared.

**Validation:** repository file/readability audit and Git diff review.

**Next Goal:** GOAL-002.

## GOAL-002 — Foundation and local development runtime

**Status:** DONE

**Purpose:** make a reproducible local TypeScript workspace capable of running
an API health endpoint and RTL web shell.

**Scope:** NestJS/React workspace, shared tooling, Docker Compose development
services, health endpoint, lint/type/test scripts, environment templates, and
CI baseline.

**Out of scope:** authentication, migrations, tenant data, ticket features,
AI calls, and real external credentials.

**Prerequisites:** Node.js LTS, npm/pnpm, and Docker must be available.

**Acceptance:** documented commands run API, web shell, and local services;
health check and baseline tests pass; no secret is tracked.

**Risks:** host toolchain unavailable; resolve before implementation.

**Validation:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`
passed on 2026-08-05. The built API returned `jupiter-api/ok` from
`GET /api/v1/health`. Docker Compose was not run because Docker is not
available on PATH.

## GOAL-003 — Tenant-aware identity, access, and organization directory

**Status:** DONE

**Depends on:** GOAL-002 and user-provided database access when migrations are
ready.

**Scope:** authentication, memberships, RBAC/policies, tenant context/RLS,
organization, departments, locations, disciplines, and taxonomy foundations.

**Done:** migration and isolation/security tests pass against the authorized
database; no cross-tenant read/write is possible.

**Validation:** PostgreSQL 18.4 local connection and migration succeeded.
RLS was verified with two organizations: each context saw only its own
department and an unknown context saw zero records.

## GOAL-004 — Ticket lifecycle and assignment

**Status:** DONE

**Depends on:** GOAL-003. **Scope:** draft, submit, fixed lifecycle,
classification, priorities, assignment, transitions, and audit history.

**Done:** authorization and lifecycle integration tests pass.

**Validation:** Migration 002 and permission Migration 003 applied. Integration
test passed for draft creation, submission, manual assignment, and transition
to IN_PROGRESS under RLS.

## GOAL-005 — Conversation and activity history

**Depends on:** GOAL-004. **Scope:** requester/expert messages, internal notes,
activity timeline, and SSE notifications. **Done:** secrecy and realtime tests
pass.

**Status:** DONE

**Validation:** Migration 004 applied. Integration tests verified public
requester/expert messages, staff-only internal notes, requester timeline
filtering, append-only record permissions, tenant RLS isolation, and
recipient-scoped SSE event delivery.

## GOAL-006 — Secure attachments and media

**Status:** DONE

**Depends on:** GOAL-004. **Scope:** S3 adapter, signed uploads/downloads,
validation, limits, metadata. **Done:** authorization and invalid-file tests
pass.

**Validation:** Migration 005 applied. Integration tests covered allowlisted
media, filename and size limits, storage metadata mismatch rejection,
authorized downloads, and tenant isolation.

## GOAL-007 — Role portals

**Depends on:** GOAL-005/006. **Scope:** responsive RTL requester, expert,
supervisor, and organization-admin flows. **Done:** E2E primary flows pass.

**Status:** DONE

## GOAL-008 — AI gateway contract

**Status:** DONE

**Depends on:** GOAL-003/004. **Scope:** provider abstraction, protected
platform configuration, prompts, audit/usage, redaction, queue integration.

## GOAL-009 — Text AI review and initial response

**Status:** DONE

**Depends on:** GOAL-008/007. **Scope:** structured analysis, review/confirm,
AI-labelled response, fallback. **Done:** provider success/failure E2E passes.

## GOAL-010 — Voice transcription and asynchronous jobs

**Status:** DONE

**Depends on:** GOAL-006/009. **Scope:** voice transcription, retry/dead-letter
visibility and review flow. **Done:** retry and manual fallback tests pass.

## GOAL-011 — Search, rating, and basic dashboards

**Status:** DONE

**Depends on:** GOAL-007. **Scope:** tenant-scoped search/filter, ratings,
basic workloads/operational views. **Done:** role and tenant tests pass.

## GOAL-012 — MVP hardening and release readiness

**Status:** DONE

**Depends on:** GOAL-010/011. **Scope:** integration/security/performance
suite, observability, backup/restore runbook, release checks. **Done:** all
release gates documented and passing.

## GOAL-013 — Secure per-organization OpenAI-compatible configuration

**Status:** DONE

**Depends on:** GOAL-008/012. **Scope:** encrypted organization API key,
provider Base URL, independent analysis/transcription models, Platform Admin
API/UI, explicit credential removal, provider host policy, direct structured
Chat Completions adapter, audit safety, migration utility and ADR.

**Validation:** migration 022 applied; AES-GCM tamper/round-trip, masking,
audit redaction, URL policy, tenant AI gateway and provider contract tests pass;
API/web typechecks and production builds pass; authenticated browser evidence
shows a configured key without its value and successful blank-key preservation.

## GOAL-014 — Pre-ticket text and voice intake pipeline

**Status:** DONE

**Depends on:** GOAL-013/006. **Scope:** tenant-scoped intake sessions,
temporary presigned voice upload, transcription and analysis states, structured
taxonomy-validated suggestions and confidence, idempotency, final ticket/audio
attachment handoff, expiry and object cleanup.

**Validation:** migrations 023–027 applied; tenant/owner isolation, idempotency,
MIME/size/duration rejection, transcription ordering, redaction, catalog and
confidence filtering, retry/manual fallback, atomic attachment/provenance and
expiry deletion pass in integration tests. The complete release gate passes.

## GOAL-015 — Smart ticket composer and acceptance E2E

**Status:** DONE

**Depends on:** GOAL-014/007. **Scope:** description-first composer, AI and
microphone toolbar, one-minute recorder, processing/retry states, AI provenance
badges, low-confidence guidance, responsive behavior and 375/768/1440 browser
acceptance coverage.

**Validation:** the full release gate passes with 41 API and 9 Web tests.
Authenticated REQUESTER acceptance confirms initial description focus, secure
AI success/failure behavior, manual editability, low-confidence guidance,
microphone permission state and zero overflow at 375, 768 and 1440 px. The
deterministic loopback provider was removed from active configuration after the
test. Evidence is recorded in `docs/GOAL_015_EVIDENCE.md`.

## GOAL-016 — Saved AI settings connection diagnosis

**Status:** DONE

**Depends on:** GOAL-013. **Scope:** a Platform Admin-only test of the saved
organization credential, Base URL and analysis model; safe diagnostic outcomes,
audit trail, platform UI feedback and automated coverage. No requester ticket,
intake session, configuration value or raw provider message may be exposed or
changed by the test.

**Validation:** successful, invalid-key, billing/quota and unauthorized paths
are unit-tested. The local saved Jupiter Demo Organization configuration was
verified through the in-product endpoint against the GapGPT OpenAI-compatible
service, followed by a direct `ticket-intake.v1` structured-analysis request
that returned a valid title and NORMAL priority. API/web typechecks and the
production build pass.

## GOAL-017 — Catalog governance and IT/service starter template

**Status:** DONE

**Scope:** an Organization Admin-approved, idempotent IT and organizational
support catalog template; catalog readiness; a tenant-RLS pending suggestion
queue and auditable review paths. The template must not invent organization
departments or locations.

**Validation:** migration 028 applied; the API integration test verifies
administrator-only access, repeatable installation, ready category/subcategory
counts and cross-tenant suggestion isolation. API typecheck, all API tests,
Web tests and production Web build pass.

## GOAL-018 — Tenant title library and typed ticket-tag vocabulary

**Status:** DONE

**Depends on:** GOAL-017/014. **Scope:** approved title reuse, pending title
and typed tag candidates, safe legacy-tag migration, `ticket-intake.v2`, and
server validation/provenance. An ADR is required before the contract change.

**Validation:** migration 029 applied; API integration coverage verifies active
tenant vocabulary input, title reuse, pending new-tag creation only at final
draft creation and admin review. All 50 API tests, API typecheck, Web tests and
production Web build pass.

## GOAL-019 — Smart composer, vocabulary management, search and reporting

**Status:** DONE

**Depends on:** GOAL-018/015. **Scope:** requester tag control and provenance,
Organization Admin vocabulary review UI, tag-aware queue/search/reporting and
responsive end-to-end acceptance.

**Validation:** API typecheck, 51 API tests (including typed tag
draft/search/filter integration), Web typecheck, 9 Web tests, and API/Web
production builds pass. An authenticated browser walkthrough at 375/768/1440
px confirmed no horizontal overflow, responsive controls and a real provider's
concise non-copy title. The empty demo organization correctly withheld category
and tag suggestions; its approved starter-template installation remains a
tenant configuration action. See `docs/GOAL_019_EVIDENCE.md`.

## GOAL-020 — Multimodal guided ticket-intake conversation

**Status:** DONE

**Scope:** ordered text and voice intake messages, immutable raw source text,
separate AI interpretation/primary issue/secondary issue, non-blocking
clarification, optional secondary-ticket proposal, multiple secure voice
attachments, v3 provider contract and responsive requester conversation UI.

**Acceptance:** text and voice share one guided conversation; ambiguity can
produce a concise optional question; only explicit user action creates a second
ticket; raw input and AI interpretation remain separate; all message and
attachment paths preserve tenant/owner isolation.

**Validation:** migration 030 applied locally. API integration coverage verifies
raw text/voice separation, a voice transcript, separate interpretation, primary
and secondary issue, optional clarification and final voice attachment handoff.
All 52 API tests, 11 Web tests, API/Web typechecks and production builds pass.

## GOAL-021 — Confirmed AI secondary-ticket batches

**Status:** DONE

**Scope:** v4 proposals, server-owned identifiers, requester confirmation,
atomic primary-plus-secondary submission, link auditing and source isolation.

## GOAL-022 — Reviewable secondary proposals and stable smart completion

**Status:** DONE

**Scope:** `ticket-intake.v5` distinguishes a low-confidence secondary
proposal from an invalid one. A server-validated title, standalone description,
priority and taxonomy make it explicitly selectable, with a review warning in
the card and final confirmation. A context-bound follow-up message or voice
capture triggers a fresh conversation analysis and invalidates older proposal
selections. The smart-complete control remains in place with a processing state;
the composer only collapses after successful analysis.

**Validation:** API integration coverage creates a low-confidence but
structurally-valid secondary ticket atomically with the primary ticket. All 53
API tests, Web tests, API/Web typechecks and production builds pass. Browser
acceptance confirms the persistent in-place processing control, disabled
competing controls and the post-success collapsed composer at desktop and 375px
with no horizontal overflow.

**Follow-up:** `ticket-intake.v6` preserves the first established primary issue
as a context anchor through targeted secondary clarification. An API integration
test verifies that the follow-up provider receives the anchor; 54 API tests and
the production API build pass.

## GOAL-023 — Persistent conversational intake layout

**Status:** DONE

**Scope:** after the first requester message, replace the collapsed follow-up
composer with a persistent compact chat-style text/voice/attachment surface;
retain the separate explicit ticket-submit path; move title, category and
advanced fields into a collapsible request-details section; keep assistant
clarifications visible once in the conversation stream.

**Validation:** Web typecheck, 11 Web tests and the Web production build pass.

**Next Goal:** GOAL-025 — navigation interaction polish.

## GOAL-024 — Organization Smart Intake control and unified send

**Status:** DONE

**Scope:** a separate tenant Smart Intake policy controlled by Organization
Admin, with platform-only model/key configuration retained; one explicit
composer send control that optionally invokes analysis; and manual text/voice
continuity when the policy is disabled.

**Validation:** Migration 032 applied locally. API integration coverage verifies
Org Admin authorization, unavailable configuration rejection, effective intake
capability and manual draft fallback. API typecheck, 56 API tests, Web
typecheck, 11 Web tests, and API/Web production builds pass.

**Next Goal:** GOAL-025 — navigation interaction polish.

## GOAL-026 — Cancel an unsubmitted requester intake

**Status:** DONE

**Scope:** Provide a confirmed requester-facing «انصراف از پیش‌نویس» action
that destroys only an owner-scoped, unconsumed temporary ticket-intake session.
It must remove temporary voice objects, raw conversation and AI output, clear
pending intake processing, preserve an audit without request content, and
never cancel a submitted ticket.

**Validation:** API integration coverage verifies owner isolation, removal of
legacy and conversation voice objects, session/message deletion, pending event
completion and safe audit metadata. Web typecheck/build cover the confirmation
and return to requester history.

## GOAL-030 — Master Upgrade program baseline and architecture decisions

**Status:** IN VALIDATION

**Depends on:** GOAL-029 and approved Master Upgrade Specification.

**Scope:** create the authoritative upgrade plan; evaluate and select the
additive identity evolution; decide public-account verification; define exact
application/lifecycle contracts; record legacy-owner, tenant-route, connector,
commercial metering, Assist and Help boundaries; synchronize `.ai` records and
Persian Help impact.

**Out of scope:** production source, database migrations, API contracts,
dependencies, runtime routes, and user-visible product behavior.

**Validation:** documentation consistency review confirms
`UPGRADE_MASTER_PLAN.md`, DEC-018 through DEC-027, current state, next task,
architecture/domain/security/test strategy and GOAL-030 evidence agree. No
application code or migration changed.

**Next Goal:** GOAL-031 — Selected identity evolution and organization
application foundation.

## GOAL-031 — Selected identity evolution and organization application foundation

**Status:** DONE

**Depends on:** GOAL-030.

**Scope:** implement the additive identity decision in DEC-018; preserve legacy
login/refresh behavior; add the exact OrganizationApplication lifecycle and
its tenant-safe, audited foundation; prepare public-account verification
storage/notification abstraction according to DEC-019. Include the required
data-preserving migrations, REST v1 contracts, authorization, RLS, API tests,
Persian Help impact, `.ai` updates and evidence.

**Out of scope:** public application UI, approval/provisioning, tenant routing,
directory connector, commercial behavior, Assist, platform appearance and
runtime Help Center.

**Acceptance:** existing email/username authentication remains compatible;
directory users without email are representable without AD credentials;
application transitions use exactly `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`,
`NEEDS_INFORMATION`, `APPROVED`, `REJECTED`, `CANCELLED`; cross-tenant access,
unauthorized transition, token replay and legacy-login regressions are tested.

**Validation:** migration 033 applied locally. The API integration suite passes
60 tests, including legacy and additive identity authentication, token hashing
and replay denial, verification-gated submission, idempotent transitions,
applicant isolation and directory-principal RLS isolation. API typecheck and
build pass. See `docs/GOAL_031_EVIDENCE.md` and
`docs/ORGANIZATION_APPLICATION_API.md`.

**Next Goal:** GOAL-032 — Public organization application experience and verification delivery.

## GOAL-032 — Public organization application experience and verification delivery

**Status:** DONE

**Depends on:** GOAL-031.

**Scope:** deliver the Persian RTL public registration, sign-in, email
verification and organization-application experience on top of the GOAL-031
REST foundation; provide a deployment-configured verification delivery adapter
and safe local/test delivery workflow; allow applicants to resume drafts and
view their own status without tenant membership.

**Out of scope:** Platform Admin review/approval, tenant provisioning,
`/o/{slug}` routes, owner assignment, directory sync, commerce, Assist and
runtime product Help Center.

**Acceptance:** an unauthenticated person can create an account, receive or
safely exercise verification in local/test deployment, create/resume/update
their application, submit only after verification, cancel where allowed and
sign in without crashing the existing tenant shell. Persian help impact,
responsive 375/768/1024/1440 checks, API/Web tests and evidence are complete.

**Validation:** Public account verification state is covered in the API suite;
the full API suite (60 tests), Web suite (11 tests), typechecks and production
build passed. Browser inspection confirmed public registration at 375, 768,
1024 and 1440px has no horizontal document overflow. See
`docs/GOAL_032_EVIDENCE.md` and `docs/PUBLIC_ORGANIZATION_ONBOARDING.md`.

**Next Goal:** GOAL-033 — Platform review, approval and tenant provisioning.

## GOAL-033 — Platform review, approval and tenant provisioning

**Status:** DONE

**Depends on:** GOAL-032.

**Scope:** Platform Admin-only review queue, exact organization application
review transitions, one idempotent approval/provisioning transaction, an
initial owner for a newly approved organization, applicant review feedback and
the additive `setup` organization lifecycle.

**Out of scope:** canonical `/o/{slug}` routing, resumable owner setup, legacy
owner assignment UI, manual/CSV provisioning, directory, commercial, Assist,
Help and appearance.

**Validation:** migration 034 applied locally. API integration coverage proves
authorization, transition legality, information resubmission, slug conflict
rollback, idempotent approval, setup tenant, owner/admin membership and no
legacy owner promotion. The API suite has 61 passing tests; API/Web typechecks
and production build pass. See `docs/GOAL_033_EVIDENCE.md`.

**Validation complete:** authenticated Platform Admin visual acceptance passed
at 375, 768, 1024 and 1440px without document overflow. The review tabs now
support `Enter`/`Space` activation and arrow-key navigation. See
`docs/GOAL_033_EVIDENCE.md`.

**Next Goal:** GOAL-034 — Tenant routing, owner transition and resumable
setup.

## GOAL-034 — Tenant routing, owner transition and resumable setup

**Status:** DONE

**Depends on:** GOAL-033.

**Scope:** canonical `/o/{slug}` tenant context, conservative legacy routing,
explicit legacy-owner replacement and owner-controlled, resumable setup
activation.

**Validation:** migration 035 applied locally. API coverage proves slug
membership isolation, no automatic owner promotion, explicit owner replacement
and setup readiness/activation. The API suite has 62 passing tests; root
typecheck, tests and production builds pass. Authenticated browser acceptance
at 375/768/1024/1440 found no document overflow. See
`docs/GOAL_034_EVIDENCE.md`.

**Next Goal:** GOAL-035 — Manual and CSV user provisioning.

## GOAL-035 — Manual and CSV user provisioning

**Status:** DONE

**Depends on:** GOAL-034.

**Scope:** Extend existing local member management to `ORG_OWNER` while
preserving `ORG_ADMIN`; add a bounded, preview-first CSV flow with atomic
confirmation, per-tenant idempotency, non-secret audit data and a Persian RTL
administration UI. Directory users and connector synchronization remain out of
scope.

**Validation:** migration 036 applied locally. API integration coverage proves
owner authority, password-free preview results, repeat-safe confirmation and
tenant isolation. Root API/Web typecheck, 63 API tests, 11 Web tests and both
production builds pass. Authenticated browser acceptance at 375/768/1024/1440
found no document overflow. See `docs/GOAL_035_EVIDENCE.md`.

**Next Goal:** GOAL-036 — Directory connector domain, pairing and control
plane.

## GOAL-036 — Directory connector domain, pairing and control plane

**Status:** DONE

**Depends on:** GOAL-035.

**Scope:** Add the tenant-safe connector/pairing/device-identity control plane,
minimal organization-admin controls, migration and technology-validation
record. It deliberately excludes a Windows service, AD/LDAP calls and all
directory synchronization.

**Validation:** migration 037 applied locally. API integration coverage proves
owner/admin authorization, tenant isolation, hashed secret storage, expiry,
single-use replay denial and revocation. Root API/Web typecheck, 64 API tests,
11 Web tests and both production builds pass. Authenticated browser acceptance
at 375/768/1024/1440 found no document overflow. See
`docs/GOAL_036_EVIDENCE.md`.

**Next Goal:** GOAL-037 — Windows connector and directory sync lifecycle.

## GOAL-037 — Windows connector and directory sync lifecycle

**Status:** DONE

**Depends on:** GOAL-036.

**Scope:** Delivered an outbound-only Windows PowerShell/WinSW service scaffold
with DPAPI-local configuration, paired rotating device credentials and a
tenant-safe directory preview/apply lifecycle. No AD credential reaches cloud.

**Validation:** migration 038 applied locally. The real AD endpoint bound over
LDAPS and the resolved OU was readable. API/Web typechecks, 65 API tests, 11
Web tests and both production builds pass. See `docs/GOAL_037_EVIDENCE.md`.

**Next Goal:** GOAL-038 — Minimal commercial core.

## GOAL-038 — Minimal commercial core

**Status:** DONE

**Depends on:** GOAL-033.

**Scope:** Added migration 039 with the minimal Product, Subscription,
Entitlement, Add-on Package, Organization Commercial Agreement, Usage
Allowance, Usage Ledger, Platform Availability and Organization Feature Setting
records. Platform Admin can maintain products and commercial agreements in a
Persian RTL console. Capability resolution, allowance settlement and AI use
remain deliberately deferred.

**Validation:** migration 039 applied locally. API integration coverage proves
platform-only control, organization-setting RLS isolation and no usage-ledger
consumption for an infrastructure-style operation. Root API/Web typechecks, 66
API tests, 11 Web tests, both production builds and `git diff --check` pass.
Authenticated Platform Admin browser acceptance at 375/768/1024/1440 passed
without document overflow. See `docs/GOAL_038_EVIDENCE.md`.

**Next Goal:** GOAL-039 — Entitlement, settings, availability and capability
resolution.

## GOAL-039 — Entitlement, settings, availability and capability resolution

**Status:** DONE

**Depends on:** GOAL-038.

**Scope:** Added a central server-side resolver requiring active entitlement,
enabled organization setting and available platform capability. Platform Admin
can manage and view all three inputs in the existing concise Persian commercial
console; organization members can receive only their tenant-bound effective
view. No allowance, pack, AI execution or settlement behavior was introduced.

**Validation:** integration coverage proves every effective/deny combination,
`requireEffective` enforcement and cross-tenant isolation. Root API/Web
typechecks, 67 API tests, 11 Web tests and both production builds pass.
Authenticated browser acceptance at 375/768/1024/1440 passed without
document-level overflow. See `docs/GOAL_039_EVIDENCE.md`.

**Next Goal:** GOAL-040 — Allowances, packs and immutable usage ledger.

## GOAL-040 — Allowances, packs and immutable usage ledger

**Status:** DONE

**Depends on:** GOAL-039.

**Scope:** Migrations 040/040a add configured add-on packages, RLS-bound
package allocations and idempotent periodic/emergency allowance allocations.
Platform Admin allocation controls and a tenant-bound read-only state API are
available. The Usage Ledger is immutable to the application role. No customer
unit is reserved, consumed or settled in this Goal.

**Validation:** API integration coverage proves Platform Admin authority,
idempotency, tenant isolation, ledger mutation denial and zero consumption from
provider-like work. Root API/Web typechecks, 68 API tests, 11 Web tests and
both production builds pass. Authenticated browser acceptance at
375/768/1024/1440 passed without document overflow. See
`docs/GOAL_040_EVIDENCE.md`.

**Next Goal:** GOAL-041 — Commercial Smart Action metering for AI.

## GOAL-041 — Commercial Smart Action metering for AI

**Status:** DONE

**Depends on:** GOAL-040.

**Scope:** Migration 041 adds a tenant-RLS-protected commercial Smart Action
reservation. The first use is `AI_TICKET_REVIEW`: effective capability is
enforced before the action, capacity is reserved in source order and a unit is
settled only after a result is persisted for the authorized requester. Failed
or undelivered work releases the reservation; internal provider operations
never settle a customer unit.

**Validation:** root typechecks, 69 API tests, 11 Web tests, both production
builds, migration rehearsal and `git diff --check` pass. Authenticated Platform
Admin acceptance confirms the revised Persian commercial guidance and no
document overflow. See `docs/GOAL_041_EVIDENCE.md`.

**Next Goal:** GOAL-042 — Jupiter Assist commercial and access foundation.

## GOAL-042 — Jupiter Assist commercial and access foundation

**Status:** DONE

**Depends on:** GOAL-039 and GOAL-041.

**Scope:** Migration 042 adds platform-managed Assist policy/capacity, Jupiter support-agent registration and tenant-RLS-protected, scoped, time-bound and revocable support grants. Agents stay outside normal tenant membership and restricted tickets require matching explicit access. No Assist workflow, SLA or settlement is introduced.

**Validation:** API integration coverage proves authority, no tenant membership, cross-tenant denial, expiry/revocation and restricted-ticket protection. Root typechecks, 70 API tests, 11 Web tests, builds, migration rehearsal and `git diff --check` pass. See `docs/GOAL_042_EVIDENCE.md`.

**Next Goal:** GOAL-043 — Assist lifecycle and organization/platform UI.

## GOAL-043 — Assist lifecycle and request experience

**Status:** DONE

**Depends on:** GOAL-042.

**Scope:** Migration 043 adds a separate Assist-case lifecycle, requester
request/organization approval paths, acceptance-time SLA and narrowly scoped
additional-access requests. A Jupiter agent accepts only a permitted queued
case with available capacity; that acceptance consumes capacity exactly once.
Ticket lifecycle is unchanged and the requester ticket view exposes the Persian
«درخواست کمک از تیم Jupiter» action.

**Validation:** API coverage proves independent ticket status, policy routing,
capacity/acceptance behavior, support scope and tenant checks. Root typechecks,
71 API tests, 11 Web tests, builds, migration rehearsal and `git diff --check`
pass. See `docs/GOAL_043_EVIDENCE.md`.

**Next Goal:** GOAL-044 — Organization commercial dashboard and owner controls.

## GOAL-044 — Organization commercial dashboard and owner controls

**Status:** DONE

**Depends on:** GOAL-040 and GOAL-043.

**Scope:** A concise Persian read-only commercial dashboard is available only
to the explicit `ORG_OWNER`. It reports tenant-bound allowance, add-on, AI and
Assist summaries without modifying platform contracts, prices, allocations or
provider settings. Ownerless legacy organizations continue operating.

**Validation:** API coverage proves `ORG_ADMIN` denial and owner isolation.
Root typechecks, 72 API tests, 11 Web tests, builds, migration rehearsal and
responsive browser checks pass. See `docs/GOAL_044_EVIDENCE.md`.

**Next Goal:** GOAL-045 — Platform commercial console and governed appearance.

## GOAL-045 — Platform commercial console and governed appearance

**Status:** DONE

**Depends on:** GOAL-044.

**Scope:** The Platform Admin commercial console now exposes Jupiter support
agent, organization Assist policy/capacity/SLA and case visibility controls.
Migration 044/044a adds a singleton platform appearance record with only
approved brand, density, radius and internal-logo presets. It is auditable,
does not accept arbitrary CSS/JavaScript or external logo URLs, and preserves
the organization-logo-only override boundary.

**Validation:** API integration coverage proves platform-only preset updates
and rejected unsafe paths; root typechecks, 73 API tests, 11 Web tests,
production builds, migration rehearsal and `git diff --check` pass. See
`docs/GOAL_045_EVIDENCE.md`.

**Next Goal:** GOAL-046 — Help article domain and repository seed pipeline.

## GOAL-046 — Help article domain and repository seed pipeline

**Status:** DONE

**Depends on:** GOAL-030.

**Scope:** Establish a global, platform-owned versioned Product Help article
and revision model, plus repository-first initial seed publication. It is
strictly separate from tenant knowledge; only current published revisions are
read through audience-filtered APIs.

**Validation:** Migrations 045/045a applied. The seed run created six Persian
articles and a second run changed none. API integration and unit tests prove
anonymous/owner/platform audience separation plus draft/unpublished
non-disclosure; API typecheck and build pass. See `docs/GOAL_046_EVIDENCE.md`
and `docs/PRODUCT_HELP_API.md`.

**Next Goal:** GOAL-047 — Help authoring, discovery, export and contextual mapping.

## GOAL-047 — Help authoring, discovery, export and contextual mapping

**Status:** DONE

**Depends on:** GOAL-046.

**Scope:** Platform Admin-only runtime Help authoring, append-only revisions,
preview/publish/unpublish/restore and audited published-only exports. Deliver
the Persian Help Center and compact HelpTrigger mappings without creating a
new navigation pattern or altering tenant knowledge.

**Validation:** API integration coverage proves Platform Admin-only authoring,
published-pointer behavior, draft separation, restore and article/category/all
exports. Root typechecks, 82 API tests, 11 Web tests, production builds and
diff checks pass. The fresh local login surface has no document horizontal
overflow at 375/768/1024/1440; authenticated UI acceptance remains a final
GOAL-048 cross-domain gate. See `docs/GOAL_047_EVIDENCE.md`.

**Next Goal:** GOAL-048 — Cross-domain hardening, migration rehearsal and final acceptance.

## GOAL-048 — Cross-domain hardening, migration rehearsal and final acceptance

**Status:** DONE

**Depends on:** GOAL-037, GOAL-041, GOAL-045 and GOAL-047.

**Validation:** The isolated local legacy baseline (migrations 001–032) was
advanced forward through 045a, yielding 48 migration records, six Product Help
articles and five roles; the temporary database was removed. Fresh API startup
revealed and corrected the Appearance/Auth dependency import and notification
event-stream route. Root
`verify:release` passes with 82 API and 11 Web tests, and the fresh API smoke
load passed. Authenticated Persian RTL acceptance at 375/768/1024/1440 covers
public onboarding, organization administration, platform controls, Help Center
and contextual Help; the mobile Platform navigation is compact and has no
horizontal overflow. See `docs/GOAL_048_EVIDENCE.md`.

**Next Goal:** None — Master Upgrade complete; staging release gates remain in
`docs/STAGING_RELEASE_CHECKLIST.md`.
