# Current State

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
