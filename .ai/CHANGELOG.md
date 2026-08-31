# Changelog

## GOAL-050 — چرخهٔ عمر اشتراک تجاری

- وضعیت‌های رسمی اشتراک، گذارهای کنترل‌شدهٔ Platform، مهلت تجاری قابل تنظیم، worker انقضا، اعلان dedupe و نمایش RTL مالک/پلتفرم افزوده شد.
- پایان اشتراک فقط قابلیت‌های تجاری و پذیرش جدید Assist را محدود می‌کند؛ ثبت و پیگیری دستی تیکت بدون وقفه باقی می‌ماند.
- remediation پذیرش: Assist اکنون فقط با entitlement و subscription مؤثر `JUPITER_ASSIST` پذیرفته می‌شود؛ تمدید `PAST_DUE` tenant-bound، پوشش graph/grace/AI و data-preservation و اعلان‌های تکرارپذیر افزوده شد.

## GOAL-049 — کنترل تجاری مالک و مصرف مازاد

- سیاست overage، درخواست تجاری، صف Platform و اعلان تجاری idempotent اضافه شد.
- remediation: اعتبارسنجی tenant-bound renewal، auditهای صریح و coverage هم‌زمانی overage افزوده شد.

## 2026-08-31

- Completed GOAL-048 cross-domain hardening and final acceptance. Rehearsed
  forward migration from the 001–032 legacy baseline through 045a, corrected
  the Appearance/Auth module startup dependency and notification event-stream
  route, and completed authenticated Persian RTL acceptance. Mobile Platform
  controls now use a concise selector instead of a clipped tab strip below
  700px.

- Completed GOAL-047 Help authoring and discovery. Added Platform Admin-only
  revision lifecycle/exports, Persian audience-aware Help Center and compact
  contextual guidance for AI, directory and Jupiter Assist settings.

- Completed GOAL-046 Product Help domain and seed pipeline. Added global,
  versioned and audience-aware published Help revisions, six Persian repository
  seeds, non-disclosing draft/unpublished reads and an idempotent seed command;
  tenant knowledge remains unchanged.

- Completed GOAL-045 Platform commercial controls and governed appearance.
  Added Assist agent/policy/capacity/SLA controls, an auditable preset-only
  platform appearance record and Persian RTL administration screen; no custom
  code, tenant theme or provider authority was introduced.

## 2026-08-30

- Completed GOAL-044 owner commercial dashboard. Added a tenant-bound,
  read-only Persian summary of allowance, packs, AI activity and Jupiter Assist
  capacity; only explicit `ORG_OWNER` memberships can open it, while platform
  commercial authority and owner-less legacy organizations remain unchanged.

- Completed GOAL-043 independent Jupiter Assist lifecycle: migration 043, independent case/SLA/access-request records, one-time acceptance capacity settlement and Persian requester ticket action; ticket status remains unchanged.

- Completed GOAL-042 Jupiter Assist commercial and access foundation. Added migration 042, platform-only policy/capacity and agent administration, tenant-bound scoped/revocable grants and restricted-ticket protection without making Jupiter agents organization members or changing ticket flow.

- Completed GOAL-041 commercial Smart Action metering for AI. Added migration
  041, effective-capability gating, idempotent reserve/release/settle behavior,
  source-order allowance consumption and a Persian operator explanation.
  Only successfully persisted and delivered AI review output can consume a
  customer unit; provider failures, tests, retries and manual ticketing do not.

- Completed GOAL-040 allowance and pack foundations. Added migrations 040/040a,
  repeat-safe Platform Admin allocations, add-on packages, tenant commercial
  state, an application-role immutable Usage Ledger and Persian RTL controls;
  no AI/provider operation can consume a customer unit yet.

- Completed GOAL-039 capability resolution. Added a tenant-safe server-side
  resolver requiring active entitlement, enabled organization setting and
  available platform capability; added concise Persian Platform Admin controls
  and all-combination integration coverage without introducing allowance or AI
  settlement.

