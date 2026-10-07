# GOAL-063 Evidence — Personal Recurring Allowance & Package Capacity

## Result

GOAL-063 is complete. Personal Support and personal AI now have two separate,
tenant-isolated capacity pools. The runtime provisions immutable UTC monthly
windows, supports Platform-managed future defaults and explicit personal-space
overrides, snapshots manually allocated packages, and connects Personal Support
to atomic reserve/release/settle semantics.

No gateway, checkout, callback, receipt, refund, invoice or full personal UX
was added. Payment remains GOAL-064 and was not started.

## Schema and migration

`059_personal_capacity.sql` adds:

- global `personal_allowance_policies` seeded with `SUPPORT=3` and `AI=10`;
- tenant-scoped `personal_allowance_overrides` and immutable monthly
  `personal_allowance_windows`;
- Platform-owned `personal_packages` with pool, units, Toman/IRT price,
  bounded 1–1825 day validity and lifecycle;
- tenant-scoped package allocations with immutable package/name/unit/price/
  validity snapshots and idempotency keys;
- tenant-scoped capacity reservations with `MONTHLY` or `PURCHASED` source and
  `RESERVED`, `SETTLED`, `RELEASED` states;
- a composite tenant FK from Personal Support case to its unique reservation.

`059a_personal_capacity_privileges.sql` removes tenant application-role write
authority from Platform-owned overrides and purchased allocations. RLS,
composite tenant integrity, stable indexes and source-shape checks remain
defense in depth.

An isolated fresh database applied migrations 001–059a as **70/70**. It
verified both seeded policies, all capacity tables and the revoked application
role writes, then was removed.

## Capacity behavior

- Every current month is `[00:00:00 UTC day 1, 00:00:00 UTC next month)`.
- Windows are lazy-provisioned under an organization/pool advisory lock.
- The default or override is snapshotted once. Later changes affect only future
  windows and never rewrite current/historical grants or usage.
- Reservation order is current monthly allowance, then an active unexpired
  purchased allocation ordered by nearest expiry, creation time and ID.
- `RESERVED` and `SETTLED` both occupy capacity; `RELEASED` does not.
- SUPPORT and AI never share units and never use organization Commercial or
  Assist capacity.
- Zero capacity returns `PERSONAL_CAPACITY_EXHAUSTED`; the submitted/manual
  ticket remains unchanged and no unserviceable support case is created.

Personal Support request reserves one SUPPORT unit with a logical ticket key.
Duplicate request returns the existing case/reservation. User cancellation,
Platform rejection and pre-accept failure release it. Agent acceptance locks
the case and settles the reservation exactly once in the same transaction as
the grant/assignment. Concurrent reservation and acceptance cannot exceed
capacity or double-settle.

The AI pool and generic `AI_ACTION` reservation boundary are present and
independently tested. Wiring personal AI product actions to provider execution
belongs with the complete personal experience rather than reusing the
organization Commercial AI boundary.

## Platform-configurable controls

The existing Platform commercial area now provides compact Persian controls
for:

- future monthly SUPPORT and AI defaults;
- explicit personal-workspace override or reset-to-default;
- package code, visible name/description, pool, units, price in Toman,
  validity and lifecycle;
- idempotent manual allocation with an auditable reason;
- explicit allocation revocation with an auditable reason;
- current monthly and purchased granted/reserved/settled/remaining projection.

Issued windows, allocation snapshots, usage history, reservation order,
settlement rules, RLS, tenant scope and actor identity are not configurable.

## API and authorization

Platform Admin APIs own policy, workspace inventory, overrides, catalog,
allocations/revocation and explicit-workspace summary. The personal owner can
read only the effective projection of the authenticated personal workspace.
Organization tenants, another personal owner and ordinary users are denied.

Audits retain real actor, target, pool, units and non-secret commercial facts.
No ticket content, credential, provider secret or payment data is stored in
capacity metadata.

## Automated acceptance

- API: **30 files / 130 tests passed**.
- GOAL-063 integration coverage: default 3/10 provisioning, exact UTC boundary,
  future-only policy and override/reset, package snapshot/idempotency, nearest
  expiry ordering, expiry/revocation, zero-capacity denial, manual-ticket
  preservation, release/settle, duplicate/concurrent requests, separation of
  SUPPORT/AI and cross-tenant/role denial.
- Existing GOAL-062 integration coverage still passes with capacity attached.
- Web: **3 files / 13 tests passed**.
- API/Web typechecks and production builds passed. Vite retains the existing
  non-blocking bundle-size advisory.
- Built API started successfully and mapped the new personal/platform capacity
  routes.
- `git diff --check` passed for the Goal change set.

## Authenticated browser acceptance

The authorized local Platform Admin opened the existing commercial tab and
verified the real «سهمیه و بسته‌های فضای شخصی» panel. The panel exposed both
monthly defaults, workspace override/reset, package catalog, manual allocation,
revocation and capacity projection without submitting a form.

- Desktop: RTL, `clientWidth=1265`, `scrollWidth=1265`, no document overflow.
- Mobile override: RTL, `clientWidth=360`, `scrollWidth=360`, no document
  overflow; the compact Platform section selector was visible.
- The temporary viewport was reset and local API/Web acceptance processes and
  the agent-created browser tab were closed. No credential was recorded.

## Handoff

GOAL-064 is ready but was not started. It will add the adapter-based payment
core and Zarinpal verification/fulfillment boundary using these immutable
package and allocation models. GOAL-065 remains responsible for the complete
personal user experience and Product Help.
