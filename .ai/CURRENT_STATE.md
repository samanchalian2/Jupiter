# Current State

**GOAL-049 — کنترل تجاری مالک و مصرف مازاد (پیاده‌سازی‌شده، 2026-08-31):** Migration 046 سیاست overage سازمان/قابلیت، درخواست‌های تجاری retry-safe و نشانگرهای dedupe اعلان را افزود. ترتیب رزرو Smart Action اکنون دوره‌ای، بسته، اضطراری، overage و توقف است؛ سقف overage رزرو و تسویه را با advisory lock دربر می‌گیرد. مالک فقط می‌تواند سقف خودش را تنظیم و درخواست ADDON/RENEWAL/SERVICE_ACTIVATION ثبت کند؛ Platform Admin با سازمان هدف صریح تصمیم/اعمال می‌کند و override دلیل‌دار با actor واقعی audit می‌شود. داشبورد فارسی مالک و صف تجاری Platform کنترل‌های متناظر و HelpTrigger دارند. پرداخت، فاکتور و checkout اضافه نشده‌اند.

**GOAL-048 — Cross-domain hardening, migration rehearsal and final acceptance (complete, 2026-08-31):** An isolated legacy baseline of migrations 001–032 was advanced through 045a and verified with 48 migration records, six Help articles and five roles before its temporary database was removed. Fresh API startup exposed and corrected an Appearance/Auth module dependency omission; the web notification client now uses the API's canonical event stream rather than a 404 route. Root quality gates pass: 82 API tests, 11 Web tests, production builds, fresh API smoke load and diff checks. Authenticated Persian RTL acceptance at 375/768/1024/1440 covers public onboarding, organization directory administration, platform controls, Help Center and contextual guidance; the mobile platform tab strip now becomes a compact select below 700px. Staging ingress, secret-manager, registry and managed-backup evidence remain deployment gates rather than completed local claims. Evidence: `docs/GOAL_048_EVIDENCE.md`. The Master Upgrade program is complete.

**GOAL-047 — Help authoring, discovery, export and contextual mapping (complete, 2026-08-31):** Platform Admin now has audited create/draft/preview/publish/unpublish/restore controls, where each edit/restoration creates a runtime revision and only the selected published revision is user-visible. Published-only Markdown/JSON export supports one article, category or all Help. A Persian Help Center and compact triggers cover AI ticket review, directory connection and Jupiter Assist policy without changing tenant knowledge or adding RAG. Root typechecks, 82 API tests, 11 Web tests, production builds and diff checks pass; fresh login UI has no overflow at 375/768/1024/1440. Evidence: `docs/GOAL_047_EVIDENCE.md`. GOAL-048 is ready.

**GOAL-046 — Help article domain and repository seed pipeline (complete, 2026-08-31):** Migration 045/045a adds global platform-owned, versioned Product Help articles/revisions with current publication pointers, Persian audience/discovery metadata and source lineage. `docs/help/` now seeds six initial published articles idempotently; a runtime article is never overwritten. API reads derive active role/platform audience server-side and return only current published content, with unauthorized/draft/unpublished slugs non-disclosing. API integration/unit tests, typecheck, build, migration and seed rehearsal pass. Evidence: `docs/GOAL_046_EVIDENCE.md`. GOAL-047 is ready.

**GOAL-045 — Platform commercial console and governed appearance (complete, 2026-08-31):** Platform Admin can now manage Jupiter support agents and organization Assist policy, capacity and SLA from the commercial console without granting tenant membership. Migrations 044/044a add an auditable global platform appearance record that permits only contrast-reviewed brand, density, radius and internal-logo presets; organization branding remains logo-only and cannot alter semantic UI or layout. Root typechecks, 73 API tests, 11 Web tests, production builds, migration rehearsal and diff checks pass. Evidence: `docs/GOAL_045_EVIDENCE.md`. GOAL-046 is ready.

**GOAL-044 — Organization commercial dashboard and owner controls (complete, 2026-08-30):** A tenant-bound, read-only Persian «سهمیه و پشتیبانی» dashboard now summarizes active allowances, add-on packages, AI activity and Jupiter Assist capacity for the explicit `ORG_OWNER` only. The API independently denies `ORG_ADMIN`; legacy organizations with no owner remain operational and are never promoted. Platform Admin retains contract, allocation, pricing and provider authority. Root typechecks, 72 API tests, 11 Web tests, builds, migration rehearsal and responsive browser validation at 375/768/1024/1440 pass. Evidence: `docs/GOAL_044_EVIDENCE.md`. GOAL-045 is ready.

**GOAL-043 — Assist lifecycle and request experience (complete, 2026-08-30):** Migration 043 adds independent Assist cases, Assist SLA due time, additional-access requests and one-time capacity settlement at permitted acceptance; ticket status never changes. Requesters use the Persian «درخواست کمک از تیم Jupiter» action on the ticket. Root typechecks, 71 API tests, 11 Web tests, builds and migration rehearsal pass. Evidence: `docs/GOAL_043_EVIDENCE.md`. GOAL-044 is ready.

**GOAL-042 — Jupiter Assist commercial and access foundation (complete, 2026-08-30):** Migration 042 adds a platform-managed Assist policy/capacity record, global Jupiter support-agent registry and tenant-RLS-protected scoped, time-bound, revocable support grants. Jupiter agents do not become organization members. Default routed-only visibility, selected/full scope and the additive restricted-ticket flag are evaluated server-side; a restricted ticket needs an explicit matching routed grant even when broad support exists. No Assist case, queue, acceptance, SLA or capacity consumption was introduced. Root typechecks, 70 API tests, 11 Web tests, builds and migration rehearsal pass. Evidence: `docs/GOAL_042_EVIDENCE.md`. GOAL-043 is ready.

