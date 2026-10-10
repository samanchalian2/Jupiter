# Changelog

## 2026-10-10 — Preview regression hardening

- Deployed commit `73c93a0` to the authorized IP Preview after 139 API tests,
  14 Web tests, both typechecks, both production builds and `git diff --check`
  passed.
- Made organization-branding reads fall back to the canonical Jupiter logo
  when optional object storage is not configured; upload operations remain
  gated by storage availability and validation.
- Removed overlapping `client.query()` calls from tenant transactions across
  commercial summaries, reporting, tickets, setup and personal capacity.
- Normalized invalid and expired JWT verification failures to HTTP 401.
- Rechecked authenticated product routes and server journals: no broken images,
  visible loading errors, document overflow, post-ready 5xx, API warnings or
  PostgreSQL overlap warnings were found. No co-hosted application or database
  was changed.

## 2026-10-10 — Authorized IP preview synchronization

- Synchronized the existing isolated HTTP Preview through application commit
  `f64d218` and rebuilt API and Web in place.
- Created a protected `jupiter`-only rollback backup, applied migrations
  057–060 and verified all 71 migration records without touching the co-hosted
  application or its database.
- Published four Personal Service Help guides, restarted only the Jupiter API
  and worker, and verified Web, health and readiness HTTP 200 responses plus
  canonical-logo rendering without document overflow.

## 2026-10-09 — Canonical Jupiter logo remediation

- Replaced the built-in Web logo with the owner-supplied Lavender/cream/gold
  Jupiter planet and wordmark asset.
- Removed duplicate product/support-center text beside the canonical wordmark,
  while preserving a planet-only compact presentation and organization logo
  override behavior.
- Pointed the initial and runtime favicon identity at the canonical asset.
- Updated only the local `jupiter-demo` logo through the supported audited
  organization-branding upload flow; other tenant branding was untouched.
- Corrected compact-symbol cropping and mobile-header containment so the
  planet no longer appears clipped beneath the menu; narrow headers now omit
  redundant context labels before compressing navigation or account targets.

## 2026-10-07 — GOAL-066 Personal Service hardening and acceptance

- Completed cross-domain Personal Service acceptance across verified account
  provisioning, canonical routing, tickets, Personal Support, SUPPORT/AI
  capacity, packages, payment callback/receipt and contextual Help.
- Corrected Personal Support lifecycle labels to canonical backend states and
  clarified public onboarding so personal activation precedes optional
  organization registration.
- Added safe payment callback-return tests and hardened Help search assertions
  for multiple equally relevant Persian AI guides.
- Passed 71-migration rehearsal, 137 API tests, 14 Web tests, typechecks,
  production builds, health smoke, security scans, diff validation and
  authenticated RTL browser acceptance at four widths; removed the temporary
  PERSONAL fixture completely.

## 2026-10-07 — GOAL-065 Personal workspace UX and Help

- Added focused Persian `/personal` dashboard and services routes with simple
  monthly/purchased capacity, package expiry, service state and manual-ticket
  fallback presentation.
- Added active-package purchase redirect/return handling, safe order states,
  cancellation and readable non-tax payment receipts without provider authority
  or secrets in Web URLs.
- Connected Personal Ticket Review and Smart Intake to the separate AI capacity
  pool with idempotent reserve, exact-once settle and failure release.
- Routed personal ticket help to Personal Support, exposed case state and
  queued cancellation, and retained organization Assist unchanged.
- Added four published Persian personal-workspace Help guides/context triggers
  and Platform AI configuration for personal workspaces.
- Passed 135 API tests, 13 Web tests, API/Web typechecks and builds, diff check,
  plus authenticated RTL/no-overflow browser acceptance at 375/768/1024/1440;
  removed the temporary acceptance workspace completely.

## 2026-10-07 — GOAL-064 Personal payment core

- Added provider-neutral payment contracts with Zarinpal v4 as the first live
  adapter and a deterministic, credential-free local adapter forbidden in
  production.
- Added immutable tenant payment-order snapshots, safe attempts, server-side
  authority/amount verification, callback replay defense and exact-once
  fulfillment into one PAYMENT package allocation.
- Added owner receipt/cancel APIs and Platform-only non-secret availability/
  mode, safe order inspection and recording of externally completed refunds.
- Kept merchant credentials environment-only and excluded provider payloads,
  card data and secrets from storage, client, logs and audit metadata.
