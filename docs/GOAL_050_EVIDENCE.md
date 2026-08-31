# GOAL-050 — Commercial Subscription Lifecycle

## Delivered

- Migrations `047` and compatibility migration `048` add the six official subscription states, lifecycle timestamps and a tenant commercial-agreement grace policy (default seven days, configurable from zero to ninety).
- `SubscriptionLifecycleService` is the Platform Admin transition boundary. It validates the allowed graph, locks the target subscription in its tenant, records the real actor and audit event, and emits deduplicated owner notifications.
- The worker expires TRIAL/ACTIVE subscriptions at their end and suspends PAST_DUE subscriptions only after grace. Re-running it is safe.
- The commercial resolver keeps commercial capabilities available during a valid PAST_DUE grace and denies new Smart Actions outside that window. Manual ticketing is unchanged. New Jupiter Assist acceptance is denied for inactive commercial subscriptions; accepted cases remain operable.
- Owner dashboard is read-only for lifecycle status and shows service state, expiry/grace and remaining days. Platform Commercial Console provides the explicit lifecycle operations.

## Verification

- `pnpm --filter @jupiter/api migrate`
- `pnpm -r typecheck`
- `pnpm --filter @jupiter/api test`
- `pnpm -r build`
- `git diff --check`
- Authenticated in-app Browser acceptance: Platform Commercial Console loaded live without API errors; its lifecycle list, filter and controls rendered in Persian RTL at 375/768/1024/1440 with no document-level horizontal overflow. The current administrator is not an `ORG_OWNER`, so the owner-only dashboard was correctly not exposed to that account; owner authorization remains covered by API integration tests.

No payment gateway, invoice, checkout, accounting, discount engine or new commercial product-version entity was added.
