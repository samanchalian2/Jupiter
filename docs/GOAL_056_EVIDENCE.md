# GOAL-056 — Help Content Completeness: Evidence

## Scope and inventory

The existing Product Help engine, immutable revision history and runtime
publication model are retained. There is no schema migration in this Goal.
Initial runtime inventory contained seven published articles:
`getting-started`, `ai-ticket-review`, `commercial-allowances`,
`jupiter-assist`, `organization-directory`, `organization-setup-wizard` and
`platform-commercial-admin`.

The final catalog target is fifteen published articles: those seven revised in
runtime plus eight domain guides. The runtime publication utility was run with
an active local Platform Admin actor; it created no credentials or secrets in
repository, audit metadata or this evidence. It revised the seven existing
articles and then converted the eight bootstrap-seeded additions to runtime
revisions. A second run reports no content change.

## Coverage matrix

| Operational domain | Route/context | Audience | Article | Status |
| --- | --- | --- | --- | --- |
| Account and Help Center | `/help` | All | `getting-started` | Revised |
| Ticket composer and AI | `/tickets/new` | Product roles | `ai-ticket-review` | Revised |
| Ticket detail and attachments | `/tickets` | Product roles | `ticket-lifecycle` | New |
| Users and CSV import | `/admin/members` | Org admin/owner | `organization-members-csv` | New |
| Catalog, teams and configuration | `/admin/catalog` | Org admin/owner | `organization-ticket-configuration` | New |
| SLA and business calendar | `/admin/automation` | Org admin/owner | `sla-business-calendar` | New |
| Notifications | ticket workspace | Authorized roles | `notifications` | New |
| Directory Connector | `/admin/directory` | Org admin/owner | `organization-directory` | Revised |
| Setup Wizard | `/admin/setup-wizard` | Owner | `organization-setup-wizard` | Revised |
| Owner commercial | `/admin/commercial` | Owner | `commercial-allowances` | Revised |
| Jupiter Assist | ticket workspace | Product roles | `jupiter-assist` | Revised |
| Platform applications | `/platform/applications` | Platform admin | `platform-organization-applications` | New |
| Platform commercial | `/platform/commercial` | Platform admin | `platform-commercial-admin` | Revised |
| Help authoring | `/platform/help` | Platform admin | `platform-help-authoring` | New |
| Appearance | `/platform/appearance` | Authorized admins | `platform-appearance` | New |

## Publication, versioning and stale-content review

All seven initial articles were revised, not overwritten. The eight additions
were published as runtime revisions after bootstrap creation, so repository
seeds remain bootstrap-only and runtime remains authoritative. No published
article was found to be unsafe or contradictory enough to require unpublish.
Revision, publish, restore and published-only export behavior remains covered
by the API integration suite.

## Contextual mapping and search

`HELP_CONTEXT_FEATURES` and `HELP_RELATED_ROUTES` form the narrow registry
used by repository parsing and Platform authoring validation. Contextual
triggers cover ticket composition/detail, members/CSV, catalog/teams,
SLA, directory, AI, Assist, owner commercial and the existing Platform
commercial controls. The Help Center now exposes compact category navigation.

Search matches title, summary, category and tags without adding RAG or a
search engine. Exact title and tag matches rank before broader text matches.
Tests cover first-result relevance for دایرکتوری، جفت‌سازی، تیکت، SLA، هوش
مصنوعی، Assist، اشتراک، سهمیه and راه‌اندازی سازمان.

## Audience and security review

Help remains global Platform-owned content. The server derives audiences from
the active user role/platform status; unpublished, draft and unauthorized
articles remain non-disclosing. Content review contains no credential,
secret, prompt, ticket body, transcript or tenant data. The publication utility
requires an active Platform Admin and records normal authoring audits only.

## Quality gates

- Migration runner through 055: rerun locally; no pending migration was
  applied.
- API tests: rerun, 26 files / 100 tests passed.
- Web tests: 2 files / 11 tests passed.
- API typecheck and API production build: rerun and passed.
- Web typecheck and Vite production build: rerun and passed.
- `git diff --check`: rerun and passed.

Product Help coverage includes seed idempotency, audience isolation, lifecycle,
registry validation, runtime revision behavior, Persian search and contextual
lookups.

## Browser acceptance

Authenticated local acceptance was performed using the local Platform Admin
session; no credential, secret or private content is retained in this evidence.
The Help Center, a selected article, the Ticket Composer trigger, the Ticket
Detail trigger, Organization Members/CSV trigger and Platform Help authoring
were exercised. No authoring mutation, publication or unpublication was used
for the browser check.

| Viewport requested | Effective content width | RTL | Document overflow | Verified surface |
| --- | ---: | --- | --- | --- |
| 375 × 900 | 360 | Yes | None (`scrollWidth = clientWidth`) | Help Center categories/search/article; Ticket Detail Help dialog; Platform authoring/revisions |
| 768 × 900 | 753 | Yes | None (`scrollWidth = clientWidth`) | Help Center; Members/CSV Help dialog; Platform authoring/revisions |
| 1024 × 900 | 1009 | Yes | None (`scrollWidth = clientWidth`) | Ticket Composer and Ticket Detail Help dialogs; Platform authoring/revisions |
| 1440 × 900 | 1425 | Yes | None (`scrollWidth = clientWidth`) | Help Center categories, published article and Platform authoring/revisions |

Persian search for «دایرکتوری» returned «اتصال دایرکتوری سازمان و همگام‌سازی
کاربران» as the relevant first result, and opening it displayed the published
article. The existing Ticket Detail view lacked its promised Help Trigger;
acceptance remediation added the compact «راهنمای چرخهٔ تیکت» trigger using the
published `TICKET_LIFECYCLE` article. Its popover initially exposed a
document-level overflow at 1024px when anchored at the inline start. The
popover now anchors at inline end with a bounded width, and its dialog was
retested at all four viewports without overflow.

Platform Help authoring showed the 15 published runtime articles, editor,
revision history and publish/restore controls. The controls were inspected but
not invoked, preserving the published local Help content. GOAL-057 was not
started.

Owner Commercial was subsequently exercised through a temporary explicit
`ORG_OWNER` assignment for the local Platform Admin, then immediately revoked;
the Owner Help trigger opened successfully without overflow and the UI confirmed
that the owner was removed. The requester account's supplied password was
securely reset to the same supplied value through the local member-management
form, after which the requester session opened Ticket Detail and verified the
Jupiter Assist Help trigger without overflow. No commercial request, Assist
request, ticket or other product data was created during either check.

**Browser acceptance NOT COMPLETED.** The remaining Setup Wizard trigger needs
an authenticated member of an organization currently in `setup` lifecycle;
the existing authenticated organization is active, and no temporary setup
organization or membership was created solely to weaken this acceptance check.
GOAL-056 stays in progress until that route is exercised.

## Limitations

Help search is deliberately metadata-only; there is no RAG, vector index,
external search service, tenant knowledge retrieval or automatic ticket
creation. Payment, credentials, directory writeback, SSO proxy and future
product promises are not described as available capabilities.