- Passed the isolated 71/71 migration rehearsal, 134 API tests, 13 Web tests,
  API/Web typechecks, builds and diff validation.

## 2026-10-07 — GOAL-063 Personal capacity and packages

- Added separate SUPPORT and AI monthly pools with immutable UTC windows,
  defaults 3/10, no rollover and future-only Platform policy/overrides.
- Added Platform-owned support/AI package catalog and tenant allocations with
  immutable unit, Toman price and bounded-validity snapshots.
- Connected Personal Support to atomic monthly-then-nearest-expiry reservation,
  pre-accept release and exactly-once acceptance settlement.
- Added compact Platform controls for defaults, override/reset, package
  catalog, manual allocation/revocation and current capacity projection.
- Hardened RLS/composite integrity and revoked tenant writes to Platform-owned
  commercial rows; passed 70/70 migrations, 130 API tests, 13 Web tests,
  typechecks, builds and responsive authenticated browser acceptance.

## 2026-10-07 — GOAL-062 Personal Support operations

- Added a minimal Platform-owned Personal Support catalog with configurable
  availability, visible copy, operational SLA and bounded access duration.
- Added tenant-scoped Personal Support cases and a separate lifecycle without
  reusing organization Assist or changing ticket lifecycle.
- Reused the global Jupiter-agent registry while issuing only exact-ticket,
  time-bound, revocable grants and never creating tenant memberships.
- Hardened case/ticket composite integrity, RLS, application-role privileges,
  concurrency-safe acceptance, actor-accurate audit and Assist grant-source
  separation.
- Added compact Platform controls and passed the 68/68 migration rehearsal,
  126 API tests, 13 Web tests, typechecks, builds and authenticated RTL browser
  acceptance without horizontal overflow.

## 2026-10-07 — GOAL-061 Personal workspace foundation

- Added explicit organization/personal workspace typing and a unique verified
  personal owner without replacing the existing tenant/RLS boundary.
- Added transactional verification-time provisioning plus an idempotent
  login/refresh path for eligible legacy accounts.
- Added canonical `/personal` selection while preserving organization
  memberships, applications and `/o/{slug}` behavior.
- Enforced requester-only personal membership and blocked organization admin,
  owner, Commercial, Assist and organization AI semantics for personal tenants.
- Passed the isolated 001–057 migration rehearsal, 122 API tests, 13 Web tests,
  both typechecks/builds, built-API health smoke and diff validation.

## 2026-10-07 — GOAL-060 Personal Service architecture

- Approved one private personal workspace per verified account while retaining
  the existing Organization tenant/RLS boundary and organization memberships.
- Recorded separate Personal Support, support/AI allowance and package models,
  configurable Platform policy, and immutable security/settlement rules.
- Selected adapter-based, server-verified payment with Zarinpal first, Toman
  `IRT` order snapshots and exactly-once fulfillment.
- Added DEC-034 through DEC-037, GOAL-060 evidence and the GOAL-061–066 delivery
  sequence. No production code, migration, API or runtime data changed.

## 2026-10-06 — Public website training package

- Added a self-contained Persian master prompt and complete website copy for
  organization onboarding, daily member usage and users without an organization.
- Added a concise, non-marketing product introduction and a scan-friendly
  inventory of the delivered ticketing, knowledge, administration, Directory,
  AI, Assist, commercial and Appearance capabilities.
- Defined the website hierarchy around Teal `#014348`, limited Purple accent
  `#867C98`, WCAG-safe white-text Purple `#756A88`, and calm Beige guidance
  surfaces `#D8C3A6`/`#F8F2EA`.
- Grounded the material in the implemented registration, ten-step Setup Wizard,
  role boundaries, ticket lifecycle, Directory, AI and Assist behavior.
- Added simplified examples, checklists, troubleshooting, FAQ, screenshot
  placeholders, configurable CTAs and responsive/WCAG/SEO acceptance rules;
  no local address, credential or unsupported feature is included.
- Kept the work in the local Jupiter task/repository workflow; no ChatGPT Work
  Cloud task or website publication is part of this artifact.

## 2026-10-06 — Accessible deeper Lavender primary

- Deepened the canonical Jupiter primary from `#A89BBE` to `#796E89`, with
  hover `#6D627D`, active `#61566F` and deterministic white `onPrimary`.
- Applied the accessible action family consistently to Light and Dark themes,
  default logo treatment, runtime/server tokens, appearance previews,
  validation tests and Persian Appearance Help.
