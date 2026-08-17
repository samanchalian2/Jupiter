# InspectA acceptance evidence

This matrix is the local completion audit for the 32 findings in
`docs/inspectA.md`.  It distinguishes a code location from an execution
check; the final column states the strongest available evidence.

| Finding | Product evidence | Execution evidence |
|---|---|---|
| IA-001 | Refresh rotation in `apps/api/src/auth/auth.service.ts`; client retry/expiry handling in `apps/web/src/App.tsx` | Live invalid-JWT browser reload returned the login view, and the protected API returned 401 rather than 500. |
| IA-002 | Member and role controls in `apps/web/src/OrganizationAdminConsole.tsx`; protected organization service/controller | Live organization-admin page showed member, role, status and password-reset controls. |
| IA-003 | Role-gated routes/navigation in `App.tsx`; reporting access policy in `reporting.service.ts` | Authenticated requester queue was 200; direct reporting request was 403. `reporting.service.spec.ts` covers denial. |
| IA-004 | Platform-without-membership path in `App.tsx`; platform authorization in reporting/organization controllers | A zero-membership platform administrator received 200 from platform AI settings. |
| IA-005 | Worker entry point `apps/api/src/worker.ts`, queue worker and validated adapters in `apps/api/src/jobs/` | `ai-provider.spec.ts` and `transcription-provider.spec.ts` pass; missing provider configuration becomes a visible retry/failure state. |
| IA-006 | Preference-filtered recipients in `conversation.service.ts` and `sla.service.ts` | Conversation and SLA integration suites pass; notification preference endpoint is live in the product shell. |
| IA-007 | Catalog CRUD in `organization.service.ts` and `OrganizationAdminConsole.tsx` | Live admin API matrix returned 200 for catalog settings. |
| IA-008 | Assignment rules and calendars in `sla.service.ts` and organization console | Live SLA tab showed assignment and calendar controls; SLA integration suite passes. |
| IA-009 | Expanded requester form in `TicketWorkspacePro.tsx` | Live ticket workspace showed priority, catalog fields and custom fields. |
| IA-010 | Description-before-timeline layout in `TicketWorkspacePro.tsx` | Live ticket detail showed the request description above its history. |
| IA-011 | Unified timeline in `conversation.service.ts` and `App.tsx` | Conversation integration test and live ticket detail confirm one timeline with messages, notes and activities. |
| IA-012 | Paged queue contract in `ticket.service.ts` and `TicketWorkspacePro.tsx` | Live queue displayed total, page and page navigation. |
| IA-013 | Role-aware dashboard in `DashboardPro.tsx` | Live dashboard displayed actionable workload, SLA-risk and unassigned-ticket links. |
| IA-014 | Reports and CSV export in `ReportsPro.tsx` and `reporting.service.ts` | Live report displayed dates, distributions and daily trend; reporting test covers bounded export policy. |
| IA-015 | Operational platform controls in `PlatformPro.tsx` | Platform API matrix and zero-membership platform-admin check passed. |
| IA-016 | Revision/workflow service in `knowledge.service.ts` and workspace in `KnowledgeWorkspacePro.tsx` | Knowledge lifecycle tests pass; live workspace rendered published and authoring/review states. |
| IA-017 | Calendar day/time controls in `OrganizationAdminConsole.tsx` | Live SLA tab rendered days, timezone and readable start/end times. |
| IA-018 | Hashed rotating refresh sessions and logout revocation in auth service | Live login and refresh returned an access token only; refresh cookie remained HTTP-only. |
| IA-019 | Browser-accessible protected role routes and server authorization | Local browser inspected admin, dashboard, reports, knowledge and responsive routes; requester and platform API role journeys passed. |
| IA-020 | Global Shabnam typography and restrained scale in `apps/web/src/styles.css` | Production build contains Shabnam assets; live RTL screens were inspected. |
| IA-021 | Shell title plus page-specific headings in `App.tsx` and pro page components | Live dashboard, report, knowledge and administration pages expose their own `h2` titles. |
| IA-022 | Queue, dashboard and report information layouts in pro components | Live pages rendered compact KPI cards, filters and tables. |
| IA-023 | Persian status/priority/activity mappings in `App.tsx` and `TicketWorkspacePro.tsx` | Live ticket changed from raw OPEN/NORMAL/event codes to Persian labels. |
| IA-024 | Priority-dot visual states in `TicketWorkspacePro.tsx` and styles | Queue renders colored priority indicator alongside its readable label. |
| IA-025 | Persistent ticket-view endpoints and queue selector | Live API matrix includes ticket views; product UI loads and saves them through `/tickets/views`. |
| IA-026 | Primary new-ticket action in `TicketWorkspacePro.tsx` | Live queue showed the fixed «تیکت جدید» action and its form. |
| IA-027 | Restricted rating form and API in `App.tsx` and reporting service | `reporting.service.spec.ts` rejects feedback before resolution; the UI exposes it only for resolved/closed requester tickets. |
| IA-028 | Secure attachment flow in `App.tsx` and `attachment.service.ts` | Attachment integration suite passes; UI provides preparation, upload, error, success and secured download feedback. |
| IA-029 | Skip link, focus styling, labels and alert/status roles in shell/components | Live browser snapshot contains the skip link; mobile/accessibility inspection passed. |
| IA-030 | Collapsible mobile navigation in `App.tsx` and stylesheet | Live 390px browser inspection showed collapsed navigation and all permitted entries after opening it. |
| IA-031 | Profile/password endpoint and account/notification controls in `App.tsx` | Live account menu showed display-name, current/new password and in-app notification preference controls. |
| IA-032 | Search, durable inbox, custom fields and secure email ingress | Migrations 017–019 applied locally; custom-field API and secured `/email/inbound` returned valid results, including HTTP 201 for inbound mail. |

## Quality gate

On 2026-08-12, `pnpm verify:release` passed after the final InspectA changes:
API and web lint/typecheck, 28 API tests, and both production builds.

## Deployment boundary

An external email vendor and external AI/transcription vendor need only their
deployment-owned endpoint and secret/key configuration.  Their absence is not
a queued-work dead end: the local worker records a visible failure/retry state.
