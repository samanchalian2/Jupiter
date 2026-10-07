# GOAL-061 — Personal Workspace Identity, Provisioning & Routing

## Result

GOAL-061 implements the backward-compatible personal workspace foundation
approved by GOAL-060. A verified public account now receives exactly one
private personal workspace while retaining every organization membership and
organization application. This Goal does not implement Personal Support,
commercial capacity, packages, payment or the full personal-product UI.

## Persistence and tenant boundary

Migration `057_personal_workspace_foundation.sql` adds:

- `organizations.workspace_type` with `ORGANIZATION` and `PERSONAL` values;
- nullable `personal_owner_user_id`, required only for `PERSONAL` rows;
- a partial unique index enforcing at most one personal workspace per owner;
- database guards that permit only the exact personal owner as an active
  member and only the `REQUESTER` role in a personal workspace.

Existing rows are backfilled by the non-null default as `ORGANIZATION`; their
identifiers, status, memberships, roles, tenant foreign keys and RLS policies
are unchanged. Personal data continues to use the existing required
`organization_id` boundary instead of introducing a second tenancy model.

## Identity and provisioning

`PersonalWorkspaceService` provisions under a user-row lock and a database
transaction. Eligibility requires an active public `EMAIL_PASSWORD` identity
whose email is verified. Provisioning creates one active `PERSONAL` tenant,
one active owner membership and only the `REQUESTER` role, then records
`personal_workspace.provisioned` with the real user actor and non-secret source
metadata.

Email verification invokes provisioning in the same transaction. Login and
refresh also perform an idempotent lazy ensure, which safely covers eligible
legacy public accounts. An authenticated `GET /api/v1/personal/workspace`
returns only the caller's eligible personal projection. Unverified identities
receive no workspace.

## Routing and compatibility

Session memberships now include `workspace_type`. The Web client resolves a
personal membership through the canonical `/personal` route, supports account
switching between personal and organization workspaces, and keeps `/o/{slug}`
reserved for `ORGANIZATION` rows. A generated internal personal slug is never
accepted by the organization context resolver. Existing `/o/{slug}` behavior,
organization appearance and organization onboarding remain unchanged.

The temporary personal shell deliberately reuses the compact ticket surface
and Platform appearance. Organization knowledge, reports and administration
navigation are hidden and direct personal routes to those surfaces are not
exposed. The complete personal experience remains GOAL-065 scope.

## Authorization boundaries

- A personal owner cannot receive `ORG_OWNER`, `ORG_ADMIN`, team, Directory or
  SLA administration through the supported role model.
- Platform owner assignment/revocation explicitly rejects `PERSONAL` tenants.
- Organization Commercial, organization Assist and organization AI settings
  reject or exclude personal workspaces so later Personal Service Goals cannot
  accidentally consume organization commercial semantics.
- Platform commercial selectors receive only organization workspaces.
- The personal owner remains a normal tenant-bound `REQUESTER` for existing
  ticket data and cannot see another tenant.

## Automated acceptance

The new integration suite proves:

- idempotent provisioning creates one personal workspace and one requester
  membership while preserving an existing organization membership;
- verification provisions atomically and the next login session projects the
  `PERSONAL` membership;
- unverified accounts are denied and database membership/role guards reject
  a second member or an administrative role;
- organization administration and Platform owner assignment are denied;
- the private internal slug cannot resolve through `/o/{slug}`, while the
  personal owner remains a valid ticket actor inside the personal tenant.

Final quality gates:

- isolated migration rehearsal applied migrations 001–057 as **66/66**
  records; both personal columns were verified and the temporary database was
  dropped;
- API tests: **28 files / 122 tests**, executed sequentially because the
  integration suites share the local database;
- Web tests: **3 files / 13 tests**;
- API and Web typechecks passed;
- API and Web production builds passed;
- a built API smoke process returned HTTP 200 from `/api/v1/health` and was
  stopped afterward;
- `git diff --check` passed. Vite's existing large-chunk advisory remains
  informational.

## Scope boundary and next Goal

No support-case lifecycle, support grant, recurring/purchased capacity,
catalog control, payment adapter, checkout or complete personal UI was added.
GOAL-062 is prepared as the next Goal and was not started in this execution.
GOAL-059 remains a separate blocked deployment gate.