**GOAL-041 — Commercial Smart Action metering for AI (complete,
2026-08-30):** Migration 041 adds tenant-RLS-protected, idempotent Smart Action
reservations with `RESERVED`/`SETTLED`/`RELEASED` state and source ordering of
periodic allowance, add-on allocation, then emergency allowance. A permitted
customer-facing AI ticket review reserves capacity before execution, releases
it for invalid or failed/undelivered work, and settles exactly once only after
an authorized result is persisted. Provider calls, retries, connection tests,
diagnostics and internal work have no billable ledger event; manual ticketing
remains available. The Platform Admin guidance now explains this in Persian.
Root typechecks, 69 API tests, 11 Web tests, builds, migration rehearsal and
authenticated commercial-page acceptance pass. Evidence:
`docs/GOAL_041_EVIDENCE.md`. GOAL-042 is ready.

**GOAL-040 — Allowances, packs and immutable usage ledger (complete,
2026-08-30):** Migrations 040/040a add RLS-bound add-on allocations,
idempotent periodic/emergency allowance allocation and configured add-on packs.
The Platform Admin Persian commercial console creates packages and allocations;
tenant members receive a read-only, tenant-bound commercial-state API. Usage
Ledger entries are application-role immutable and allocation retries do not
create duplicates. No provider, diagnostic, retry or resolver operation
consumes a customer unit; customer-facing settlement remains deferred. Root
typechecks, 68 API tests, 11 Web tests, builds and authenticated browser checks
at 375/768/1024/1440 pass. Evidence: `docs/GOAL_040_EVIDENCE.md`. GOAL-041 is
ready.

**GOAL-039 — Entitlement, settings, availability and capability resolution
(complete, 2026-08-30):** The commercial resolver now allows a capability only
when an in-window active entitlement, enabled organization setting and available
platform setting all pass. Missing records deny by default; `requireEffective`
is a server-side gate for later consumers. Platform Admin has concise Persian
controls for entitlement, organization setting and platform availability, with
minimal audit records and no change to legacy owners/memberships. API coverage
proves every deny/allow combination, enforcement and tenant isolation. Root
typechecks, 67 API tests, 11 Web tests, builds and authenticated browser checks
at 375/768/1024/1440 pass. Evidence: `docs/GOAL_039_EVIDENCE.md`.

**GOAL-038 — Minimal commercial core (complete, 2026-08-30):** Migration
039 establishes the intentionally minimal commercial data boundary: product,
subscription, entitlement, add-on package, organization agreement, allowance,
usage ledger, platform availability and organization feature setting. Tenant
records use RLS; product and agreement controls are Platform Admin-only and the
Persian «تجاری» tab explicitly distinguishes catalog/contract data from future
authorization and billing. The new integration coverage proves platform-only
control, feature-setting tenant isolation and no Usage Ledger entry from an
infrastructure-style action. API/Web typechecks, 66 API tests, 11 Web tests,
both builds and a local migration rehearsal pass. Authenticated browser
acceptance at 375/768/1024/1440 passed without document overflow. Evidence:
`docs/GOAL_038_EVIDENCE.md`.

**GOAL-037 — Windows connector and directory sync lifecycle (complete,
2026-08-30):** Migration 038 adds tenant-RLS-protected sync runs and
source-tracked directory role grants, with connector version/heartbeat/sync
visibility. A paired connector uses a rotating hashed device token for each
accepted heartbeat, preview and apply request; replay, wrong device binding and
revocation are denied. Full/delta preview classifies create, update, suspend,
out-of-scope and unchanged; apply is idempotent. It provisions a no-email user
and membership, suspends disabled accounts immediately, and gives scope exits a
seven-day grace without hard deletion. Only requester/expert/supervisor roles
can be directory-managed. The PowerShell/WinSW service scaffold uses DPAPI
locally. The verified AD scope is `OU=Jupiter,OU=PNS,DC=PNS,DC=local`.
API/Web typechecks, API 65 tests, Web 11 tests and builds pass. Evidence:
`docs/GOAL_037_EVIDENCE.md`.

**GOAL-036 — Directory connector domain, pairing and control plane (complete,
2026-08-30):** Migration 037 adds tenant-RLS-protected connector and pairing
records. Organization owners and administrators can create a named connector,
issue one hashed 15-minute pairing code, and revoke its device identity. The
agent pairing exchange consumes the code atomically and returns a one-time
device token; raw pairing and device credentials are never persisted or
audited. The concise Persian organization-admin page exposes connector status,
pairing and revocation while explicitly deferring directory synchronization.
The implementation-validation matrix records Node/WinSW, secure-store and
request-proof candidates without selecting one. API suite (64 tests), Web suite
(11 tests), typechecks and production builds pass; browser acceptance at
375/768/1024/1440 has no document overflow. Evidence:
`docs/GOAL_036_EVIDENCE.md`. GOAL-037 is ready.

**GOAL-035 — Manual and CSV user provisioning (complete, 2026-08-30):**
Migration 036 adds a tenant-RLS-protected idempotency/result ledger for group
member imports. `ORG_OWNER` now shares existing member-administration authority
with `ORG_ADMIN`, without changing legacy administrator access. Organization
administration provides a Persian RTL CSV preview and confirmation flow; it
validates up to 500 rows, reports row-level issues, accepts quoted CSV values,
uses one retry-safe import key per selected file, and never renders or returns
passwords after the file is read. Confirmation is atomic for one tenant and
audits only counts. API suite (63 tests), Web suite (11 tests), typechecks and
production builds pass. Authenticated browser checks at 375/768/1024/1440 show
the control with no document overflow. Evidence:
`docs/GOAL_035_EVIDENCE.md`. GOAL-036 is ready.

