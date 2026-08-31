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

## Policy semantics

- A Platform default is read only when a new UTC-period allocation is provisioned. An organization override takes precedence; deleting both override fields returns the organization to the current Platform default. Existing allowance rows are never rewritten.
- The worker scan and the reservation-path lazy check both call the same idempotent provisioner under an organization/pool advisory lock and a policy-window unique index. Historical windows remain queryable and are not reused in a new month.
- Reservation counts `RESERVED` and `SETTLED` actions. Add-on capacity is queried only where `expires_at > now()`; an expired allocation therefore cannot be selected.
- The API integration suite covers the existing tenant boundary, manual ticket fallback, idempotent allocation/reservation and concurrent capacity reservation paths.

## Deliberate limits

Renewal notifications remain dashboard/audit state rather than monthly inbox noise. Manual ticketing remains independent of AI capacity.

## Final acceptance — 2026-09-01

- Migrations `050`–`052` were rehearsed against the local database. Migration 050 introduces the recurring-policy/override and shared-pool model; 051–052 provide compatibility and trigger correction for the existing allocation paths.
- The current Platform defaults are 25 monthly `PERIODIC` units and 3 monthly `EMERGENCY` units. The integration coverage proves override precedence, reset to Platform defaults, immutable historical rows, no rollover, one allocation per UTC window and concurrent lazy provisioning safety.
- Reservation selection counts `RESERVED` and `SETTLED`, uses `PERIODIC → ADDON → EMERGENCY → OVERAGE → deny`, and filters add-ons with `expires_at > now()`. The targeted integration suite retains direct coverage of shared-pool behavior, expiry, tenant isolation, ownerless organizations and manual-ticket availability.
- The Owner dashboard was accepted at 375, 768, 1024 and 1440px in Persian RTL with no document-level horizontal overflow. It showed the UTC period, 25/3 periodic/emergency capacities, pooled add-on usage, a clearly marked expired add-on, Overage state and the consumption order. The Owner contextual HelpTrigger opened the published Product Help article.
- The Platform Commercial Console was accepted at the same four widths in Persian RTL with no document-level horizontal overflow. The compact policy/override controls show the user-facing name «عملیات هوشمند» rather than the shared-pool implementation code.
- Product Help article `commercial-allowances` was published locally as runtime revision v2. It covers the shared 25-unit configurable monthly pool, UTC/no-rollover behavior, 12-month default add-on expiry, configurable 3-unit emergency allowance, consumption order, Owner-gated overage and manual-ticket continuity.
- A temporary `ORG_OWNER` role for `admin@jupiter.local` in `jupiter-demo`, plus explicitly labelled acceptance fixture rows, was created only to test the Owner experience. It was then revoked and removed. The audit contains both `GOAL_052_ACCEPTANCE_FIXTURE_CREATED` and `GOAL_052_ACCEPTANCE_FIXTURE_RESTORED`; post-restoration verification found zero temporary Owner roles, packages and shared-pool allowances.
- Final local gates: API migration rehearsal passed; API tests **26 files / 90 tests**; Web tests **2 files / 11 tests**; API and Web typechecks passed; API and Web production builds passed; `git diff --check` passed.
