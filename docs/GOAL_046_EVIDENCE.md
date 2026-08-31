# GOAL-046 — Help article domain and repository seed pipeline

Date: 2026-08-31

- Migrations `045` and `045a` add global `product_help_articles` and
  `product_help_article_revisions`. A revision owns Persian title, summary,
  Markdown content, category, exact audience, tags, product-area and
  feature/route metadata; an article points only to its current published
  revision. The schema contains no `organization_id` and does not alter the
  tenant Knowledge Base.
- `docs/help/` contains six Persian initial-publication articles. The
  `seed:help` command created six rows on its first rehearsal and changed zero
  on the second, proving seed idempotency and preventing repository input from
  overwriting runtime revisions. Seed publication has a minimal audit record.
- `GET /api/v1/help/articles` and `GET /api/v1/help/articles/:slug` derive
  audience from active memberships and platform authority on the server. Both
  article and revision must be published; an unauthorized, draft or
  unpublished slug responds as not found.
- Persian Help impact: initial structured Help content now covers starting
  work, AI ticket review, Jupiter Assist, directory connection, commercial
  allowances and platform commercial/appearance management. Authoring,
  discovery UI, exports and contextual triggers remain GOAL-047 scope.
- Validation: migration rehearsal passed; seed rehearsal was `6 created / 0
  unchanged`, then `0 created / 6 unchanged`; 26 API test files / 81 tests,
  API typecheck and API build pass. The integration tests prove anonymous,
  owner and Platform Admin audience separation plus draft/unpublished
  non-disclosure.