**GOAL-034 — Tenant routing, owner transition and resumable setup (complete,
2026-08-30):** Migration 035 adds tenant-RLS-protected resumable setup progress.
`/o/{slug}` is canonical; legacy entry redirects only for an unambiguous single
membership and a multiple-membership user selects a tenant explicitly. Server
resolution verifies active slug membership, while all tenant APIs retain their
existing server-side membership checks. A setup tenant owner sees a Persian
checklist and can activate only after settings and at least one service category
are present. Platform Admin may explicitly replace an owner using an active
member; existing `ORG_ADMIN` memberships remain unchanged. API suite (62
tests), root typecheck/test/build and authenticated browser checks at
375/768/1024/1440 pass. Evidence: `docs/GOAL_034_EVIDENCE.md`. GOAL-035 is
ready.

**GOAL-033 — Platform review, approval and tenant provisioning (complete,
2026-08-30):** Migration 034 adds the additive `setup` tenant lifecycle,
review metadata, a provisioned-organization reference and `ORG_OWNER` without
changing existing active/suspended organizations or promoting existing
`ORG_ADMIN` members. Platform Admin can review applications, request
information, reject, or atomically approve with a selected slug. Approval is
idempotent and creates exactly one setup organization and an applicant
membership with `ORG_OWNER` plus `ORG_ADMIN`; a slug conflict rolls the entire
operation back. Applicant status shows the review note and allocated slug.
The API suite (61 tests), typechecks and production build pass. Authenticated
Platform Admin browser acceptance passed at 375/768/1024/1440 without
document-level overflow; the review tabs now have explicit keyboard activation
and arrow-key navigation. Persian impact and evidence are in
`docs/GOAL_033_EVIDENCE.md`. GOAL-034 is ready.

**GOAL-032 — Public organization application experience and verification
delivery (complete, 2026-08-29):** Public RTL account registration, sign-in,
email verification, applicant draft/resume/update/submission/cancellation and
status feedback are now available without fabricating tenant context. The
no-membership shell becomes an applicant workspace. Verification delivery is
explicitly configured as local-test (non-production only), HTTPS webhook, or
safe disabled mode; raw tokens stay out of normal responses, audit and
production logs. The development-only inbox is bound to the matching signed-in
account and unavailable in production. API suite (60 tests), Web suite (11
tests), typechecks/build and 375/768/1024/1440 browser overflow checks pass.
Persian guidance and evidence are in `docs/PUBLIC_ORGANIZATION_ONBOARDING.md`
and `docs/GOAL_032_EVIDENCE.md`. GOAL-033 is ready.

**GOAL-031 — Additive identity and organization application foundation
(complete, 2026-08-29):** Migration 033 preserves legacy `users` credentials
while adding email-password authentication identities, tenant-RLS-protected
directory principals for users without email, hashed/single-use 24-hour public
verification tokens and persisted notification-delivery state. New public APIs
support account creation, verification/resend, applicant-owned organization
application drafts, status listing, verification-gated submission and
idempotent cancellation. Application statuses are exactly `DRAFT`,
`SUBMITTED`, `UNDER_REVIEW`, `NEEDS_INFORMATION`, `APPROVED`, `REJECTED` and
`CANCELLED`; platform review and provisioning remain deferred. API integration
coverage proves legacy/additive login, no token/password leakage, replay denial,
applicant isolation, transition idempotency and Directory Principal RLS. All
60 API tests, root API/Web typecheck and production build pass. Persian Help impact and the
REST contract are recorded in `docs/GOAL_031_EVIDENCE.md` and
`docs/ORGANIZATION_APPLICATION_API.md`. GOAL-032 is ready.

**GOAL-030 — Master Upgrade program baseline and architecture decisions
(complete, 2026-08-29):** The approved enterprise upgrade is now governed by
`.ai/UPGRADE_MASTER_PLAN.md`. DEC-018 through DEC-027 record the selected
additive identity evolution, verified public-account gate, exact organization
application statuses, legacy-owner transition, conservative `/o/{slug}` route
compatibility, connector security invariants/validation gate, minimal
commercial core, delivered-Smart-Action metering, Assist grants and independent
product Help. This Goal changed documentation only: no production code,
migration, dependency, API or runtime behavior changed. Architecture, domain,
business rules, security, risk, test, master/execution plan, next task,
changelog and Persian Help impact evidence are synchronized. GOAL-031 is ready.

**GOAL-029 — Organization Administration Workspace & Information Architecture
(complete, 2026-08-29):** Organization Administration no longer uses a long
horizontal tab strip. Its existing panels are available through grouped,
route-addressable sub-navigation: users and roles; catalog, vocabulary and
teams; SLA and assignment; request/appearance settings; and custom fields/
email. `/admin` resolves to members, while each section supports a stable
`/admin/<section>` deep link and browser back/forward. Desktop uses a compact
vertical navigation; mobile uses a labelled grouped selector. No API,
permission, tenant, ticket or AI behavior changed. Authenticated browser checks
verified all seven direct routes, back navigation, no legacy tab list and no
horizontal overflow at 375, 768, 1024 and 1440px. Web typecheck, 11 web tests
and production build pass. DEC-017 records the durable IA decision.

**GOAL-028 — Product shell and navigation refinement (complete, 2026-08-29):**
The desktop shell now uses a quiet 232px sidebar and a compact 56px contextual
header, with a 64px collapsed state that retains accessible icon labels and
native tooltips. Active navigation relies on a restrained brand surface,
border and inline accent rather than heavy weight. The header distinguishes
platform/organization context without a banner; one-organization memberships
now receive a non-interactive organization label instead of a redundant
selector. Mobile retains the existing drawer pattern, adds predictable initial
focus and focus return, and keeps 44px navigation targets. No routes,
authorization, API contracts or product workflows changed. Web typecheck,
11 web tests and the production build pass. An authenticated Platform Admin
browser check passed at 375, 768, 1024 and 1440px with no document overflow;
the mobile header remains 59px, desktop header 63px, and the collapsed-route
labels/tooltips were verified.

