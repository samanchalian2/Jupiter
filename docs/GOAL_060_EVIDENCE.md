# GOAL-060 — Personal Service Architecture and Delivery Plan

## Result

GOAL-060 is complete as a documentation/architecture-only Goal. It introduces
no production code, migration, API, runtime data or deployment change.

The approved extension enables a verified person to use Jupiter independently
through a private personal workspace while retaining any organization
memberships and the ability to apply for an organization.

## Decisions recorded

- DEC-034: personal workspace reuses the `Organization` tenant/RLS boundary.
- DEC-035: Personal Support is separate from organization Jupiter Assist while
  reusing the global support-agent registry and ticket-scoped grants.
- DEC-036: support and AI have separate monthly capacity and purchased packs.
- DEC-037: payment is adapter-based, server-verified and fulfilled exactly once.

## Product defaults and configurable controls

The initial defaults are three personal support cases and ten AI Smart Actions
per UTC calendar month, without rollover. Support and AI packages are separate;
new purchased packages default to 365 days. Platform Admin will be able to
configure:

- personal service availability;
- service catalog and operational SLA;
- future monthly defaults and explicit personal-workspace overrides;
- support/AI package units, Toman price, active state and bounded validity;
- bounded support-grant duration and non-secret payment availability/mode.

Provisioned history, tenant isolation, ownership verification, authorization,
settlement/fulfillment idempotency, provider verification, audit actor identity
and secret handling are deliberately not configurable.

## Lifecycle and commercial boundaries

Personal submission reserves free monthly support capacity before purchased
capacity. Agent acceptance settles one unit; cancel/reject/pre-accept failure
releases it. AI retains reserve/release/settle semantics. A user with no
capacity keeps manual draft access and receives a purchase path.

Zarinpal is the first payment adapter. Orders snapshot package, units, Toman
amount and validity, use `IRT`, and require server verification before one
idempotent allocation. Jupiter provides a payment receipt rather than an
official invoice. Refunds occur outside the gateway and are recorded manually.

## Delivery sequence

1. GOAL-061 — personal workspace identity, provisioning and routing.
2. GOAL-062 — personal service catalog, support cases and agent access.
3. GOAL-063 — monthly allowances, separate packs and Platform controls.
4. GOAL-064 — payment core and Zarinpal adapter.
5. GOAL-065 — personal UX, Platform UI and Product Help.
6. GOAL-066 — cross-domain hardening and full acceptance.

Each Goal must preserve organization behavior and stop before beginning the
next Goal. GOAL-059 remains a blocked deployment gate; this product program
does not claim staging acceptance.

## Validation

- Documentation changes only; no source, migration, API or runtime data changed.
- Architecture, domain, business, security and use-case documents agree on the
  tenant boundary, configurable controls and immutable security invariants.
- `git diff --check` passes before commit.
