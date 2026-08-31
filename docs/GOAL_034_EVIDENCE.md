# GOAL-034 Evidence — Tenant routing, owner transition and resumable setup

Date: 2026-08-30

## Delivered

- Migration 035 adds tenant-RLS-protected, resumable setup progress without
  altering any existing organization or membership.
- `/o/{slug}` is the canonical workspace address. Legacy entry redirects only
  for a single unambiguous membership; multiple organizations present an
  explicit selection.
- Server-side tenant-context resolution verifies an active membership for the
  requested slug. Existing organization APIs continue to verify membership on
  every tenant-scoped request.
- New setup organizations show a compact Persian RTL checklist. Only an
  `ORG_OWNER` can activate after organization settings and at least one service
  category are present.
- Platform Admin can inspect active organization members and explicitly replace
  an owner. Existing `ORG_ADMIN` members are never auto-promoted.

## Validation

- Migration `035_tenant_routes_owner_transition_and_setup.sql` applied locally.
- API suite: 24 files / 62 tests passed. New coverage proves slug membership
  isolation, explicit legacy owner assignment, activation denial before setup
  prerequisites, and successful owner-controlled activation.
- Root API/Web typecheck, all tests and production builds passed.
- Authenticated local browser acceptance confirmed `/o/jupiter-demo`,
  tenant-scoped navigation links, and no document horizontal overflow at 375,
  768, 1024 and 1440px.

## Persian Help impact

The setup checklist and explicit owner assignment use Persian product language.
Runtime product Help remains deferred to GOAL-046.

## Deferred scope

Manual/CSV users are GOAL-035. Directory sync, commerce, Assist and Product
Help remain out of scope.
