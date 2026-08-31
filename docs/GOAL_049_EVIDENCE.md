# GOAL-049 — Owner Commercial Controls & Overage

## Remediation acceptance

- Added integration test `enforces owner-only, capped overage reservations and idempotent commercial requests`: disabled-overage denial, enabled admission, cap denial, advisory-lock concurrency, ORG_ADMIN denial and request idempotency.
- Renewal create/apply now verify the tenant-bound renewable subscription; no affected subscription means no APPLIED request.
- Uppercase audit events cover create, approve, reject and apply without secrets.
- `commercial_notification_marks` deduplicates commercial event windows. The owner dashboard renders subscription dates/status and per-source remaining capacity, Overage and Assist.
- Local migration 046 applied; `pnpm test` passed (83 API, 11 Web), `pnpm typecheck` and `git diff --check` passed.

- `046_owner_commercial_controls.sql` سیاست tenant-scoped overage، درخواست‌های تجاری، dedupe اعلان و منبع رزرو `OVERAGE` را اضافه می‌کند.
- رزرو Smart Action با قفل advisory از دوره‌ای، بسته، اضطراری و سپس overage استفاده می‌کند؛ مصرف تنها در تسویهٔ تحویل موفق ثبت می‌شود.
- مالک سازمان سیاست خود و درخواست تجاری را مدیریت می‌کند؛ Platform Admin فقط با سازمان هدف صریح درخواست را تأیید/رد/اعمال می‌کند.
- inbox اعلان‌ها رویدادهای تجاری بدون ticket را نیز می‌پذیرد. سازمان فاقد مالک همچنان عملیاتی است و فقط recipient تجاری ندارد.
- UI فارسی RTL در داشبورد مالک و کنسول Platform پیاده شده است. پرداخت، فاکتور، checkout و حسابداری خارج از دامنه‌اند.
