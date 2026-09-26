# Next Task

## GOAL-059 — Staging Release Readiness & Deployment Gate Acceptance (BLOCKED)

An authorized, HTTP-only IP preview is operational with the isolated full
Jupiter dataset, loopback-only API and dedicated system services. It is not an
official staging acceptance or a substitute for a canonical deployment.
Continue only when the authorized staging ingress/DNS/TLS, immutable image
registry, secret injection, managed backup/restore and monitoring access,
rollback ownership, and Windows Connector host are available. Use
`docs/GOAL_059_EVIDENCE.md`; do not start GOAL-060.

The 2026-09-16 authorized server audit found a reusable host, but canonical
`jupiter.pnsoffice.ir` does not yet resolve there. Restore adequate server disk
capacity and publish the protected-host IPv4 `A` record before continuing;
HTTPS/TLS and deployment have not been attempted. The release candidate is
`71f16a345bd8aa1724ecf943c2139a813fb8f598` and matches `origin/main`.

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
`#014348` Teal palette remediation. Evidence: `docs/GOAL_057_EVIDENCE.md`.

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
