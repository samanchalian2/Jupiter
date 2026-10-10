# Next Task

## Personal Service program — COMPLETE

GOAL-060 through GOAL-066 are complete. Cross-domain acceptance, migration
rehearsal, isolation/security checks, authenticated responsive browser coverage
and fixture cleanup are recorded in `docs/GOAL_066_EVIDENCE.md`.

No repository implementation Goal is approved to start automatically. Preserve
the established architecture and wait for an explicitly scoped next Goal. Do
not treat the Personal Service completion as GOAL-059 staging acceptance.

## Deferred deployment gate — GOAL-059 remains BLOCKED

An authorized, HTTP-only IP preview is operational with the isolated full
Jupiter dataset, loopback-only API and dedicated system services. It is not an
official staging acceptance or a substitute for a canonical deployment.
The authorized preview host is synchronized through application commit
`f64d218`; migrations 057–060 and the Personal Service Help catalog are live,
its Web, health and readiness endpoints return HTTP 200, and the Persian login
renders the canonical logo without horizontal overflow. Do not modify any
unrelated host service or database.
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
