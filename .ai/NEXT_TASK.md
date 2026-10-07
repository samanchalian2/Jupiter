# Next Task

## GOAL-064 — Personal Payment Core & Zarinpal Adapter (READY)

Implement only the payment boundary approved by DEC-037 on top of GOAL-063:

- add an internal payment-provider adapter and implement Zarinpal first without
  coupling the domain model or UI to provider-specific response shapes;
- add tenant-scoped payment orders that snapshot the active package ID/code/
  name, SUPPORT/AI pool, units, Toman amount, currency `IRT`, validity and
  personal workspace before any provider request;
- model idempotent order/attempt/verification/fulfillment transitions; a
  redirect or callback alone must never mark an order paid;
- create orders only for the authenticated owner of the active personal
  workspace and an active package; derive amount and units server-side;
- verify callback authority, amount and final status server-side through the
  adapter, reject replay/mismatch/cross-tenant attempts and fulfill at most once
  into one `personal_package_allocations` row with source `PAYMENT`;
- keep provider credentials and signing material environment-managed and out of
  database, client, logs and audit metadata; let Platform Admin configure only
  non-secret availability/mode and inspect safe operational state;
- add a user-readable receipt projection (not an official tax invoice) and a
  Platform-only record of externally completed manual refund with reason,
  amount, reference and real actor; do not pretend Jupiter sends gateway refund;
- provide a deterministic local fake adapter for integration tests without a
  real transaction or secret;
- test create/retry/cancel/expiry, callback replay, failed verification, amount
  mismatch, exact-once allocation, snapshots, isolation, audit and secret
  absence; run migration rehearsal and update `.ai` plus
  `docs/GOAL_064_EVIDENCE.md`.

Do not add subscriptions, recurring billing, wallet, discount/tax/accounting,
official invoicing, card data, automatic refunds or the full personal UX in
GOAL-064. Do not start GOAL-065.

## Deferred deployment gate — GOAL-059 remains BLOCKED

An authorized, HTTP-only IP preview is operational with the isolated full
Jupiter dataset, loopback-only API and dedicated system services. It is not an
official staging acceptance or a substitute for a canonical deployment.
The authorized preview host is synchronized through source commit `cb875ce`;
the 2026-10-06 deeper Lavender/Beige remediation is built and live, its Web root and
health endpoint return HTTP 200, and the Persian login renders without
horizontal overflow. Do not modify any unrelated host service or database.
An observed expired-access-token race may transiently surface the first
dashboard request as HTTP 500 before refresh succeeds; address it only in a
separately scoped Goal, not by expanding GOAL-059.
Resume GOAL-059 only when the authorized staging ingress/DNS/TLS, immutable image
registry, secret injection, managed backup/restore and monitoring access,
rollback ownership, and Windows Connector host are available. Use
`docs/GOAL_059_EVIDENCE.md`; the personal-service product sequence does not
claim or replace staging acceptance.

The 2026-09-16 authorized server audit found a reusable host, but canonical
`jupiter.pnsoffice.ir` does not yet resolve there. Publish the protected-host
IPv4 `A` record before continuing; HTTPS/TLS and an immutable-image staging
deployment have not been attempted. The temporary IP preview is not an
official staging substitute.

## GOAL-058 — Full End-to-End Business Acceptance (complete)

GOAL-058 accepted the integrated business flows through supported paths, a
three-tenant isolation journey and authenticated RTL browser sweep. It repaired
the temporary Setup-fixture cleanup order discovered during acceptance, removed
all temporary data, and passed final integrity/migration/test/typecheck/build
quality gates. Evidence: `docs/GOAL_058_EVIDENCE.md`. GOAL-059 is not started.

## GOAL-057 — Appearance Theme Migration & Custom Primary Validation (complete)

GOAL-057 added tenant-safe, audited Custom Primary validation, inheritance and deterministic
white/dark foreground selection. Its reset-semantics remediation now makes
«حذف رنگ سفارشی» preserve preset, density, radius and logo. Quality gates
passed. Its historical `#315399` canonical color is superseded by the current
the 2026-10-05 Lavender/Beige theme remediation. Existing appearance presets and
tenant overrides remain backward-compatible; the visual remediation does not
change GOAL-059 evidence or status.

## GOAL-056 — Help Content Completeness (complete)

GOAL-056 با کاتالوگ ۱۵ مقاله‌ای، publication runtime اختلاف‌محور، registry feature/route، جست‌وجوی فارسی سبک، دسته‌بندی Help Center و Triggerهای contextual پذیرفته شد. پذیرش نهایی Setup Wizard در یک سازمان موقت `SETUP`، با عضو مجاز `ORG_OWNER` و مسیر canonical انجام و سپس fixture به‌طور کامل پاک شد؛ Help Trigger مقالهٔ `organization-setup-wizard` را در RTL و بدون overflow باز کرد. Evidence: `docs/GOAL_056_EVIDENCE.md`. GOAL-057 آغاز نمی‌شود.

## GOAL-055 — Organization Setup Wizard Completeness

GOAL-055 remediation is accepted: the legacy tenant-setup completion endpoint
delegates only to canonical Go-Live, and drift/concurrency coverage passed.
It does not start GOAL-056. Evidence: `docs/GOAL_055_EVIDENCE.md`.

## GOAL-054 — Directory Connector Operational Completeness

GOAL-054 با remediation جفت‌سازی مجدد کامل شد. Connector لغوشده فقط با
عملیات صریح owner/admin و کد یک‌بارمصرف هش‌شده می‌تواند در همان record دوباره
paired شود؛ credential و کدهای قدیمی همواره نامعتبر می‌مانند. Evidence:
`docs/GOAL_054_EVIDENCE.md`. طبق محدودهٔ مصوب، GOAL-055 آغاز نمی‌شود.

GOAL-053 کامل شد. Evidence: `docs/GOAL_053_EVIDENCE.md`.

GOAL-052 کامل شد. طبق محدودهٔ مصوب، Goal بعدی آغاز نمی‌شود.

GOAL-050 remediation پذیرش را گذراند. طبق محدودهٔ مصوب، Goal بعدی آغاز نمی‌شود.

## Master Upgrade complete

GOAL-030 through GOAL-048 are complete. The final local acceptance, migration
rehearsal and release-gate evidence is recorded in `docs/GOAL_048_EVIDENCE.md`.

Before a production release, execute the staging-only gates in
`docs/STAGING_RELEASE_CHECKLIST.md`; these require the deployment environment
and are not repository implementation work.
