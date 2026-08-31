# GOAL-040 — Allowances, packs and immutable usage ledger

Date: 2026-08-30

## Delivered boundary

- Migrations 040 and 040a add additive allowance-allocation metadata, configured
  add-on packages, tenant-RLS-protected add-on allocations and repair-safe
  immutable Usage Ledger protection.
- A Platform Admin can create an add-on package, allocate a periodic/emergency
  allowance, or allocate an active package to an organization. Each allocation
  needs an idempotency key; a repeat returns the original record and writes no
  second ledger event.
- The application role can select/insert but cannot update or delete the Usage
  Ledger. An update trigger is an additional guard. Database-owned cascades can
  still remove tenant data under a legitimate administrative lifecycle.
- Tenant members can obtain their commercial state through the tenant-bound
  state API; they have no allocation authority. Platform controls are Persian
  RTL and remain compact.
- This Goal records allocation entries only. It deliberately does not reserve,
  consume or settle a unit. Resolver calls, provider-like operations, retries,
  diagnostics and connection tests leave the Usage Ledger unchanged.

## Verification

- Migration 040 and its repair-safe permission migration 040a were applied
  locally.
- Integration coverage proves Platform Admin-only allocation, allowance and
  add-on idempotency, tenant isolation, immutable update/delete denial, tenant
  commercial-state visibility and no ledger change from a provider-like
  operation.
- Root typechecks passed. Root tests passed: 24 API files / 68 tests and 2 Web
  files / 11 tests. API and Web production builds passed.
- Authenticated Platform Admin acceptance at 375, 768, 1024 and 1440px showed
  the commercial allocation controls without document-level horizontal overflow.

## Persian operator guidance

«سهمیه» و «بستهٔ افزایشی» فقط تخصیص تجاری هستند؛ هنوز مصرف ایجاد نمی‌کنند.
برای جلوگیری از ثبت دوباره، هر تخصیص با یک کلید تکرارپذیری ثبت می‌شود. دفتر
مصرف برای حسابرسی تغییرناپذیر است. مصرف مشتری تنها در مرحلهٔ Smart Action و
پس از تحویل موفق نتیجه قابل تسویه خواهد بود؛ آزمون اتصال و عملیات داخلی هیچ
واحدی کم نمی‌کنند.