**GOAL-027 — Design System V2 foundation (complete, 2026-08-29):** Added a
semantic token layer in `apps/web/src/design-system.css`, keeping legacy aliases
only for staged screen migration. The shared UI entrypoint now provides compact
enterprise primitives for sections, alerts, loading, status badges, tables and
help triggers, in addition to the existing controls and accessible confirmation
dialog. The Dashboard now demonstrates the common error/retry/loading pattern:
a failed overview no longer renders an endless loading message alongside the
error, and operational statuses use semantic badges. Login was refined to a
quiet neutral sign-in surface. Web typecheck, 11 web tests, and the production
web build pass; the live login screen passed document-overflow checks at 375,
768, 1024 and 1440px. `.ai/DESIGN_SYSTEM.md` is now the V2 reference.

**GOAL-026 — Requester cancellation of an unsubmitted intake (complete,
2026-08-27):** The ticket form offers a Persian «انصراف از پیش‌نویس» action
with an explicit destructive confirmation. It closes the requester form and
returns to request history with a non-ticket notice. The new owner- and
tenant-scoped cancellation route locks the session, deletes all temporary
voice objects, clears queued intake work, deletes the session and its raw
conversation/AI data, and records only non-content audit counts. A consumed
session cannot be cancelled and no submitted ticket is changed. API integration
coverage verifies ownership denial, object cleanup, message deletion, outbox
completion and content-free audit metadata.

**GOAL-026 visual refinement (complete, 2026-08-27):** The destructive
secondary action is now the compact, text-like «انصراف» control with a small
trash icon and a subtle focus/hover surface. It no longer competes visually
with the primary «ثبت درخواست» CTA; on narrow screens it keeps a reachable
40px target without becoming full-width.

**GOAL-024 — Organization Smart Intake control and unified send (complete,
2026-08-24):** Migration 032 adds tenant-scoped `smart_intake_enabled` while
preserving enabled existing configured organizations. Platform Admin remains
the only credential/model authority; Organization Admin can toggle the ticket
form capability only when a valid platform AI configuration exists. Requesters
receive only an effective boolean capability, and the server independently
blocks intake analysis when it is off. The conversation composer now has one
send CTA: it sends and analyzes when enabled, and sends text/verified voice
manually when disabled. API typecheck, 56 API tests, Web typecheck, 11 Web
tests and both production builds pass.

**GOAL-023 — Persistent conversational intake layout (complete, 2026-08-24):**
After the first requester text or voice message, the large description-first
composer transitions into a compact messenger-style conversation surface rather
than collapsing. The conversation history and compact text/voice/attachment
toolbar stay visible for follow-up clarification; the final ticket-submit
action remains separate. Title, category and advanced fields now live in the
collapsible «جزئیات درخواست» section, which opens automatically when an AI
result leaves required data unresolved and when a manual submit identifies a
missing required value. The clarification question remains in the conversation
without being duplicated in the AI interpretation card. Web typecheck, 11 Web
tests and the production Web build pass.

**GOAL-022 — Reviewable AI secondary proposals and stable smart completion
(complete, 2026-08-24):** `ticket-intake.v5` retains the 0.75 threshold for
automatic primary-field application while allowing a requester to explicitly
select a structurally valid, server-owned secondary proposal below that score.
Such proposals are labelled «نیازمند بررسی», are repeated in the final batch
confirmation, and still create tickets only atomically with the primary ticket.
Incomplete or taxonomy-invalid proposals remain unavailable. A proposal's
«توضیح و تحلیل دوباره» action opens a context-labelled composer without
changing earlier source messages; the fresh text or voice contribution triggers
analysis again and clears stale proposal selections. During processing, the
smart-complete button remains in place with its current stage and competing
controls are disabled; the composer collapses only after a successful result.
DEC-013 and `docs/TICKET_INTAKE_API.md` record the contract. API typecheck,
53 API tests, Web typecheck, 11 Web tests, both production builds and a live
local browser check at desktop and 375px passed.

**Primary-issue continuity refinement (complete, 2026-08-24):**
`ticket-intake.v6` retains the prior server-established primary issue while a
requester clarifies a secondary suggestion. The refreshed model context uses
that anchor, so a later message cannot silently reorder the ticket sequence;
only an explicit correction or replacement may do so. API typecheck, 54 API
tests and API production build pass. DEC-014 records the rule.

**GOAL-021 — Confirmed AI secondary-ticket batches (complete, 2026-08-23):**
`ticket-intake.v4` supplies up to two server-identified, tenant-validated and
privacy-preserving secondary ticket proposals. A requester selects none by
default and confirms one atomic submission with the primary ticket; attachments,
voice and raw/transcribed source content remain solely on the primary ticket.
The post-release batch-submit ownership regression was corrected: drafts now
return their requester identity to the in-transaction submit guard. API typecheck,
52 API tests, Web typecheck/build and an authenticated non-personal browser
submission of a primary plus secondary ticket passed locally.

**Conversation composer and controlled custom tags (complete, 2026-08-24):**
After a first text or voice message is sent, the large message composer is
collapsed behind «افزودن توضیح یا پیام دیگر», keeping the intake screen focused
on the conversation and structured ticket fields. The additional-message action
restores focus to the composer. Requesters may add up to five normalized custom
tags; a new tag is linked only to the current ticket as `PENDING` and is not
made available in the organization vocabulary until an Organization Admin
reviews it. The existing tenant-safe pending-tag workflow is reused without an
API or schema change. Web typecheck, 11 Web tests, Web production build and 52
API tests pass; the live form displays the custom-tag input and governance hint.

**GOAL-020 — Multimodal guided ticket-intake conversation (complete,
2026-08-23):** `ticket-intake.v3` stores up to five ordered requester text or
voice messages per tenant- and owner-scoped intake. Raw typed text and each
voice transcript remain distinct from the AI interpretation, primary issue,
secondary issues and optional clarification. The model recognizes corrections,
negation and multi-issue requests before producing title/taxonomy/tag
suggestions. Clarification and secondary-ticket suggestions are non-blocking;
the primary ticket can always be submitted manually and no second ticket is
created automatically. All verified voice messages transfer to the final
ticket as attachments. Migration 030 applied locally; 52 API tests, 11 Web
tests, API/Web typechecks and both production builds pass.

