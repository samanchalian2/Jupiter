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

The owner authorized local sign-in. An authenticated browser walkthrough then
confirmed the description-first form, initial focus, the responsive AI/voice
toolbar, expandable typed-tag area and queue tag filter at 375, 768 and 1440
px. The document width exactly matched the viewport at all three widths.

A real saved-provider run for «سلام پرینترم خراب است» returned the concise
AI-provenance title «خرابی و اختلال در عملکرد پرینتر» rather than copying the
description. The first attempt visibly fell back because the directly launched
API and Web processes did not include the separate queue Worker; after starting
that Worker with `JUPITER_WORKER_ENABLED=true`, retrying completed successfully.
The root `pnpm dev` command already launches API, Web and Worker together.

The owner subsequently authorized installation of the idempotent Organization
Admin starter template in Jupiter Demo Organization. It created nine categories
and 24 subcategories. A real provider run for a network printer paper-error
request then applied the concise title «خطای کاغذ در چاپگر شبکه مالی», category
«چاپ و اسناد», subcategory «خطاهای چاپ», HIGH priority, and five typed tag
candidates: domain, service/asset, issue type, impact scope and context. No
ticket was submitted during this live check; final submission is deliberately
still explicit and is what records unseen values as pending candidates.

The provider returned per-tag confidence under compatibility spellings such as
`domainTag`, `serviceAssetTag` and `issueTypeTag`. Validation now accepts these
as well as the contract's aggregate, dotted and colon forms, while preserving
the same 0.75 threshold for every proposed tag.

**Status:** DONE — implementation, live organization setup and authenticated
browser acceptance pass.
