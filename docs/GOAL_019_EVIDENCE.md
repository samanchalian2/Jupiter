# GOAL-019 — Smart composer, vocabulary, search and reporting

## Delivered scope

- The requester composer exposes a typed-tag field in «جزئیات بیشتر». It
  accepts at most five values, applies accepted `ticket-intake.v2` tag
  suggestions, marks the field as AI-completed, and still permits manual
  selection from the approved tenant vocabulary.
- Final draft creation carries selected tags and atomically links approved
  values. Newly suggested values remain `PENDING`; they are never silently
  added to the vocabulary used by other requests.
- Organization Administration has an «عنوان‌ها و هشتگ‌ها» review tab for
  pending titles and tags. A reviewer can activate or disable each proposal.
- Ticket queue/list searching now includes title, description and tag names;
  the queue filter accepts one approved tag ID. Reports expose the top typed
  tags in the chosen time window. Global ticket search includes tag names.

## Verification

On 2026-08-22 the following completed successfully:

- API typecheck and Web typecheck.
- API suite: 23 files / 51 tests. The added service integration case creates a
  draft with an approved typed tag and verifies both tag filtering and
  tag-name search under organization isolation.
- Web suite: 2 files / 9 tests.
- API production build and Web production build.
- `GET /api/v1/health` from the locally launched API returned `status: ok`.
- The 5173 development server and its `/api/v1` proxy were restarted after
  discovering they had stopped. Both a proxied health request and a proxied
  local-login request returned successful HTTP status.

The owner authorized local sign-in. The in-app Browser tool then blocked
further interaction with its current localhost tab under its URL policy, so
the final interactive visual walkthrough is intentionally not claimed here.
The running web-to-API path itself was independently verified through the
local proxy.