**Voice re-record replacement (complete, 2026-08-23):** Starting a new voice
capture now removes only the transcript section appended by the prior successful
voice intake, while preserving any text the requester typed before or after it.
The new recording can therefore replace the former voice-derived description
instead of accumulating it.

**Voice-intake provider compatibility recovery (complete, 2026-08-22):** Chrome
records WebM/Opus, which the configured provider rejected despite a successful
upload and metadata verification. The composer now converts the local capture
to 16 kHz mono PCM WAV before upload; the provider had already accepted the
same organization configuration's synthetic WAV. The user recording was not
replayed externally while diagnosing. The prior signed metadata repair remains
in place. A full generated-WAV intake run reached `SUCCEEDED` through upload,
worker transcription and structured analysis, then cleaned up its temporary
object. Intake polling now has a separate bounded rate-limit allowance and
authenticated callers no longer share one IP bucket. Evidence:
`docs/VOICE_INTAKE_UPLOAD_EVIDENCE.md`. An already-open composer upgrades its
retained pre-change WebM capture locally on the next operation, so it does not
need a re-recording.

**Voice-intake upload recovery (complete, 2026-08-22):** Recorded audio was
reaching the browser but MinIO rejected the presigned upload because the
required duration metadata header was not signed. All caller-provided S3
metadata headers are now explicitly preserved in the signature. A real
WebM-style PUT plus S3 HEAD metadata verification passed, and the saved
organization configuration successfully transcribed a synthetic silent WAV
sample. API typecheck, all 51 API tests, Web typecheck and production Web build
pass. Evidence: `docs/VOICE_INTAKE_UPLOAD_EVIDENCE.md`.

**Local object-storage recovery (complete, 2026-08-22):** Local branding and
attachment uploads now have a startup prerequisite: `pnpm dev:storage` validates
the loopback S3 configuration, starts local MinIO when necessary, waits for its
liveness endpoint and ensures the configured bucket exists. Root `pnpm dev`
runs it before the API, Web and Worker. A real signed logo-style PNG upload,
metadata verification and cleanup passed against the recovered store; API and
Web typechecks plus all 51 API tests pass. Failed uploads made while the object
store was offline were not persisted and must be selected again in the UI.
Evidence: `docs/LOCAL_OBJECT_STORAGE_EVIDENCE.md`.

**GOAL-019 — Smart composer, vocabulary management, search and reporting
(complete, 2026-08-22):**
The requester composer now supports up to five typed tags in «جزئیات بیشتر»
and directly applies server-validated `ticket-intake.v2` tag suggestions with
AI provenance. Organization Administration now has a pending title/tag review
tab; active values alone are offered to future requests. Queue/list and global
search include tag names, the queue can be filtered by an approved tag, and
operational reports include typed-tag distribution. API typecheck, 51 API
tests, Web typecheck, 9 Web tests and both production builds pass. An
authenticated browser walkthrough confirmed a real concise, non-copy AI title
and the smart composer/tag UI at 375, 768 and 1440 px with no horizontal
overflow. The Jupiter Demo Organization now has the approved template's nine
categories and 24 subcategories; a real provider run applied «چاپ و اسناد»,
«خطاهای چاپ», priority HIGH and five typed tag candidates to a printer
request. The provider-specific per-tag confidence spellings are normalized
without lowering the 0.75 gate. A direct local API/Web launch must also start
the separate Worker with `JUPITER_WORKER_ENABLED=true`; root `pnpm dev` already
does this. Evidence:
`docs/GOAL_019_EVIDENCE.md`.

**GOAL-018 — Governed titles and typed tags (2026-08-22):** Migration 029
adds tenant-RLS-protected normalized title vocabulary and evolves existing tags
without data loss into typed, status-controlled values. `ticket-intake.v2`
supplies only active titles/tags to the provider, asks for concise non-copy
titles and up to five typed tags, then validates confidence and tenant IDs.
Final explicit draft creation links approved tags and records unseen titles or
tags only as pending candidates; Organization Admin review APIs activate or
disable them. DEC-010 records the contract decision. Migration, 50 API tests,
Web tests, API typecheck and Web build pass. GOAL-019 is next.

**GOAL-017 — Catalog governance and approved IT starter template (2026-08-22):**
Organization Administrators can review catalog readiness for smart intake and
install the idempotent «IT and organizational support» template. Migration 028
adds tenant-RLS-protected installation records and a pending suggestion queue;
the queue intentionally does not let AI activate a category, subcategory,
department, location or discipline. The administrator API supports review and
audits template installation/review without request content. The local
migration, 48 API tests (including cross-tenant queue isolation), Web tests,
API typecheck and production Web build pass. GOAL-018 is next.

**GOAL-016 — Saved AI settings connection diagnosis (2026-08-22):** Platform
Administration provides an «آزمون اتصال» control for each saved organization AI
configuration. The Platform Admin-only endpoint uses the encrypted stored key
and configured analysis model for one fixed, non-sensitive Chat Completions
request, then returns a Persian safe result for success, invalid key,
billing/quota, rate limit, endpoint/model access or provider availability.
No credential, provider response body or user request is returned, logged or
audited; audit metadata carries only a success flag and diagnostic category.
The diagnostic separates provider communication from audit recording so an
internal audit failure cannot be mislabeled as a provider outage. The local
Jupiter Demo Organization was verified with the GapGPT OpenAI-compatible Base
URL and `gpt-4o`: the in-product endpoint returned success, and the complete
`ticket-intake.v1` structured output contract returned a title and NORMAL
priority from a non-sensitive test request.

