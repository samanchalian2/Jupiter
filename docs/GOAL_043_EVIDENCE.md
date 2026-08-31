# GOAL-043 — Assist lifecycle and request experience

Date: 2026-08-30

- Migration 043 adds an independent Assist lifecycle and additional-access requests. Ticket status is not changed.
- Policy routes a requester action to `REQUESTED`, `PENDING_APPROVAL` or `QUEUED`; acceptance needs a valid grant and settles capacity exactly once. Assist SLA starts at acceptance.
- The Persian ticket action is «درخواست کمک از تیم Jupiter». Restricted-ticket and tenant checks remain server-side.
- Root typechecks, 24 API test files / 71 tests, 2 Web test files / 11 tests, production builds, migration rehearsal and `git diff --check` pass.
