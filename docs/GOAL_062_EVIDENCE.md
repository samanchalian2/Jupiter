# GOAL-062 Evidence — Personal Service Catalog, Support Cases & Agent Access

## Result

GOAL-062 is complete. Jupiter now has an operational Personal Support boundary
for verified personal workspaces without reusing organization Assist. The Goal
adds no capacity, package, payment, checkout or full personal-service UI; those
remain in the approved later sequence.

## Schema and migration

- `058_personal_support_operations.sql` adds the global, Platform-owned
  `PERSONAL_SUPPORT` catalog entry and tenant-scoped `personal_support_cases`.
- Catalog fields safe for Platform configuration are availability, display
  name, visible description, operational SLA and bounded agent-access duration.
- The case lifecycle is `QUEUED`, `ACCEPTED`, `IN_PROGRESS`,
  `WAITING_FOR_USER`, `COMPLETED`, `CANCELLED`, `REJECTED`, `REVOKED`.
- Support grants now record `ORGANIZATION_ASSIST` or `PERSONAL_SUPPORT` as an
  explicit source. A Personal Support grant is routed-only, time-bound and
  attached to one case and one ticket.
- `058a_personal_support_grant_integrity.sql` strengthens the grant with a
  composite organization/case/ticket foreign key and removes tenant-role write
  access from the global catalog.
- An isolated fresh-database rehearsal applied all migrations 001–058a as
  **68/68** and verified the catalog, case table and exact-ticket constraint.
  The temporary database was removed afterward.

## Application boundary and APIs

The new Nest `PersonalSupportModule` owns the operational lifecycle. The
personal owner can read the catalog/cases, request support for a submitted
personal ticket and cancel a queued case. Request is idempotent per ticket,
does not alter the ticket lifecycle and does not affect manual ticketing.

Platform/agent endpoints provide catalog management, queue projection,
acceptance, allowed case transitions, rejection/revocation and exact-ticket
conversation access. Platform Admin administers policy and exceptional
closure; an active Jupiter support agent accepts and operates a case. Agents
are never tenant members.

Acceptance locks the queued case, records the real agent, snapshots SLA and
grant duration and creates at most one ticket-scoped grant. Concurrent accepts
therefore cannot create two assignments or grants. Content authorization,
grant locking and the protected read/write execute in the same tenant-scoped
transaction. Completion and explicit revocation revoke access immediately;
expiry also denies access.

Organization Assist grant lookup now explicitly selects only
`ORGANIZATION_ASSIST`, so a Personal Support grant cannot grant Assist access
or vice versa.

## Platform controls

The existing Platform commercial area contains a compact Persian control for:

- service availability;
- visible service name and description;
- operational SLA in minutes;
- bounded agent-access duration;
- queue status and role-appropriate accept/transition/reject/revoke actions.

No new navigation pattern or heavy dashboard was introduced. Authorization,
tenant isolation, exact-ticket scope, grant revocation and audit identity are
security invariants and are deliberately not configurable.

## Security and audit evidence

- Only the verified owner/`REQUESTER` of an active `PERSONAL` workspace can
  create or list its cases.
- Organization workspaces, another personal tenant and unowned tickets are
  denied without changing their records.
- Catalog mutations are Platform-Admin-only at both API and database privilege
  boundaries.
- Queue acceptance requires an active global Jupiter agent; it creates no
  membership.
- The grant database relation proves that the referenced case and ticket match
  in the same organization.
- Catalog changes, requests, acceptance, state changes, rejection and
  revocation retain the real authenticated actor and minimal metadata.
- No credential, ticket text or message body is copied to audit metadata.

## Automated acceptance

- API: **29 files / 126 tests passed**, including four comprehensive Personal
  Support integration scenarios for configuration authority, tenant/workspace
  isolation, idempotent request, unavailable service, concurrent acceptance,
  exact-agent/exact-ticket access, expiry, completion/revocation and Assist
  separation.
- Web: **3 files / 13 tests passed**.
- API and Web typechecks passed.
- API and Web production builds passed. Vite retains the existing non-blocking
  bundle-size advisory.
- `git diff --check` passed for the Goal change set.

## Authenticated browser acceptance

Using the existing authorized local Platform Admin session, the Platform
commercial tab displayed «پشتیبانی کاربران شخصی», the safe catalog fields and
the Personal Support queue. The actual in-app browser viewport was 749 px wide:
the document was RTL (`dir=rtl`), `scrollWidth=749`, `clientWidth=749`, and had
no document-level horizontal overflow. Current runtime values were read only;
the acceptance did not mutate policy or create cases. Local API/Web acceptance
processes were stopped after the check, and no credential was recorded.

## Scope boundary and handoff

GOAL-063 is ready but was not started. It will add separate recurring and
purchased capacity for personal support and personal AI and will integrate
reservation/release/settlement with this case lifecycle. Payment/checkout stays
in GOAL-064; complete personal UX and Help stay in GOAL-065.