**GOAL-015 — Smart ticket composer and acceptance E2E (2026-08-19):** The
requester composer is now description-first with initial focus, a directly
adjacent AI/microphone toolbar, one-minute MediaRecorder controller, secure
voice upload, live processing/fallback states, direct application of validated
suggestions, per-field AI provenance badges and Persian low-confidence
guidance. Subcategory and discipline are now exposed as manually editable
catalog fields. Text-only manual submission remains available during a slow AI
request; voice submission waits for its verified attachment handoff. Nine Web
tests cover suggestion/transcript behavior, polling, permission denial,
one-minute auto-stop and manual fallback. The complete release gate passes with
41 API and 9 Web tests. Authenticated requester checks at 375, 768 and 1440 px
show no overflow, correct mobile/desktop toolbar layout, successful fake-provider
application and low-confidence rejection. Evidence is in
`docs/GOAL_015_EVIDENCE.md`. GOAL-013 through GOAL-015 are complete; only the
already-documented external staging Phase 9 gates remain outside local scope.

**GOAL-014 — Tenant-scoped ticket intake pipeline (2026-08-19):** Migrations
023–027 add owner-scoped, RLS-protected pre-ticket sessions, provenance, strict
state constraints and tenant-safe subcategory integrity. The six intake routes
support idempotent text sessions, temporary presigned voice upload, post-upload
and pre-use MIME/size/duration verification, discard, status polling and
analysis. The worker performs OpenAI-compatible transcription then versioned
structured analysis, validates every taxonomy/custom-field value at confidence
0.75, retries three times with a lease/backoff, and removes 24-hour orphaned
objects. Draft creation accepts `intakeSessionId` and atomically creates the
ticket, provenance and persistent voice attachment without changing the ticket
lifecycle. Typed text remains unchanged, transcripts append separately, and
provider failure retains a fully usable manual path. The root `pnpm dev` command
now launches API, Web and Worker together. API/web release gates and 41 API
tests pass. GOAL-015 is next.

**GOAL-013 — Secure per-organization AI settings (2026-08-19):** Migration 022
extends every organization AI policy with an OpenAI-compatible Base URL,
separate analysis/transcription model identifiers, and an AES-256-GCM encrypted
API key. Only Platform Admin can read or change the settings, GET responses
return `hasApiKey` rather than secret material, blank key input preserves the
credential, and explicit removal disables AI. Production provider hosts are
HTTPS/allowlist constrained; development alone permits loopback HTTP fakes.
The local key was imported into `jupiter-demo` as ciphertext and its plaintext
migration source removed. The Platform UI exposes the masked state, replacement
flow and confirmed removal. Migration, API/web typechecks, 37 API tests,
production builds, and an authenticated browser save with an empty key all
pass. A real synthetic request reached the configured provider but returned
`429 billing_not_active`; implementation and connectivity are verified, while
live inference requires billing to be activated for that OpenAI API project.
GOAL-014 is next and remains fully testable with the local provider fake.

**Local runtime resilience (2026-08-19):** The API fallback database URL now
uses the Windows PostgreSQL service's standard port 5432 (matching the supplied
local configuration, rather than the former non-persistent 5433 instance).
The SLA background interval catches and records database failures, so a temporary
database outage cannot terminate the API process. This fixes the recurring local
startup login failure. The ignored local environment now also carries a stable
JWT signing key, so an API restart no longer invalidates otherwise valid local
browser sessions. API typecheck and a real bootstrap-admin login (HTTP 201 with
its HTTP-only refresh cookie) passed after the repair.

**Brand color update (2026-08-15):** The Jupiter commercial theme now uses
`#6d5587` as its primary purple across brand marks, primary controls, active
states, focus treatment, and new ticket-tag defaults. Primary controls use
white text with 6.36:1 contrast; the `#59436f` hover state measures 8.55:1.
Web typecheck and production build pass, and live desktop and 390px browser
checks confirm the exact computed colors with no horizontal overflow.

**Control and icon color consistency (2026-08-15):** Primary and secondary
buttons, icon buttons, and application-navigation icons now use the approved
Jupiter purple `#6d5587` through the shared brand token; primary-button text
remains white.

**List hover readability (2026-08-15):** Queue, ticket-history, and knowledge
list rows now retain the normal high-contrast text colors on hover and keyboard
focus. Their hover surface is `--primary-soft`; ticket-history rows also receive
a three-pixel brand inset indicator. Web typecheck and production build pass.

**Organization branding (2026-08-15):** The supplied Jupiter logo is the
compiled default for the login page and product shell. Organization
administrators can now upload a tenant-scoped PNG, JPEG, or WebP logo through
Organization Administration → Settings; the API validates the file metadata
(maximum 2 MB), stores only an S3-compatible object key, and records the change
in the audit log. Migration 021 is applied locally. API typecheck, 31 API
tests, and the web production build pass.

**Browser identity (2026-08-15):** Jupiter now has a standard PNG favicon and
the browser tab title is «ژوپیتر | سامانه تیکتینگ هوشمند». When an organization
administrator changes the organization logo, the active tab favicon updates to
the same image.

**Brand mark continuity (2026-08-15):** The product-shell logo is now 46px
(about 21% larger). A changed organization logo is retained locally by the
browser, so the same logo appears on the login screen after the user signs out;
if its short-lived secure URL expires or fails, the static Jupiter default is
used safely.

**Responsive administration and local object storage (2026-08-15):** Mobile
administration now constrains its grid tracks and keeps wide tables in their own
horizontal scroller, eliminating document-level overflow in Organization and
Platform Administration. All main routes were checked at 390px and 1440px with
no document overflow. Docker is unavailable locally, so a local MinIO service
and `jupiter-attachments` bucket were provisioned directly at port 9000; the
S3 settings are present only in ignored `.env`. A real organization-logo upload
completed successfully.

