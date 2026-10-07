# GOAL-066 Evidence — Personal Service Cross-domain Hardening

Date: 2026-10-07
Status: complete / accepted locally

## Outcome

The GOAL-060 through GOAL-065 Personal Service program was exercised as one
supported flow without adding a product or payment capability. Verified public
accounts provision exactly one PERSONAL workspace, the canonical entry remains
`/personal`, manual ticketing remains available, and Personal Support, AI
capacity, package/payment state and contextual Help remain tenant-isolated.

Two acceptance defects were corrected:

- Personal Support now renders the canonical `WAITING_FOR_USER` and `COMPLETED`
  lifecycle states in Persian instead of obsolete labels.
- Login, registration and verification copy now makes the personal workspace
  the default outcome and presents organization registration as an optional,
  separate continuation. A verified stale session is renewed before entering
  `/personal`.

## Cross-domain and isolation coverage

| Requirement | Evidence |
| --- | --- |
| verified account and one personal workspace | `personal-workspace.integration.spec.ts`: atomic verification provisioning, idempotency and coexistence with organization memberships |
| canonical routing and organization separation | `/personal` authenticated browser acceptance; internal personal slug is excluded from `/o/{slug}` routing; personal tenants deny organization administration and owner assignment |
| ticket and manual fallback | Personal workspace renders ticket creation/list entry points and explicit manual fallback; existing ticket authorization remains tenant-bound |
| Personal Support and agent access | request requires a submitted personal ticket; concurrent accept consumes once; grant is exact-ticket, expiring and revoked on completion; rejection/cancellation releases capacity |
| SUPPORT and AI capacity | UTC monthly windows, nearest-expiry package selection, concurrent reservation, cancellation/release and exact-once settlement are covered by `personal-capacity.integration.spec.ts` |
| Ticket Review and Smart Intake | both consume only the personal AI pool; retries share idempotency and provider/validation failure releases the reservation |
| package purchase/callback/receipt | server-owned package snapshots, provider verification, retry/cancel/expiry and exact-once fulfillment are covered by `personal-payment.integration.spec.ts` |
| safe callback return | `personal-payment-controller.spec.ts` proves successful and failed redirects never expose provider authority or raw provider failure |
| role isolation | active personal owner, organization member, Platform Admin and Jupiter agent access are independently constrained by membership, platform role and ticket-scoped grants |
| RLS | the clean rehearsal confirmed RLS on personal allowance, reservation/allocation, support and payment tenant tables; integration suites exercise cross-tenant denial |

Platform Admin configuration was verified in the authenticated Persian UI:
Personal Support catalog/SLA/grant duration, future allowance defaults,
per-personal-workspace overrides, package catalog/manual allocation, safe payment
availability/mode and personal AI provider policy are configurable. Authorization,
RLS, exact-once settlement, provider verification and secret storage deliberately
remain non-configurable security invariants.

## Security and content checks

- A live-data scan found zero unsafe personal audit metadata keys, zero unsafe
  payment telemetry values and zero known real-secret occurrences in published
  Help.
- Metering/payment records contain safe identifiers and lifecycle metadata only;
  no prompt, ticket body, transcript, credential or provider authority is stored
  for commercial accounting.
- Payment failure returns are generic and contain no order id; successful returns
  contain only safe state plus Jupiter order id.
- Product Help was republished through the supported runtime publisher: 0 created,
  1 revised and 18 unchanged. Runtime content remains after acceptance cleanup.

## Migration and automated gates

- Isolated forward rehearsal: all 71 migrations through
  `060_personal_payments.sql` applied successfully. The cluster-global
  `CREATE ROLE jupiter_app` statement in migration 001 was omitted only because
  that role already existed; every database-owned statement was rehearsed.
- Personal payment, capacity and support tables existed after rehearsal and the
  tenant-scoped tables reported RLS enabled. The temporary rehearsal database was
  disconnected and dropped.
- API: 32 test files / 137 tests passed.
- Web: 4 test files / 14 tests passed.
- API and Web typechecks passed.
- API and Web production builds passed; only the pre-existing Vite chunk-size
  advisory remained.
- API `/api/v1/health` returned `ok` and `/api/v1/health/ready` returned
  `ready`.
- `git diff --check` passed.

## Authenticated browser acceptance

An auditable temporary PERSONAL organization named `فضای موقت پذیرش ۰۶۶` with
one active REQUESTER owner membership was used. No test credential was created or
recorded. The supported login/session flow entered its real `/personal` route.

- `/personal` and `/personal/services` passed at 375, 768, 1024 and 1440 px.
- All checked widths rendered Persian RTL with no document-level horizontal
  overflow.
- Personal navigation did not expose organization administration, Directory,
  team or SLA controls.
- The contextual Help trigger opened the published `personal-capacity` article;
  its Persian content was readable, RTL, non-overflowing and exposed no
  unauthorized Platform, credential or provider content.
- The public registration screen clearly states that email verification activates
  a personal workspace and organization registration is optional.
- Platform Commercial showed Personal Support, personal allowances/overrides,
  packages and payment controls. Platform AI listed the PERSONAL workspace,
  exposed Smart Intake after selection and kept stored credentials masked.

After acceptance, the temporary membership, allowance windows, usage rows,
fixture audit rows and organization were removed transactionally. Verification
returned zero organization, membership, allowance and ledger rows for the fixture.
No production-like organization data was altered.

## Boundary

No new provider, subscription billing, wallet, tax/discount/accounting, official
invoice, card storage or automatic refund was introduced. GOAL-059 remains a
separate blocked canonical staging gate and was neither changed nor claimed.
