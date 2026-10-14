# GOAL-068 — Platform Administration UX Redesign Evidence

## Scope and design source

The redesign uses the interaction, accessibility, dashboard-density, form and
responsive-layout guidance from `nextlevelbuilder/ui-ux-pro-max-skill`. Its
palette suggestions were explicitly excluded. Jupiter's existing
Lavender/Beige semantic tokens, logo, typography and dark/light behavior remain
unchanged.

No API, migration, database entity, authorization rule, organization lifecycle
or commercial workflow changed.

## Delivered behavior

- `/platform` defaults to an operational overview with action-oriented counts
  and five recent Audit events.
- Platform navigation is grouped and URL-backed through `section`; Commercial
  subsection state is URL-backed through `area`.
- Desktop uses a restrained in-page navigation rail. At 1100px and below it is
  replaced by one labelled grouped section selector.
- Organization, application, platform-user, AI workspace and Audit lists have
  URL-backed Persian search/status filters and 10/25/50 pagination.
- Filtered no-results and empty datasets have distinct explanations.
- Organization lifecycle, owner assignment and safe archival actions are
  consolidated in a selected-organization detail panel.
- Organization/user creation and Commercial mutation forms remain closed until
  requested explicitly.
- Commercial content is divided into products/contracts,
  subscriptions/requests, capacity/Smart Actions, personal services and
  Jupiter Assist.
- Main Platform resources use independent settled loading, so one failed source
  does not erase successfully loaded sections.

## Automated verification

- Web unit tests: 7 files and 22 tests passed.
- API unit/integration tests: 33 files and 146 tests passed.
- API and Web lint/typecheck passed through the complete release gate.
- API and Web production builds passed. Vite reports only its existing
  non-blocking large-chunk advisory.
- `git diff --check` passed.

## Browser acceptance

Authenticated local acceptance used the existing Platform Admin and performed
no state-changing product operation.

| Width | Navigation | Result | Document overflow |
| --- | --- | --- | --- |
| 375 | grouped selector | pass | none |
| 768 | grouped selector | pass | none |
| 1024 | grouped selector | pass | none |
| 1440 | grouped navigation rail | pass | none |

The Preview organization list rendered 10 of 30 rows by default. Searching for the
known `jupiter-demo` slug reduced it to one result and persisted
`organizationQ=jupiter-demo` in the URL. Commercial catalog initially exposed
four relevant sections with all five mutation forms closed; the explicit edit
action revealed exactly those five forms. Changing to subscriptions rendered
only lifecycle and request-queue sections and persisted `area=subscriptions`.
Capacity rendered exactly policy, allowance/add-on and Smart Action reporting;
Personal rendered its three personal-service controls; Assist rendered its
Help row and one Assist control surface. This component-driven routing replaced
an initially observed DOM-position selector weakness before final acceptance.

## Preview deployment and final acceptance

Commits `3e37efb` and corrective `78354da` were pushed to `main` and the clean,
isolated checkout at `/opt/jupiter/ip-preview` was detached at `78354da`.
Dependencies remained lockfile-pinned and the production Web bundle rebuilt on
the host. No migration, database query/change, API/worker restart, Nginx change
or co-hosted application change was needed. Preview Web, API health and
readiness returned HTTP 200; the dedicated API, worker and Nginx services were
active.

Authenticated acceptance used the existing Platform Admin and performed no
state-changing product operation. At 375, 768 and 1024 the grouped selector was
visible and the navigation rail hidden; at 1440 the navigation rail was visible
and selector hidden. In every case document `scrollWidth` equalled
`clientWidth`, RTL remained active, all five overview metrics rendered and no
visible error appeared. At 375 the organization page rendered 10 rows with a
three-page control, the `jupiter-demo` query returned one result, all five
Commercial URLs resolved to their exact task-specific content and the catalog
form disclosure changed from zero to five visible forms. At 1440 the
organization detail panel and Commercial navigation rendered without overflow.
The browser console contained no warning or error.

The canonical `https://jupiter.arandi.io` publication is intentionally
unchanged until the product owner reviews and explicitly approves the Preview
result.