**Ticket experience v2 (2026-08-15):** The requester ticket area is now a
combined quick-intake and request-history landing page, while staff retain a
separate operational queue. Ticket details use direct, reload-safe routes and
three accessible tabs (conversation, details, activity); public replies and
staff-only notes remain permission-separated. Queue results are ordered by
role-safe last activity, support multi-status filters, and expose direct ticket
detail metadata without changing the lifecycle or tenant boundaries. Mobile
list/detail states are separate, filters use an Escape-dismissible modal sheet,
and the tested 375/768/1024/1440 layouts have no horizontal document overflow.
The live administrator and requester journeys, a real quick-intake submission,
and the complete release gate passed. Evidence is in
`docs/TICKET_UX_V2_EVIDENCE.md`.

**Phase:** MVP complete; all planned Goals are done. InspectA commercial
remediation is complete locally. It is not a staging/production release
milestone.

**Commercial UI/UX redesign (2026-08-12):** The approved light RTL redesign
is complete locally. It introduces shared frontend primitives, Jupiter SVG
identity, a compact responsive shell, role-gated navigation, redesigned
workspace pages, username-capable identity flows, safe custom-field repair,
and accessible destructive-action dialogs. Migration 020 is applied to the
local PostgreSQL database. API and web typechecks, 30 API tests, and the web
production build pass. The local API has been restarted and live username
authentication is verified. Detailed evidence is in
`docs/UI_UX_REDESIGN_EVIDENCE.md`.

**InspectA remediation (2026-08-12):** The implementation now has rotating
HTTP-only refresh sessions, role-gated navigation and API checks, organization
member/catalog/team/automation administration, paged persistent ticket views,
expanded ticket intake, knowledge revisions and workflow, operational
dashboards/reports, structured platform administration, a separate queue-worker
entrypoint, responsive collapsible navigation, keyboard skip navigation, global
ticket search, and persistent local notification history. API unit/integration
tests (28) and web production build pass. Authenticated administrator,
requester/API-denial and platform-admin journeys, plus the responsive
browser path, have been recorded in `docs/inspectA.md`; all 32 InspectA items
are now closed locally. The item-by-item completion audit is recorded in
`docs/INSPECTA_EVIDENCE.md`.

**InspectA extensions (2026-08-12):** Migrations 017 and 018 add tenant-RLS
ticket custom-field definitions/values and safe email-routing settings.
Organization administrators can define active required/optional ticket fields
and a non-secret inbound-mail address; the requester ticket form loads and
validates active fields. A real mail gateway and an AI/transcription provider
still require deployment-owned credentials and endpoints.

**InspectA evidence (2026-08-12):** The custom-field API was exercised after
migration 018 and returns a valid JSON options array. A fresh REQUESTER member
was authenticated against the local API: their ticket queue returned HTTP 200
and their direct reports request returned HTTP 403, confirming both permitted
and denied role paths.

**Persistent notifications (2026-08-12):** Migration 019 persists recipient
notifications under tenant RLS. The application now loads its protected inbox
before attaching the live SSE stream; the local authenticated inbox endpoint
returned HTTP 200 after the API restart.

**Email ingress (2026-08-12):** A secret-protected `/email/inbound` webhook
accepts only enabled tenant inboxes and active organization members. It was
exercised locally with an enabled inbox and returned HTTP 201 with a new OPEN
ticket. A mail vendor only needs to forward its normalized message payload to
this endpoint with the deployment secret.

**AI/transcription provider boundary (superseded 2026-08-19):** Analysis now
uses the encrypted per-organization OpenAI-compatible configuration and Chat
Completions structured output. The former global provider variables are legacy
migration inputs only. Voice is deliberately prepared for the intake-session
pipeline in GOAL-014 rather than continuing the ticket-first legacy job path.

**Ticket UX refinement (2026-08-12):** Attachment upload now disables repeat
submission and visibly reports preparation, secure upload, failure, and
completion. Requester feedback remains limited to resolved/closed tickets and
reports its saved result. The web production build and all 28 API tests pass.

**Commercial transformation:** Phases 0 through 2 are complete. The commercial
product scope, role-based information architecture, nine delivery phases, and
acceptance criteria are defined in `docs/COMMERCIAL_PRODUCT_PLAN.md`. The web
now has a protected responsive RTL shell, role-aware navigation, persistent
local session, organization context, accessible states, and bounded pages for
dashboard, tickets, knowledge, reports, organization administration, and
platform administration. Role dashboards use live permitted ticket counts,
manager workload, and protected platform aggregates; they were browser-tested
against the local database. Phase 3 administration is complete: organization
admins can manage members, catalogs, closure policy and response templates;
platform admins can view and activate/suspend organizations. Migration 009
applied locally and all quality gates passed. Phase 4 is complete: the ticket
workspace provides role-scoped queues, text/status/priority filtering,
sorting, session-saved views, assignment, tag creation/linking, watching, and
server-validated bulk transitions. The live local browser flow was verified
with the organization-admin account after an API restart. Phase 5 is complete:
the ticket detail now unifies public messages, staff-only notes and activity
history; supports secured attachment upload/download, requester ratings,
closure/reopen actions consistent with the fixed lifecycle, and a protected
live notification center. Browser testing confirmed staff-only notes appear in
the unified timeline without exposing a separate requester view. Phase 6 is
complete: tenant business calendars drive SLA due times, active policies drive
timers, the periodic monitor issues warning/breach escalation, assignment rules
automatically route new tickets, and in-app notification preference is exposed
in the product shell. Deterministic calendar and two-tenant escalation tests
plus automatic-assignment integration coverage pass. Phase 7 is complete:
supervisors and organization administrators have a role-scoped operational
report with a validated, bounded date-range builder and matching safe CSV
export; the knowledge base supports contributor authoring, review submission,
manager review and publication, and published-only search. API lifecycle and
export-policy tests pass, and the full knowledge lifecycle plus live report
metrics were browser-tested against the local database. Phase 8 is complete:
platform administrators can control each organization's AI entitlement, model,
and recorded usage; requesters see clearly labelled AI review/confirmation and
manual-fallback guidance in their ticket workspace; transcription jobs expose
state, attempts and retry controls. AI and transcription actions are written to
the audit log and surfaced to platform administrators. Provider failure is
covered by integration testing without blocking the ticket path. Phase 9 is in
progress: local release hardening now includes security headers, request IDs,
structured request timing logs, fixed-window rate limiting, readiness failure
handling, release-gate automation, a concurrent health/readiness smoke load
test, local browser smoke evidence, and a completed isolated PostgreSQL
restore drill with RLS verification. The final staging-only gates remain
unverified because no staging deployment, registry, secret manager or managed
backup target is available in this workspace.

