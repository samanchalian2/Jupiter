# GOAL-050 — Commercial Subscription Lifecycle (remediated acceptance)

## Delivered

- Migrations `047` and compatibility migration `048` add the six official subscription states, lifecycle timestamps and a tenant commercial-agreement grace policy (default seven days, configurable from zero to ninety).
- `SubscriptionLifecycleService` is the Platform Admin transition boundary. It validates the allowed graph, locks the target subscription in its tenant, records the real actor and audit event, and emits deduplicated owner notifications.
- The worker expires TRIAL/ACTIVE subscriptions at their end and suspends PAST_DUE subscriptions only after grace. Re-running it is safe.
- The commercial resolver keeps a product-bound commercial capability available during a valid PAST_DUE grace and denies new Smart Actions outside that window. Manual ticketing is unchanged.
- New Jupiter Assist acceptance now invokes the same resolver for `JUPITER_ASSIST`: entitlement, organization setting, platform availability and the subscription for the Assist product must all be effective. An unrelated active AI subscription cannot authorize Assist. Accepted Assist cases remain operable after commercial expiry.
- Owner renewal requests accept only same-organization `ACTIVE`, `PAST_DUE` or `EXPIRED` subscriptions. Applying an approved PAST_DUE renewal activates the selected subscription once; cancelled, nonexistent and cross-tenant subscriptions are denied.
- Lifecycle owner delivery uses the persistent commercial mark as the dedupe key and sends an event without misusing the ticket foreign key. Only active `ORG_OWNER` memberships are recipients.
- Owner dashboard is read-only for lifecycle status and shows service state, expiry/grace and remaining days. Platform Commercial Console provides the explicit lifecycle operations.

## Verification

- `pnpm --filter @jupiter/api migrate`
- `pnpm -r typecheck`
- `pnpm --filter @jupiter/api test` — 89 tests
- `pnpm --filter @jupiter/web test` — 11 tests
- `pnpm -r build`
- `git diff --check`
- Authenticated in-app Browser acceptance: Platform Commercial Console loaded live without API errors; its lifecycle list, filter and controls rendered in Persian RTL at 375/768/1024/1440 with no document-level horizontal overflow. The current administrator is not an `ORG_OWNER`, so the owner-only dashboard was correctly not exposed to that account; owner authorization remains covered by API integration tests.

No payment gateway, invoice, checkout, accounting, discount engine or new commercial product-version entity was added.

## Remediation acceptance coverage

`apps/api/test/organization-application.integration.spec.ts` now proves server-side behavior rather than only the lifecycle constant:

- the approved TRIAL, ACTIVE, PAST_DUE, SUSPENDED, EXPIRED and CANCELLED transition graph, including invalid transition rejection and the no-reactivation rule for CANCELLED;
- PAST_DUE grace retains the linked AI and Assist capabilities; the same PAST_DUE subscription is denied after its grace ends, grace expiry is suspended by the worker, and repeated worker execution creates no duplicate lifecycle audit/owner notification;
- Smart Action reservation is allowed for ACTIVE and in-grace PAST_DUE linked subscriptions, denied for EXPIRED/SUSPENDED/CANCELLED before any reservation, while manual draft/submit ticketing, an existing ticket and its status history, and the active organization membership remain available;
- capability-specific Assist acceptance: a valid ACTIVE or in-grace PAST_DUE Assist subscription succeeds, an unrelated active AI product does not help after Assist expiry, EXPIRED/SUSPENDED/CANCELLED Assist subscriptions deny new acceptance, and an already accepted case completes its independent workflow;
- owner PAST_DUE renewal request/review/apply and idempotent apply, while cancelled and cross-tenant renewal targets remain denied;
- duplicate expiry, post-grace suspension and reactivation notifications are not emitted on repeated worker/transition execution.

No new migration was needed for this remediation. Migrations `047` and `048` remain the applied subscription-lifecycle schema boundary.
