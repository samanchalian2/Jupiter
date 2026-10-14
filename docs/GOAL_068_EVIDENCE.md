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

## Shell navigation remediation and canonical promotion

Owner review found that `/platform` bypassed the standard application shell.
The direct route was replaced with `ProductShell`, restoring the global desktop
Sidebar and mobile Hamburger/Drawer while retaining the grouped in-page
Platform navigation. A second authenticated check on the canonical dataset
showed that its Platform administrator has no tenant membership. That supported
case now uses the same shell but exposes only Platform navigation and suppresses
tenant-scoped search, notifications, branding and workspace controls.

The final release gate passed 146 API tests and 23 Web tests together with
lint, API/Web typecheck, both production builds and `git diff --check`.
Commits `1730cd3` and `226f3b7` were pushed. Preview was rebuilt at `226f3b7`;
Web, health and readiness returned HTTP 200 and its API, worker, Nginx and
co-hosted application remained active.

After explicit owner approval, the tested Web bundle was published as immutable
canonical release `/srv/jupiter/releases/226f3b7-platform-shell` by an atomic
`current` symlink switch. API/worker processes and PostgreSQL were not restarted
or changed. At the exercised mobile viewport the Hamburger had a 40×40 target,
opened an RTL dialog containing the authorized Platform navigation and document
`scrollWidth` equalled `clientWidth`. At 1440px the 232px Sidebar and grouped
Platform navigation rail were visible, the mobile trigger had zero layout size,
and document `scrollWidth` again equalled `clientWidth`. No visible error was
present.

Canonical Jupiter Web and health, plus the separately hosted Arandi Web,
returned HTTP 200. `jupiter-main-api`, `jupiter-main-worker`, Nginx and
`arandi-platform` all remained active. No migration, database row, tenant data,
Arandi file, Arandi service configuration or Arandi database was changed.

Owner review then identified that the restored mobile Drawer was still anchored
to the physical left edge. Both effective legacy CSS declarations now use the
RTL/right edge and the shadow direction was corrected. The source regression
test prevents reintroducing the left-edge inset. Web tests, typecheck, production
build and diff validation passed. Authenticated Preview and canonical checks at
the exercised mobile viewport measured `right: 0`, a 288px Drawer, RTL direction,
equal document client/scroll widths and no visible error. Commit `c2aeedb` is
deployed to Preview and canonical release `c2aeedb-rtl-drawer`; all Jupiter and
co-hosted Arandi health checks remained successful.