GOAL-001 through GOAL-012 are complete. The repository contains the executable
foundation plus a PostgreSQL migration for organizations, users, memberships,
roles/permissions, organization directory tables, audit logs, and RLS policies.
Local authentication supports bootstrap platform administration and login.
Tenant-scoped tickets now support draft creation, submission, canonical status
transitions, manual assignment, transition history, audit events, public
conversation messages, staff-only notes, append-only activity history, and
authorized SSE ticket notifications. Secure attachment upload requests, object
metadata verification, and time-limited S3-compatible URLs are available.

Validation on 2026-08-09: PostgreSQL 18.4 is installed locally and Jupiter is
running at 127.0.0.1:5433. Migration 001_identity.sql applied successfully;
RLS returned one department for each of two tenant contexts and zero for an
unknown context. Migration 004_conversation.sql applied and the integration
suite verified requester/internal-note secrecy, append-only conversation
records, RLS isolation, and recipient-scoped SSE notification delivery. The
local database password exists only in ignored .env. Migration
005_attachments.sql applied; upload validation and authorization integration
tests pass.

**InspectA final verification (2026-08-12):** Live browser inspection confirmed
the dashboard, reports, knowledge workspace, SLA calendar/assignment controls,
organization administration, account settings and notification controls. An
email-ingress test record was normalized to avoid broken-character sample data,
and notification event codes now render as Persian user-facing labels.
`pnpm verify:release` passed after those final changes (28 API tests and both
production builds).

**Platform-role evidence (2026-08-12):** A fresh platform administrator with
zero organization memberships authenticated successfully and received HTTP 200
from the platform AI-settings endpoint. This proves the platform-only route is
not gated by an organization membership.

**Organization-admin API matrix (2026-08-12):** A live admin session returned
HTTP 200 for all of: ticket queue/views/catalog/custom fields; public and
workspace knowledge; dashboard overview; report breakdown; member/catalog/team
settings; email/custom-field administration; SLA calendar/rules; and the
notification inbox. This removes the prior active-page server-error evidence.

**Session evidence (2026-08-12):** Live login and cookie-backed refresh both
returned HTTP 201; the refresh response contained an access token but never a
refresh token. This confirms the refresh token remains HTTP-only and rotation
is handled by the cookie session.

**Release gate (2026-08-12):** `pnpm verify:release` completed successfully:
API and web lint/typecheck, 28 API tests, and both production builds passed.

**Expired-session browser evidence (2026-08-12):** Invalid JWT verification
now maps to HTTP 401. A live browser reload with an invalid stale session
cleared client state after refresh failure and rendered the login screen; it
did not display an internal-server-error on the administration page.

**Localization evidence (2026-08-12):** The live organization-admin extension
screen was inspected. Custom-field types are presented in Persian (for example
«متن» rather than `TEXT`); its admin tabs, member controls and secure email
settings were all rendered without an API error.

**Responsive/accessibility evidence (2026-08-12):** At 390px width, the live
application rendered a collapsed «منو» control. Opening it exposed every
authorized route, and the keyboard skip link to `#main-content` remained
present. This verifies the mobile-navigation and primary skip-navigation paths.

**Ticket-detail localization (2026-08-12):** Live detail inspection exposed
raw status/priority/activity codes, which were replaced with user-facing
Persian mappings. The same detail then rendered «باز» and «عادی» rather than
`OPEN` and `NORMAL`; no duplicate message-history panel was present.

**Header control alignment (2026-08-16):** The organization selector and
account menu are now one RTL control group. Notifications remain at the right
of the header and flexible spacing moves that group to the left, preventing the
selector from being isolated in the middle of the header.

**Mobile navigation contrast (2026-08-16):** Hover and keyboard focus on the
mobile hamburger control now use a Jupiter-purple surface with white menu
strokes for reliable contrast.

**Service title (2026-08-17):** The login brand, expanded product mark, and
product-shell header use «مرکز خدمات پشتیبانی».

**Header popovers (2026-08-16):** Global search and notifications use compact,
labelled icon triggers. Their panels open inward within the viewport and close
on an outside pointer interaction or Escape.

**Login rate-limit isolation (2026-08-16):** Login attempts now use their own
strict, environment-configurable rate-limit bucket. Saturated general API
traffic cannot lock out a legitimate sign-in, and the web client distinguishes
rate limiting from invalid credentials. The local API was rebuilt and restarted
with this behavior, and its health endpoint returned HTTP 200.

**User administration password control (2026-08-16):** Password changes are
available inside the «مدیریت» form for both organization members and platform
users. A new password requires 10 characters, revokes that user's active refresh
sessions, and is audited without storing the password in audit metadata. API
typecheck, 31 API tests, web typecheck, and the production web build pass; the
local API restart returned healthy and ready responses.

**Mobile drawer backdrop (2026-08-16):** The click-to-close area outside the
mobile navigation drawer now uses a subtle neutral dimmer rather than a purple
overlay. The override is deliberately placed after legacy drawer rules so it
has precedence. The backdrop's hover state is also explicitly neutral because
it is a close button and would otherwise inherit the generic purple button
hover treatment.