- Preserved warm Beige `#D8C3A6`, OCEAN/TEAL presets, explicit tenant Custom
  Primary values and all semantic success/warning/danger colors.

## 2026-10-05 — Lavender/Beige visual theme remediation

- Rebalanced the two-color identity after visual review: Beige now appears on
  secondary controls, page-context washes, empty/helpful states and the compact
  header, with accessible warm text/border companions and restrained dark-mode
  equivalents; Lavender remains the sole primary action/selection color.
- Safely fast-forwarded the authorized HTTP-only IP preview to `e4b8587`, built
  API/Web production artifacts and restarted only the dedicated Jupiter preview
  API/worker services; Web and health checks return HTTP 200.
- Verified the real Persian login renders the Lavender/Beige identity without
  document-level horizontal overflow. No migration or unrelated database,
  service or application change was made.
- Rebased Jupiter's built-in palette on Lavender `#A89BBE` and supporting
  Beige `#D8C3A6`, replacing legacy Teal identity tokens in the live UI.
- Added a compact, local user preference for accessible light and dark
  surfaces without changing persisted Platform/Organization appearance,
  existing presets, Custom Primary values or semantic status colors.
- Exposed the preference on both sign-in and account surfaces, neutralized
  browser autofill, and removed residual legacy blue identity colors from
  operational screens. Responsive light/dark acceptance passed at 375 and
  1440px without document overflow.

## 2026-09-16 — GOAL-059 Staging resume audit

- Performed the authorized non-destructive staging-host inventory from the
  protected local credential source; no existing service was overwritten.
- Recorded the canonical DNS blocker and host free-disk prerequisite in
  `docs/GOAL_059_EVIDENCE.md`; GOAL-059 remains blocked and GOAL-060 remains
  unstarted.

## 2026-09-15 — Teal palette remediation

- Rebased Jupiter's canonical primary palette, default logo and favicon on
  `#014348` without changing existing presets or custom tenant colors.

## 2026-09-08 — GOAL-059 staging release gate audit

- Recorded the real release candidate identity and an evidence-based staging
  gate matrix.
- Marked deployment-only gates BLOCKED because no staging infrastructure or
  Windows/AD Connector host is available; no local evidence was promoted to a
  staging claim.

## GOAL-058 — Full End-to-End Business Acceptance

- Executed supported application/provisioning for temporary Setup, Active and
  Isolation tenants; verified owner-only concurrent Go-Live, role boundaries,
  full ticket lifecycle and cross-tenant/Platform non-disclosure.
- Revalidated AI allowance/settlement, commercial lifecycle, Assist capacity
  and grants, Directory lifecycle, appearance and audience-safe Help against
  the integrated suite and authenticated Persian RTL routes at 375/768/1024/
  1440.
- Corrected a temporary Setup fixture cleanup order so test tickets are removed
  before memberships; final fixture and DB integrity checks are clean.
- Rehearsed migrations through 056 in an isolated database and passed 117 API
  tests, 13 Web tests, typechecks, production builds and diff check.

## GOAL-057 — Appearance Theme Migration & Custom Primary Validation

- Jupiter Light Theme primary migrated to `#315399` with deterministic derived
  primary tokens and independent semantic colors.
- Platform and Organization now have governed, audited Custom Primary overrides
  with server-side hex/contrast validation, inheritance and reset semantics.
- `onPrimary` is selected deterministically as white or the approved dark
  foreground, and authenticated RTL browser acceptance at 375/768/1024/1440
  passed without document-level overflow.
- Remediation: Platform «حذف رنگ سفارشی» now clears only `custom_primary`;
  preset, density, radius and logo remain unchanged and effective primary
  resolves from the selected preset.

## GOAL-056 — تکمیل محتوای راهنمای محصول

