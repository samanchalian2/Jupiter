# GOAL-064 Evidence — Personal Payment Core & Zarinpal Adapter

## Result

GOAL-064 is complete. Jupiter now has a provider-neutral personal-payment
boundary with Zarinpal as the first live adapter, a deterministic local adapter
that performs no real transaction, immutable tenant order snapshots,
server-side verification and exact-once package fulfillment.

The Platform commercial console can configure only non-secret payment
availability and mode, inspect safe order state and record an externally
completed refund. Merchant credentials remain environment-only. Full purchase
UX and Product Help remain GOAL-065 and were not started.

## Provider contract

The adapter exposes create, verify and payment-URL operations in Jupiter-owned
types. Provider response shapes never enter the payment domain or Web client.
The live implementation follows Zarinpal's first-party v4 examples:

- request: `POST https://api.zarinpal.com/pg/v4/payment/request.json`;
- redirect: `https://www.zarinpal.com/pg/StartPay/{authority}`;
- verify: `POST https://api.zarinpal.com/pg/v4/payment/verify.json`.

Jupiter sends the server-snapshotted amount with currency `IRT`. A callback or
`Status=OK` only starts verification; it never marks an order paid. Code 101 is
not accepted as proof for a previously unpaid Jupiter order. The local adapter
derives deterministic references from the order and is rejected in production.
It requires no credential and performs no external call.

## Schema and isolation

Migration `060_personal_payments.sql` adds:

- one global `personal_payment_settings` row for non-secret Zarinpal
  availability/mode;
- tenant-scoped `personal_payment_orders` with owner/workspace, package ID,
  package code/name, SUPPORT/AI pool, units, Toman amount, `IRT`, validity,
  provider/mode and lifecycle snapshots;
- append-only safe create/verify attempt events;
- a unique fulfillment linking one order to one PAYMENT allocation;
- append-only manual external-refund records with amount, reason, external
  reference and real Platform actor.

Payment orders, attempts, fulfillments and refunds have RLS. Composite tenant
FKs prevent cross-workspace attempt, fulfillment or refund references. The
tenant application role has read-only access; all transitions run through
authorized services. Card data, merchant ID, credential, signature, raw
provider payload, ticket content and prompt data are absent from the schema.

An isolated fresh database applied migrations 001–060 as **71/71**. It verified
the safe default `DISABLED / LOCAL_TEST` payment setting and active RLS on
orders, then the temporary database was removed.

## Lifecycle and fulfillment

- Only the authenticated active personal-workspace owner with `REQUESTER` may
  create/read/cancel an order or read its receipt.
- Package status, units, price and validity are read from the active server
  catalog. The client supplies only package ID and idempotency key.
- Duplicate create retries return the same order. Failed provider creation can
  retry that order; paid, cancelled and expired terminal states cannot restart.
- Provider authority is unique. Verification locks the order, checks final
  outcome and amount and creates one allocation with
  `allocation_source=PAYMENT` and `PAYMENT_ORDER:{orderId}` idempotency.
- Callback replay returns the existing paid projection without a second
  provider verification, fulfillment or allocation.
- Provider transport failure returns the order to pending for safe retry;
  definitive rejection, already-verified foreign/replay outcome and amount
  mismatch never fulfill.
- The owner receipt is explicitly a payment receipt, not a tax invoice.
- Jupiter does not invoke gateway refund. Platform may only record an external
  refund after it occurred, and cumulative recorded amount cannot exceed the
  snapshotted payment.

## Platform-configurable controls

The compact Persian Platform panel provides:

- enable/disable payment;
- `LOCAL_TEST` or `LIVE` mode;
- an effective readiness indicator without revealing merchant identity;
- safe recent-order projection;
- external refund recording with real reference and reason.

The admin cannot configure callback trust, verification rules, provider URLs,
tenant scope, idempotency, fulfillment, currency or credentials. Live mode is
not ready without `ZARINPAL_MERCHANT_ID`; production callback configuration is
HTTPS-only. `PERSONAL_PAYMENT_CALLBACK_URL` is optional and otherwise derives
from the first `WEB_ORIGIN`.

## Automated acceptance

- API: **31 files / 134 tests passed**.
- GOAL-064 integration coverage includes owner-only creation, server-derived
  immutable snapshots, create retry, cancel, expiry, failed verification,
  amount mismatch, callback replay, exact-once fulfillment/allocation, receipt
  isolation, tenant RLS, refund ceiling/actor and audit secret absence.
- Web: **3 files / 13 tests passed**.
- API/Web typechecks and production builds passed; the existing Vite bundle
  advisory remains non-blocking.
- The built API started with the Personal Payment module/routes mapped and its
  health endpoint returned HTTP 200.
- `git diff --check` passed.

## Handoff

GOAL-065 is ready but was not started. It owns the complete Persian personal
workspace experience: capacity/package discovery, purchase initiation/return,
receipt presentation, personal AI/support affordances and Product Help.
GOAL-066 remains the final cross-domain hardening and E2E acceptance Goal.
