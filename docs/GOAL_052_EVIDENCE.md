# GOAL-052 — Recurring Smart Action Allowance + Emergency Policy

## Delivered policy

- `AI_TICKET_REVIEW` and `AI_SMART_INTAKE` now consume the shared `AI_SMART_ACTIONS` organization pool.
- The UTC calendar-month policy defaults to 25 periodic and 3 emergency units. Platform Admin may set future defaults or organization overrides; Owner remains read-only for these values.
- Provisioning is idempotent in the existing worker and is also ensured before a new Smart Action reservation. Periodic, add-on, emergency, per-capability overage and denial remain the enforced order.
- Add-on allocations now expire after 12 months unless Platform supplies a later explicit expiry. Historical allocations are preserved and backfilled with that expiry.

## Compatibility and verification

- Migrations 050–052 apply the policy, pool fields and compatibility triggers for existing internal allocation callers.
- API typecheck passed. API test suite passed: 26 files, 89 tests.
- The Platform Commercial console exposes default policy and per-organization override controls in Persian RTL; no billing, payment or user-level quota was added.

## Deliberate limits

Renewal notifications remain dashboard/audit state rather than monthly inbox noise. Manual ticketing remains independent of AI capacity.
