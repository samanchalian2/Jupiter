# GOAL-041 — Commercial Smart Action metering for AI

Date: 2026-08-30

## Delivered boundary

- Migration 041 adds `commercial_smart_actions`: tenant-RLS-protected,
  idempotent reservations with `RESERVED`, `SETTLED` and `RELEASED` states,
  delivery reference and a selected source (`PERIODIC`, `ADDON`, `EMERGENCY`).
- The server enforces the effective commercial capability before reserving an
  `AI_TICKET_REVIEW` action. Under an organization/capability advisory lock it
  selects periodic allowance first, then purchased add-on capacity, then
  emergency allowance.
- A settled action writes one negative `SMART_ACTION_SETTLED` ledger entry and
  one minimal audit event in its transaction. Repeated settlement is
  idempotent. Failed, invalid or undelivered work releases its reservation and
  writes no consumption event.
- The AI Gateway reserves before its permitted customer-facing review, then
  settles only after its result is persisted and marked available to its
  authorized requester. A metering interruption after delivery does not turn a
  valid result into an AI failure or create a second consumption.
- Manual ticketing is untouched. Connection tests, diagnostics, provider
  retries and other internal operations do not call settlement.

## Verification

- Migration rehearsal completed locally with `pnpm --filter @jupiter/api
  migrate`.
- Root typechecks passed. Root tests passed: 24 API files / 69 tests and 2 Web
  files / 11 tests. API and Web production builds passed. `git diff --check`
  passed.
- Integration coverage proves effective-capability gating, periodic settlement,
  idempotent settle, released no-billing behavior, AI success settlement and
  failed-provider release without blocking a manual ticket.
- Authenticated Platform Admin browser acceptance confirmed the updated Persian
  commercial guidance and no document-level horizontal overflow at the active
  compact viewport.

## Persian operator guidance

«مصرف مشتری فقط پس از تحویل موفق Smart Action تسویه می‌شود؛ آزمون اتصال، تلاش
مجدد و عملیات داخلی مصرفی ندارند.»
