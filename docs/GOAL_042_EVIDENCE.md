# GOAL-042 — Jupiter Assist commercial and access foundation

Date: 2026-08-30

## Delivered boundary

- Migration 042 adds platform-managed organization Assist policy/capacity, Jupiter support-agent registration and tenant-RLS-protected support grants.
- A grant is routed-only, selected-scope or full-support, has an explicit lifetime and can be revoked. Default scope is routed-only.
- A Jupiter agent is a global support user, not a tenant member. Platform Admin is the only authority for agent, policy and grant records in this foundation.
- `Ticket.is_restricted` does not change ticket lifecycle. A restricted ticket requires an active matching routed-ticket grant explicitly marked for restricted access; full support never bypasses it.
- Assist request, approval, acceptance, queue, SLA and capacity settlement remain GOAL-043 work.

## Verification

- Migration 042 was applied locally.
- Integration coverage proves Platform Admin authority, zero tenant membership for a Jupiter agent, normal/full-support visibility, cross-tenant denial, expiry, revocation and restricted-ticket protection.
- Root typechecks, 24 API test files / 70 tests, 2 Web test files / 11 tests, production builds, migration rehearsal and `git diff --check` pass.

## Persian operator guidance

«دسترسی پشتیبانی Jupiter» عضویت سازمانی نیست؛ مجوزی زمان‌دار و قابل لغو است. تیکت محدود فقط با مجوز صریح همان تیکت قابل مشاهده است.