- کاتالوگ راهنمای فارسی به ۱۵ راهنمای دامنه‌ای منتشرشده رسید: هفت مقالهٔ پیشین با revision runtime بازبینی شدند و هشت راهنمای عملیاتی جدید افزوده شد.
- جست‌وجوی Help اکنون title، summary، دسته و برچسب را با رتبه‌بندی فارسی سبک بررسی می‌کند؛ دسته‌بندی و triggerهای contextual کامل‌تر شدند.
- publication utility فقط با Platform Admin معتبر و فقط در صورت اختلاف، revision runtime می‌سازد و منتشر می‌کند؛ seedها همچنان محتوای runtime را بازنویسی نمی‌کنند.
- remediation پذیرش: Trigger فشردهٔ «راهنمای چرخهٔ تیکت» به صفحهٔ جزئیات تیکت افزوده و anchor popover برای جلوگیری از horizontal overflow اصلاح شد؛ پذیرش احرازشدهٔ Browser در 375/768/1024/1440 گذشت.
- پذیرش نهایی Setup Wizard با fixture موقت `SETUP`، عضویت مجاز `ORG_OWNER` و مسیر canonical انجام شد: Trigger مقالهٔ منتشرشدهٔ `organization-setup-wizard` را در RTL و بدون overflow در 375 و 1440 باز کرد و همهٔ داده‌های fixture پس از آزمون حذف شدند.

## GOAL-055 — راه‌اندازی سازمان

- Wizard سازمان به progress سروری، versioned و resumable با readiness واحد و Go-Live اتمیک Owner-only ارتقا یافت.
- حداقل شرط Go-Live نام/timezone معتبر، مالک فعال و Ticket Category است؛ Directory، SLA، AI، Assist، تیم و ظاهر اختیاری‌اند.
- راهنمای فارسی runtime «راه‌اندازی سازمان» افزوده شد؛ شمارهٔ تماس سازمان اختیاری است و `contact_name` جدیدی ذخیره نمی‌شود.
- remediation: مسیر قدیمی `tenant-setup/complete` اکنون صرفاً به Go-Live canonical واگذار می‌شود؛ drift پیش از فعال‌سازی و هم‌زمانی دو درخواست با یک Audit/اعلان موفق پوشش دارد. رد readiness عمداً Audit پایدار ادعا نمی‌کند.

## GOAL-054 — عملیات عملیاتی Directory Connector

- وضعیت عملیاتی مشتق‌شده، heartbeat سبک، صف Sync دستی/زمان‌بندی‌شده و تاریخچهٔ run به Directory افزوده شد.
- نام Sync زمان‌بندی‌شده `INCREMENTAL_SNAPSHOT` است؛ Full Reconciliation مبنای lifecycle absence باقی می‌ماند.
- Scope نسخه‌دار، کشف OU/Group، نگاشت امن گروه→نقش، conflictهای قابل رسیدگی و صفحهٔ RTL عملیاتی افزوده شدند.
- پذیرش authenticated در 375/768/1024/1440 بدون document-level horizontal overflow انجام شد؛ Full با تغییر Scope Policy در میانهٔ reconciliation نیز lifecycle absence اجرا نمی‌کند.
- remediation: `POST /directory/connectors/:id/re-pair` فقط برای Connector لغوشده، همان record را با code یک‌بارمصرف جدید به جفت‌سازی مجدد می‌رساند؛ credential قبلی بازگشت‌پذیر نیست.

## GOAL-053 — مدل بسته و ظرفیت Jupiter Assist

- ظرفیت Assist به بسته‌ها، تخصیص‌های tenant-scoped و ledger تغییرناپذیر منتقل شد؛ فقط پذیرش موفق پرونده یک واحد مصرف می‌کند.
- Platform package، تخصیص، اصلاح، تعلیق و حذف صریح Owner را با Audit کنترل می‌کند؛ نمایش Owner فقط summary مجاز است.
- راهنمای فارسی Jupiter Assist در runtime به نسخهٔ ۲ منتشر شد.

## GOAL-052 — سهمیهٔ دوره‌ای و اضطراری Smart Action

- استخر مشترک ماهانهٔ عملیات هوشمند با policy قابل‌تنظیم Platform، override سازمانی، provisioning تکرارپذیر UTC، Emergency محدود و انقضای Add-on اضافه شد.

## GOAL-051 — پوشش کامل metering برای AI Smart Actions

- `AI_TICKET_REVIEW` و `AI_SMART_INTAKE` اکنون یک مسیر مشترک رزرو، telemetry امن، تحویل معتبر و تسویهٔ idempotent دارند.
- migration 049 ارجاع actor/subject و telemetry tenant-scoped را افزوده است؛ prompt، متن تیکت، transcript، فایل و secret ذخیره نمی‌شوند.
- داشبورد مالک جمع مجاز مصرف را نشان می‌دهد و Platform گزارش عملیاتیِ غیرحساس دارد؛ تبدیل مستقل صوت تجاری نشده است.

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
