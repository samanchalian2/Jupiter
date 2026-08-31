# GOAL-038 — Minimal commercial core evidence

Date: 2026-08-30

## Delivered boundary

- Migration 039 introduces the intentionally small commercial record set:
  Product, Subscription, Entitlement, Add-on Package, Organization Commercial
  Agreement, Usage Allowance, Usage Ledger, Platform Availability and
  Organization Feature Setting. It deliberately does not introduce
  ProductVersion, invoices, payment processing or accounting entities.
- Tenant-owned commercial records are protected by PostgreSQL RLS. Global
  product/catalog availability records remain Platform Admin-owned.
- Platform Admin can maintain the product catalog and one commercial agreement
  for each organization through the Persian «تجاری» console. The screen is
  explicit that a catalog or agreement alone does not grant capability or
  allowance.
- Availability and organization-setting records are auditable foundations only.
  GOAL-039 will introduce the server-side effective-capability resolver; no UI
  hiding or current provider operation is treated as authorization or billing.
- Product, agreement, availability and feature-setting changes have minimal
  audits. The implementation does not write a Usage Ledger entry for a
  provider-like infrastructure operation, preserving DEC-025.
- Platform routing now remains reachable for a Platform Admin who is also a
  member of an organization; the platform route no longer renders against an
  organization router base.

## Verification completed

- Migration 039 was rehearsed locally and is already applied.
- Root API and Web TypeScript checks passed.
- Root test suites passed: 24 API files / 66 tests and 2 Web files / 11 tests.
  The new commercial integration test proves Platform Admin denial for a normal
  organization administrator, product and agreement management, RLS isolation
  for organization feature settings, and no ledger consumption.
- API and Web production builds passed.
- `git diff --check` passed.

## Authenticated responsive acceptance

The Platform Admin «تجاری» tab was checked in the authenticated local browser
at 375, 768, 1024 and 1440px. At each size the active tab and both commercial
sections rendered, and document scroll width equalled client width: no
document-level horizontal overflow occurred. No browser console error was
observed during the check.

## Persian operator guidance

محصول را فقط به‌عنوان یک آیتم کاتالوگ و قرارداد را فقط به‌عنوان مبنای تجاری
ثبت کنید. ایجاد محصول یا قرارداد به‌تنهایی دسترسی قابلیت، سهمیه یا مصرف ایجاد
نمی‌کند. تنظیم دسترسی مؤثر و سهمیه‌ها در مرحله‌های بعدی، روی سرور و با ثبت
ممیزی اعمال خواهند شد.
