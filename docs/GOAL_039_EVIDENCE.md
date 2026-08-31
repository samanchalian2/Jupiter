# GOAL-039 — Entitlement, settings, availability and capability resolution

Date: 2026-08-30

## Delivered boundary

- `CommercialService` now resolves an effective capability only when all three
  independent server-side checks pass: an active, in-window entitlement; an
  enabled organization feature setting; and an available platform capability.
  A missing record is a denial.
- The resolver is tenant-bound and exposes an authenticated organization-member
  view. `requireEffective` is the server-side gate for later capability
  consumers; it rejects a non-effective capability rather than relying on UI
  visibility.
- Platform Admin can manage/view entitlement records, platform availability and
  organization settings in the Persian RTL «تجاری» console. Each change remains
  minimally audited. Existing organizations and memberships are not altered.
- This Goal adds no allowance reservation, Usage Ledger settlement, pack
  purchase, AI execution, provider billing, Assist, payment or ProductVersion
  behavior.

## Verification

- Integration coverage exercises all resolver outcomes: platform unavailable,
  setting disabled, suspended entitlement, expired entitlement, fully enabled
  capability, `requireEffective` enforcement and cross-tenant denial.
- Root typechecks passed.
- Root tests passed: 24 API files / 67 tests and 2 Web files / 11 tests.
- API and Web production builds passed. The migration runner completed with the
  current schema; GOAL-039 requires no new migration because migration 039
  already established these records.
- Authenticated Platform Admin browser acceptance passed at 375, 768, 1024 and
  1440px. The «تجاری» tab rendered entitlement and control sections at every
  size with no document-level horizontal overflow.

## Persian operator guidance

قابلیت فقط وقتی مؤثر است که سه شرط هم‌زمان برقرار باشند: «استحقاق فعال»،
«تنظیم فعال سازمان» و «دسترس‌بودن پلتفرم». تغییر هر کدام بلافاصله نتیجهٔ
سرور را تغییر می‌دهد. این کنترل‌ها سهمیه یا مصرف ایجاد نمی‌کنند و عملیات
داخلیِ ارائه‌دهندهٔ AI نیز هنوز واحد قابل‌صورتحساب نیست.
