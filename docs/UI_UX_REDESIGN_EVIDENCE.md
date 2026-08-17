# Jupiter UI/UX commercial redesign evidence

**Date:** 2026-08-12  
**Scope:** approved light, minimal, RTL commercial redesign and identity repair.

## Delivered

- The application shell is a light RTL workspace with the Shabnam font, an SVG Jupiter mark, accessible icon labels, collapsible desktop navigation, compact mobile drawer, skip navigation, and role-gated routes.
- Login accepts an email address or globally unique lowercase username while retaining the older email payload for a rolling front-end/back-end upgrade. Refresh/session memberships now carry the organization display name, so an organization UUID is not used as a visible label.
- Members and platform users can have a username. Username validation is lowercase and format constrained; duplicate usernames return a usable Persian validation message instead of a database error.
- Organization administration prevents browser autofill on the add-member form and uses semantic autocomplete values where credential changes are intentional.
- Ticket, dashboard, knowledge, reports, organization administration, and platform administration use the shared UI primitives and responsive styling. Destructive organization status changes use an accessible confirmation dialog with Escape, initial focus, and focus restoration.
- Migration `020_identity_username_and_custom_field_repair.sql` adds the nullable username, performs a conflict-safe local-part backfill, assigns `s.chalian` to the designated local account, and disables malformed custom fields. Ticket intake excludes them; administration shows a human-readable configuration warning without rendering their damaged label.

## Local verification

| Check | Result |
| --- | --- |
| API typecheck | passed |
| Web typecheck | passed |
| API test suite | 16 files, 30 tests passed |
| Web production build | passed |
| Migration runner | passed; migration 020 recorded |
| Database repair check | `s.chalian` set; `asset_tag` inactive |
| Custom-field repair scope | the only label with question-mark runs was inactive `asset_tag` (runs of 5 and 6) |
| Layout smoke | live login page was checked at a 390px viewport without document horizontal overflow |
| Restarted API health | `GET /api/v1/health` returned 200 |
| Live username authentication | bootstrap administrator authenticated through `identifier=admin` after API restart |

The local API was restarted after the production build and now serves the
username-login path. The login UI also sends the legacy email field for email
identifiers, preserving compatibility during a rolling frontend/backend
upgrade. The bootstrap script assigns the local part of a newly created
bootstrap email as its username when one is absent.
