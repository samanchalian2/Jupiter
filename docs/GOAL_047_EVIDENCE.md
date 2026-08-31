# GOAL-047 — Help authoring, discovery, export and contextual mapping

Date: 2026-08-31

- `ProductHelpService` now enforces Platform Admin-only authoring, draft,
  preview, publish, unpublish, restore and export. Editing and restoring copy
  data into a new runtime `DRAFT`; publish advances the current published
  revision, and prior revisions remain history.
- Published-only exports are available as Markdown or JSON and can select one
  article, one category or all runtime Help. They do not form a new source of
  truth and every export has a minimal audit event.
- The Persian `راهنمای محصول` workspace searches only audience-permitted
  published content and reads Markdown as text. The existing compact
  `HelpTrigger` maps the delivered AI ticket review, directory connection and
  Jupiter Assist policy contexts to Help without adding a navigation pattern.
- Product Help remains global and distinct from tenant knowledge. Preview and
  authoring never grant a tenant role; normal Help reads preserve the Goal-046
  audience/published non-disclosure query.
- Validation: integration tests exercise unauthorized authoring denial,
  draft/publish isolation, restore to a new revision and single/category/all
  exports. Root typechecks, 26 API test files / 82 tests, 2 Web test files / 11
  tests, production builds and `git diff --check` pass. Fresh local login UI
  was checked at 375/768/1024/1440px with no document overflow. Authenticated
  Help/Platform visual acceptance is retained for GOAL-048 final acceptance.
