# Product Help API — GOAL-046

Product Help is global Jupiter content. It is not the tenant Knowledge Base and
no request accepts an organization identifier for this domain.

## Read endpoints

`GET /api/v1/help/articles`

Optional query filters: `q`, `category`, `relatedRoute`, `relatedFeature`.
An anonymous request receives only `ALL` articles. A bearer token expands the
server-derived audience with its active membership roles and, when applicable,
`PLATFORM_ADMIN`. The result contains article metadata but not body content.

`GET /api/v1/help/articles/:slug`

Returns the body of the current published revision only when its audience is
allowed. A missing, draft, unpublished or unauthorized slug responds with the
same `404` and does not reveal publication state.

## Seed lifecycle

Run `pnpm --filter @jupiter/api seed:help` after migrations. Markdown files in
`docs/help/` have explicit Persian metadata and create a version-one published
revision only when the slug is absent. Re-running it never edits a runtime
article; future authoring and publication actions own database revisions.

## Platform Admin lifecycle and export

All endpoints below require a Platform Admin bearer token. They operate on
runtime revisions only and never accept an organization identifier.

- `GET /api/v1/help/admin/articles?q=` lists the current published revision or
  latest draft for administration.
- `POST /api/v1/help/admin/articles` creates an unpublished article/version 1
  draft. `POST /articles/:articleId/drafts` appends an edited draft.
- `GET /articles/:articleId`, `GET /articles/:articleId/revisions/:revisionId/preview`,
  `POST /articles/:articleId/publish`, `unpublish`, and `restore` manage the
  reviewable revision lifecycle. Restore creates a new draft from history.
- `GET /api/v1/help/admin/export?format=JSON|MARKDOWN&slug=&category=` exports
  one article, one category or all current published runtime Help. Slug and
  category cannot be combined.

The Persian product UI supplies Help discovery and `HelpTrigger` mappings for
AI, Directory and Jupiter Assist. RAG or an AI Help chatbot remains out of
scope.
