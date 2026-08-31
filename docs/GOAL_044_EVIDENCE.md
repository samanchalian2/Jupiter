# GOAL-044 — Organization commercial dashboard and owner controls

Date: 2026-08-30

- `GET /platform/commercial/owner-dashboard` returns only the current tenant's active allowance and add-on summaries, aggregate AI activity and Assist capacity/policy summary.
- The endpoint requires the explicit `ORG_OWNER` membership role. `ORG_ADMIN` does not receive the dashboard, and no legacy administrator is promoted.
- Organization Administration presents an owner-only Persian «سهمیه و پشتیبانی» route. It is read-only: Platform Admin retains contract, pricing, package, allocation and provider authority.
- The screen uses existing responsive cards/tables and states that capacity is consumed at Assist acceptance, not request creation.
- Root typechecks, 72 API tests, 11 Web tests, production builds, migration rehearsal and `git diff --check` pass. An authenticated non-owner browser check at 375/768/1024/1440 confirmed no document overflow and conservative redirect to the existing administration route; the server-side integration test separately proves the explicit owner-only data boundary.
