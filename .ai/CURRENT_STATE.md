# Current State

**Phase:** MVP complete; all planned Goals are done.

**Commercial transformation:** Phases 0 through 2 are complete. The commercial
product scope, role-based information architecture, nine delivery phases, and
acceptance criteria are defined in `docs/COMMERCIAL_PRODUCT_PLAN.md`. The web
now has a protected responsive RTL shell, role-aware navigation, persistent
local session, organization context, accessible states, and bounded pages for
dashboard, tickets, knowledge, reports, organization administration, and
platform administration. Role dashboards use live permitted ticket counts,
manager workload, and protected platform aggregates; they were browser-tested
against the local database. Phase 3 administration is complete: organization
admins can manage members, catalogs, closure policy and response templates;
platform admins can view and activate/suspend organizations. Migration 009
applied locally and all quality gates passed. Phase 4 is complete: the ticket
workspace provides role-scoped queues, text/status/priority filtering,
sorting, session-saved views, assignment, tag creation/linking, watching, and
server-validated bulk transitions. The live local browser flow was verified
with the organization-admin account after an API restart. Phase 5 is complete:
the ticket detail now unifies public messages, staff-only notes and activity
history; supports secured attachment upload/download, requester ratings,
closure/reopen actions consistent with the fixed lifecycle, and a protected
live notification center. Browser testing confirmed staff-only notes appear in
the unified timeline without exposing a separate requester view. Phase 6 is
complete: tenant business calendars drive SLA due times, active policies drive
timers, the periodic monitor issues warning/breach escalation, assignment rules
automatically route new tickets, and in-app notification preference is exposed
in the product shell. Deterministic calendar and two-tenant escalation tests
plus automatic-assignment integration coverage pass. Phase 7 is complete:
supervisors and organization administrators have a role-scoped operational
report with a validated, bounded date-range builder and matching safe CSV
export; the knowledge base supports contributor authoring, review submission,
manager review and publication, and published-only search. API lifecycle and
export-policy tests pass, and the full knowledge lifecycle plus live report
metrics were browser-tested against the local database. Phase 8 is next.

GOAL-001 through GOAL-012 are complete. The repository contains the executable
foundation plus a PostgreSQL migration for organizations, users, memberships,
roles/permissions, organization directory tables, audit logs, and RLS policies.
Local authentication supports bootstrap platform administration and login.
Tenant-scoped tickets now support draft creation, submission, canonical status
transitions, manual assignment, transition history, audit events, public
conversation messages, staff-only notes, append-only activity history, and
authorized SSE ticket notifications. Secure attachment upload requests, object
metadata verification, and time-limited S3-compatible URLs are available.

Validation on 2026-08-09: PostgreSQL 18.4 is installed locally and Jupiter is
running at 127.0.0.1:5433. Migration 001_identity.sql applied successfully;
RLS returned one department for each of two tenant contexts and zero for an
unknown context. Migration 004_conversation.sql applied and the integration
suite verified requester/internal-note secrecy, append-only conversation
records, RLS isolation, and recipient-scoped SSE notification delivery. The
local database password exists only in ignored .env. Migration
005_attachments.sql applied; upload validation and authorization integration
tests pass.
