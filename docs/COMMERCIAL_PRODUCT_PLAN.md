# Jupiter commercial product plan

## Product outcome

Jupiter becomes a multi-tenant, RTL-first service-management product for
internal organizational support. It keeps the approved fixed ticket semantics
and tenant/RLS model while providing complete web experiences for requester,
expert, supervisor, organization administrator, and platform administrator.

## Product principles

- Every action is visible only to an authorized organization member.
- A user can understand their next action from one screen without API knowledge.
- Operational data is actionable: counts link to queues and every metric has a
  defined time window and permission policy.
- AI is opt-in, labelled, reviewable, and never blocks manual work.
- The UI is Persian/RTL by default, responsive, keyboard usable, and uses the
  locally bundled Shabnam typeface.

## Information architecture

| Area | Requester | Expert / supervisor | Organization admin | Platform admin |
| --- | --- | --- | --- | --- |
| Home | My requests, response updates | My queue, SLA risk, workload | Organization health | Tenant health and AI usage |
| Tickets | Create, list, detail, rating | Queue, assigned work, bulk actions | All organization tickets | Read-only support access only when explicitly audited |
| Knowledge | Search articles | Search and propose articles | Publish and review | Global policy only |
| Reports | Personal history | Team metrics | SLA, satisfaction, workload | Tenant and service health |
| Administration | Profile and notifications | Saved views | Members, teams, catalog, SLA, templates, automations | Organizations, platform users, AI policy, audit |

## Commercial baseline

1. **Product shell:** persistent RTL navigation, responsive layout, profile,
   organization context, notification center, empty/loading/error states, and
   accessible controls.
2. **Role dashboards:** role-aware widgets for open work, SLA risk, workload,
   recent activity and satisfaction; no aggregate is exposed without a role
   policy.
3. **Administration:** membership lifecycle, role assignment, teams,
   organization catalog, business hours, closure policy, templates, and
   notification preferences.
4. **Ticket operations:** saved queues, filter/search/sort, assignment,
   watchers, tags, internal notes, attachments, activity timeline, ratings,
   and safe bulk actions.
5. **Service management:** SLA timers, escalation and assignment rules, audit
   evidence, reports, exports, and operational dashboards.
6. **Knowledge and intelligence:** reviewed knowledge articles, searchable
   content, AI review UI, transcription job visibility, usage controls and
   manual fallback.
7. **Enterprise readiness:** secure sessions, audited admin actions,
   observability, backup/restore drills, browser E2E tests, load tests, and a
   staged release path.

## Delivery phases and acceptance

### Phase 0 — product and design foundation

Define the roles, screen map, design tokens, component conventions, data
contracts, acceptance tests, and ADRs for features that extend the MVP.

**Done when:** this document, the commercial execution plan, and a reusable
web UI foundation exist; all additions preserve the approved ticket and tenant
invariants.

### Phase 1 — product shell

Introduce application routing, protected layout, responsive sidebar, top bar,
organization switcher, profile menu, loading/error/empty states, and a
Shabnam-based component theme.

**Done when:** each role reaches its permitted areas through navigation without
seeing inaccessible navigation or encountering a blank page.

### Phase 2 — role dashboards

Build requester, expert, supervisor, organization-admin, and platform-admin
dashboards from role-scoped APIs and drill-down links.

**Done when:** dashboard counts reconcile with ticket lists and role policies
are integration-tested.

### Phase 3 — administration

Build organization and platform settings, member invitations, role management,
directory/catalog management, ticket forms, business hours, and templates.

**Done when:** privileged changes are audited, tenant-isolated, and manageable
without direct database access.

### Phase 4 — professional ticket workspace

Build queues, filters, sorting, saved views, assignment, tags, watchers,
bulk-safe actions, and an agent-focused ticket workspace.

**Done when:** an expert and supervisor can triage and process a queue entirely
from the web UI.

### Phase 5 — complete ticket collaboration

Build a unified timeline, internal notes, attachment UI, requester-facing
status history, satisfaction flow, reopen/closure policy UI, and notifications.

**Done when:** requester and staff complete an end-to-end ticket conversation
without losing authorization or audit evidence.

### Phase 6 — SLA and automation

Add business calendars, SLA policies/timers, warnings, escalation, assignment
rules, and notification preferences.

**Done when:** deterministic tests prove timer calculation and escalation under
two tenants and business calendars.

### Phase 7 — reporting and knowledge

Add report builder/export, operational and satisfaction metrics, and reviewed
knowledge-base authoring/search.

**Done when:** reports are role-scoped, export safely, and knowledge articles
have draft/review/published lifecycle.

### Phase 8 — AI and transcription experience

Expose organization-entitled AI configuration, review/confirmation, usage,
transcription job state, retry visibility, and accessible manual fallback.

**Done when:** provider failure never blocks a ticket and every AI action is
reviewable and auditable in the UI.

### Phase 9 — enterprise release readiness

Deliver security, observability, staged deployment, restore drills, load and
browser E2E evidence, accessibility review, and operator runbooks.

**Done when:** release gates are proven in staging, rather than merely
documented.

## Non-negotiable constraints

- Do not weaken RLS, organization scoping, fixed semantic ticket states, or
  human confirmation for AI.
- Do not expose platform administration to organization roles.
- Any configurable workflow beyond labels/closure policy needs an ADR.
- No production credential, private attachment, or tenant content enters Git,
  browser fixtures, general logs, or generated documentation.
