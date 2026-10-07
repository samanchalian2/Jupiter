# GOAL-065 Evidence — Complete Personal Workspace UX & Product Help

## Outcome

GOAL-065 completes the Persian independent-user experience on the existing
GOAL-061 through GOAL-064 boundaries. `/personal` is now a focused workspace
for personal tickets, AI capacity, Jupiter-operated support, packages,
payments and receipts. Organization-only administration, Directory, teams,
SLA, organization Commercial and Assist remain absent from personal
navigation and routes.

No migration was added. The existing 71-migration schema through
`060_personal_payments.sql` remains authoritative and was exercised by the
full integration suite.

## Personal workspace and services

- `/personal` presents two plain-language capacity summaries, manual ticket
  entry, ticket tracking and Personal Support availability.
- `/personal/services` shows monthly and purchased SUPPORT/AI capacity,
  reserved and settled units, period end, active package expiry, active
  packages, orders, safe payment states and a readable non-tax receipt.
- Personal navigation contains only Dashboard, Tickets, Packages and Services,
  Product Help and Platform controls when the same user is also a Platform
  Admin. Organization-only routes redirect to the personal home.
- Manual ticket creation and editing remain available when AI, payment,
  Personal Support or capacity is unavailable.
- Ticket Detail routes a personal user's Jupiter-help action to the separate
  Personal Support API, not organization Assist. The services page displays
  case state and permits cancellation only while queued, releasing capacity.

## AI capacity boundary

`CommercialService` preserves organization behavior but detects a `PERSONAL`
workspace and delegates Ticket Review and Smart Intake reservation, settlement
and release to `PersonalCapacityService`'s AI pool. One logical idempotency key
maps to one reservation. A delivered result settles once; failure,
cancellation and repeated release do not consume an extra unit. Cross-owner
use is denied by the canonical personal-owner check.

Platform AI settings now include active personal workspaces. Platform Admin
can configure provider/model/credential, enable AI and explicitly control
Smart Intake for a personal workspace. Organization Smart Intake ownership and
commercial gating are unchanged.

## Payment return and receipt safety

The provider callback still verifies server-side and allocates exactly once.
After processing it redirects to `/personal/services` with only a safe result
and optional order ID. Provider authority, credential and raw provider error
are never placed in the Web URL. Pending/cancelled/failed states remain
recoverable and the user can inspect orders before retrying. Production return
URLs require HTTPS; local development derives from the first `WEB_ORIGIN`.

## Product Help

Four Persian published guides and contextual feature mappings were added:

- `personal-workspace` — onboarding, personal tickets and manual fallback;
- `personal-capacity` — monthly/purchased AI and SUPPORT capacity;
- `personal-payment` — safe purchase, return states and receipt;
- `personal-support` — request, case state, cancellation and scoped agent help.

The runtime publication utility was executed with the existing local Platform
Admin actor: **0 created, 5 revised, 14 unchanged**. Runtime content remains
the product source of truth; no credential or secret was stored in Help,
Evidence, logs or audit metadata.

## Automated acceptance

- API: **31 files / 135 tests passed**.
- Personal integration proves duplicate reservation, exact-once settlement,
  retry/failure release, pool accounting and cross-owner denial.
- Product Help integration covers all four new contextual features and keeps
  audience isolation, publication and search coverage.
- Web: **3 files / 13 tests passed**.
- API and Web typechecks and production builds passed. The existing Vite
  chunk-size advisory remains non-blocking.
- `git diff --check` passed.

## Authenticated browser acceptance

An isolated temporary `PERSONAL` workspace named only for GOAL-065 browser
acceptance was assigned to the existing local Platform Admin with the normal
active `REQUESTER` membership. The real `/personal` and
`/personal/services` routes were exercised through the authenticated UI.

| Width | Route | RTL | document overflow | Result |
| ---: | --- | --- | --- | --- |
| 375 | `/personal/services` | yes | none | passed |
| 768 | `/personal/services` | yes | none | passed |
| 1024 | `/personal/services` | yes | none | passed |
| 1440 | `/personal/services` | yes | none | passed |

The contextual trigger resolved to the published `personal-capacity` article
and displayed readable Persian content. Personal capacity values, service
availability, empty package/order states and manual-ticket fallback rendered
without internal IDs. After acceptance, allowance windows, audit fixture,
membership, role and organization were deleted transactionally; the remaining
temporary organization count was verified as zero. Published Help was
preserved because it is product data.

## Boundaries and handoff

No subscription billing, wallet, discount, tax/accounting, official invoice,
card storage, automatic refund, organization behavior change or new payment
provider was introduced. GOAL-066 is ready for final cross-domain hardening
and end-to-end acceptance but was not started in this execution. GOAL-059
remains a separate blocked canonical-staging gate.