- Completed GOAL-038 minimal commercial core. Added migration 039, Platform
  Admin-only product/agreement controls, auditable availability/organization
  setting foundations and platform-route compatibility for Platform Admins who
  also belong to an organization. Migration rehearsal, 66 API tests, 11 Web
  tests, typechecks, production builds and authenticated responsive acceptance
  passed.

- Completed GOAL-037 directory sync lifecycle. Added migration 038, paired
  rotating-device preview/apply/lifecycle records, no-email directory
  provisioning and a DPAPI/WinSW outbound Windows-service scaffold. Verified
  the supplied AD endpoint and corrected the scoped DN; no directory credential
  was retained.

- Completed GOAL-036 directory connector control plane. Added migration 037,
  tenant-bound short-lived pairing, revocable device identity, a Persian
  connector control page and a technology validation matrix; no AD credentials
  or synchronization behavior was introduced.

- Completed GOAL-035 controlled manual and CSV user provisioning. Added
  migration 036, owner-aware member governance, safe CSV preview/confirmation,
  tenant-scoped retry idempotency and Persian responsive administration UI.

- Completed GOAL-034 canonical tenant routing, explicit legacy-owner
  assignment and resumable setup activation. Added migration 035, Persian setup
  checklist, server slug-membership resolution and responsive browser evidence.

- Completed GOAL-033 Platform Admin organization review and atomic tenant
  provisioning: exact review transitions, selected-slug reservation, setup
  tenant, initial owner/admin membership, idempotent retry and no legacy-owner
  auto-promotion. Added Persian applicant review guidance and keyboard-accessible
  review tabs; authenticated responsive acceptance passed.

## 2026-08-29

- Completed GOAL-032 public organization onboarding: Persian RTL account and
  application flow, verification status/resend, applicant workspace for
  no-membership accounts, non-production local inbox and configured HTTPS
  webhook/disabled delivery modes. Added operator and Persian applicant guides.

## 2026-08-29

- Added GOAL-031 public-account and organization-application foundation:
  migration 033, additive authentication identities, directory principals,
  verification token/delivery persistence, exact application statuses,
  applicant-owned idempotent transitions, audit events and API coverage.
  Existing email/username login remains compatible; platform review and tenant
  provisioning are deferred.

## 2026-08-29

- Completed GOAL-030 documentation baseline for the approved Master Upgrade:
  added the authoritative upgrade plan, DEC-018 through DEC-027, migration and
  security gates, Persian Help impact policy, GOAL-031 preparation and evidence.
  No production code, migration, API, dependency or runtime behavior changed.

## 2026-08-29

- Replaced Organization Administration's horizontal tab strip with grouped,
  deep-linkable workspace navigation; added compact mobile section selection,
  browser-history support and DEC-017 without changing any management API or
  permission behavior.

## 2026-08-29

- Refined the product shell and navigation: compact desktop/sidebar dimensions,
  restrained active states, contextual platform/organization labels, a
  non-interactive single-organization context, accessible collapsed-route
  tooltips, and predictable mobile drawer focus behavior.

## 2026-08-29

- Added Design System V2 semantic tokens, reusable UI foundations, Persian
  terminology registry, governed future appearance rules, and the first shared
  dashboard error/loading/status treatment.
- Prepared GOAL-028 for product-shell and navigation refinement.

## 2026-08-03

- Added the canonical Jupiter architecture and execution documentation baseline.
- Added GOAL-001 completion record and prepared GOAL-002.

## 2026-08-05

- Added the pnpm TypeScript workspace, NestJS health API, React/Vite RTL shell,
  Compose development services, quality scripts, and CI baseline.

## 2026-08-09

- Added PostgreSQL migration, RLS tenant isolation, local authentication,
  bootstrap platform-admin support, and organization directory schema.
- Added tenant-scoped ticket drafts, submission, assignment, transition history,
  audit records, and lifecycle integration tests.
- Added public ticket conversation, staff-only internal notes, append-only
  ticket activity history, and recipient-scoped SSE notifications.
- Added S3-compatible attachment adapter, secure attachment metadata workflow,
  allowlisted media validation, and short-lived signed URLs.
