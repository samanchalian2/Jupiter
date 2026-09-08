# GOAL-058 — Full End-to-End Business Acceptance

## 1. Initial Business Acceptance Inventory

The audit covered the production code and its existing integration suite for
organizations, global identities and tenant memberships, Setup Wizard, ticket
lifecycle and attachments, Smart Intake and Ticket Review, commercial
capabilities/subscriptions/shared allowance/overage, Jupiter Assist,
Directory Connector, Product Help, appearance, Platform controls,
notifications, audit records and tenant isolation. The authoritative coverage
is in `apps/api/test/organization-application.integration.spec.ts`,
`ticket-intake.integration.spec.ts`, `ai-gateway.integration.spec.ts`,
`conversation.service.integration.spec.ts`, `product-help.integration.spec.ts`
and the ticket, attachment, SLA, branding and security integration tests.

## 2. Test Fixtures

- API acceptance created Organization A (SETUP), B (ACTIVE business tenant)
  and C (ACTIVE isolation tenant) through public-account verification,
  `SUBMITTED → UNDER_REVIEW → APPROVED`, and the atomic provisioning service.
- B included temporary `ORG_OWNER`, `ORG_ADMIN`, `SUPERVISOR`, `EXPERT` and
  `REQUESTER` memberships; the Platform Admin and Jupiter Assist Agent use
  the supported platform models.
- Browser acceptance used one separately provisioned temporary SETUP tenant
  and an explicitly assigned, auditable temporary `ORG_OWNER` membership for
  the existing local Platform Admin.
- All four temporary organizations and their temporary accounts, memberships,
  tickets, Directory state, setup progress and browser acceptance membership
  were removed. A final DB query returned `goal058Organizations: []` and zero
  orphan memberships.

## 3. Organization Application

The new three-tenant acceptance journey uses the supported application and
approval services, verifies initial `ORG_OWNER`/`ORG_ADMIN`, canonical slug,
global applicant identity, organization-scoped membership, idempotent
approval, lifecycle audit and one provisioned SETUP tenant per application.
Existing integration coverage additionally verifies verification, single-use
tokens, applicant non-disclosure, `NEEDS_INFORMATION`, rejection/cancellation
and no automatic promotion of legacy `ORG_ADMIN` users.

## 4. Setup Wizard

The acceptance journey saved Profile, created Ticket Configuration and ran
concurrent Owner Go-Live; it produced one ACTIVE transition and one lifecycle
audit per tenant. The canonical Wizard tests cover required/optional steps,
resumable versioned progress, Owner-only skips/Go-Live, warnings versus
blockers, drift after a category removal and idempotent concurrency.

## 5. Identity / Membership

API acceptance created all required B roles through Organization member APIs,
deactivated/reactivated a requester, denied a C-owner mutation of that B
membership, denied Owner-only commercial data to B `ORG_ADMIN`, and verified
that the Platform Admin did not acquire implicit tenant visibility. CSV
preview/import verifies invalid rows, non-disclosing passwords and duplicate
idempotency; Directory mapping is constrained to requester/expert/supervisor.

## 6. Ticket Lifecycle

An actual B requester created `DRAFT`, submitted `OPEN`, received a
Supervisor assignment to Expert, then completed
`IN_PROGRESS → WAITING_FOR_REQUESTER → IN_PROGRESS → RESOLVED → CLOSED`.
The acceptance queried six durable transition rows and exercised requester,
expert and supervisor permissions. Ticket/attachment/conversation tests prove
tenant-scoped reads, allowed metadata uploads, audit/activity timestamps,
notification recipients and non-disclosure of internal notes.

## 7. AI Smart Actions

`ticket-intake.integration.spec.ts` proves one `AI_SMART_INTAKE` reservation
per intake, secure telemetry, valid persisted suggestion before settlement,
explicit user draft creation and no automatic submit. Failed provider retries
release capacity and retain manual entry. `ai-gateway.integration.spec.ts`
proves Ticket Review’s valid result settlement, retry/idempotency and manual
ticket continuity. No prompt, transcript, attachment or credential is stored
in commercial telemetry.

## 8. AI Allowance

Commercial integration executes the shared `AI_SMART_ACTIONS` pool and its
deterministic source ordering: `PERIODIC → ADDON → EMERGENCY → OVERAGE → deny`.
It verifies concurrent reservation bounds, expiry, Owner-only overage controls,
release on unsuccessful delivery and immutable ledger behavior. Manual ticket
creation remains permitted after commercial denial.

## 9. Subscription Lifecycle

The lifecycle service tests `ACTIVE`, `PAST_DUE`, grace, `SUSPENDED`,
`CANCELLED` and `EXPIRED`, with valid transition graph enforcement and
deduplicated owner notices. Smart Actions and new Assist acceptance are gated
when unavailable; manual tickets and accepted Assist cases/data remain usable.

## 10. Commercial Dashboard

The explicit Owner projection covers subscriptions, shared allowance,
remaining/add-on/emergency/overage state, Assist summary and warnings. The API
independently rejects `ORG_ADMIN`, a non-member and a foreign tenant; no
credential, prompt or raw sensitive telemetry is projected.

## 11. Jupiter Assist

Request policies `USER_REQUEST_ALLOWED` and `ADMIN_APPROVAL_REQUIRED`, queue,
accept, `IN_PROGRESS`, `WAITING_FOR_ORGANIZATION` and completion are covered.
Request/approval/queue consume zero units; a permitted `ACCEPT` settles one
case-bound unit. Retries/concurrent accept cannot settle twice. Package order,
nearest-expiry tie-breaking, suspension/reactivation and accepted-case
continuity are integration-tested.

## 12. Directory

The acceptance suite verifies tenant-bound create/pair/heartbeat, hashed
single-use/expired pairing codes, rotating device credentials, health states,
incremental create/update/unchanged/conflict/out-of-scope behavior, safe
no-email identities and collision conflict handling. Full reconciliation
performs absence lifecycle only after complete success; incomplete or
policy-changed runs are `PARTIAL`. Disabled users suspend immediately,
out-of-scope users use grace, directory role mapping cannot grant owner/admin,
and revoke/re-pair retains connector identity while invalidating all old
material.

## 13. Appearance

Integration coverage verifies `JUPITER #315399`, OCEAN and TEAL, contrast-safe
custom values, organization inheritance/override/reset, tenant switching and
no cross-tenant theme leak. Platform custom-primary removal preserves preset,
density, radius and logo; it is not a full reset.

## 14. Help

Product Help tests prove exact-audience filtering for requester/admin/owner/
Platform Admin, non-disclosing draft/unpublished reads, Persian search ranking,
published contextual mappings and Platform-only revision/preview/publish/
restore/export. Browser acceptance opened the Setup Wizard trigger and
rendered the published Persian article `organization-setup-wizard`.

## 15. Notifications

Ticket conversation, commercial lifecycle/allowance, Assist and Directory
coverage verifies recipient scoping and durable deduplication. Restricted ticket
tests prove no internal note or unauthorized Assist/notification detail is
returned to requesters, foreign tenants or Platform users without a grant.

## 16. Audit

The acceptance asserted organization provisioning, Go-Live, membership,
ticket transition, commercial, Assist, Directory and appearance audit events.
The three-tenant assertion found three owners, three Go-Live events and zero
fixture audit metadata containing password, secret or token markers. Dedicated
security tests also verify hashed credentials/pairing material and safe AI
audit metadata.

## 17. Tenant Isolation

Organization C denied B’s membership mutation and ticket read. Existing
integration tests extend this to applications, Directory records/runs,
commercial settings/ledger, Assist grants/cases, appearance and Help
non-disclosure under tenant RLS and application authorization.

## 18. Platform Boundary

The Platform Admin is not an implicit tenant owner or ticket reader: the
three-tenant acceptance denied ticket detail without tenant role, while the
Platform service tests separately prove allowed Platform controls. Jupiter
Assist agents similarly remain outside memberships and require an active,
scoped, unrevoked grant.

## 19. Browser Acceptance

Authenticated local browser acceptance visited the canonical temporary Setup
route plus Users, Directory, Appearance, Owner Commercial, tenant Ticket list,
Ticket detail, Help Center and Platform Organizations, Applications,
Commercial, Appearance and Help controls. Every sampled route had Persian RTL
and no document-level horizontal overflow at 375, 768, 1024 and 1440 px.

## 20. Mobile Acceptance

At 375 px, Setup stepper, Users, Directory, Appearance, Commercial, Ticket
list/detail, Help and Platform controls remained bounded. The Platform section
selector was usable, and opening the mobile drawer exposed all permitted
Dashboard/Ticket/Knowledge/Help/Reports/Admin/Platform destinations with a
dedicated close action. Internal table scrolling is contained; document width
never exceeded client width.

## 21. Failure Paths

Browser acceptance displayed the Persian invalid-login message
«اطلاعات ورود صحیح نیست.» and the public organization application form.
Integration coverage verifies invalid role/tenant, invalid appearance primary,
setup readiness block, allowance/overage exhaustion, subscription capability
denial, Assist capacity denial and stale Directory pairing; each preserves the
relevant durable state and manual ticket route.

## 22. Concurrency / Idempotency

The B Owner’s concurrent Go-Live returned exactly one normal and one
idempotent success. Existing integration tests prove idempotent application
approval/CSV import, bounded concurrent Smart Action reservation/settlement,
bounded Assist accept and single-use Directory pairing/re-pair.

## 23. Data Integrity

Final local DB checks returned zero for membership-without-organization,
ticket-without-same-tenant-requester, Assist consumption without matching case,
duplicate settled AI action idempotency, paired connector without device hash,
setup progress without organization, malformed appearance override and invalid
current Help revision.

## 24. Defects Found

The first acceptance run exposed a test-fixture cleanup order bug: a temporary
Setup organization’s membership could be deleted before its test ticket,
leaving a ticket whose requester no longer had a membership after an aborted
test cleanup. This was local fixture residue, not a runtime tenant path.

## 25. Defects Fixed

`organization-application.integration.spec.ts` now deletes temporary Setup
tickets before memberships. The stale exact fixture was removed after
inspection, the complete API suite reran, and the final integrity query is
zero for the affected condition.

## 26. Cleanup

All GOAL-058 organization slugs were absent after cleanup. Temporary browser
fixture data was removed through its known organization/application/membership
path; the runtime Help catalog and normal tenant data were preserved. No test
credential, pairing token or provider secret was written to the repository or
this Evidence.

## 27. Quality Gates

- Isolated forward migration rehearsal: a temporary empty database received
  the database-owned part of migration 001 (the cluster-level `jupiter_app`
  role already exists), then migrations 002–056. Result: **65/65** records;
  the temporary database was dropped.
- API tests, Web tests, API/Web typechecks, API/Web production builds and
  `git diff --check` passed in the final rerun: **27 API files / 117 tests**,
  **3 Web files / 13 tests**, both typechecks and both production builds. Vite
  reported only its existing advisory for one minified JavaScript chunk above
  500 kB.

## 28. Release Readiness Matrix

| Domain | Acceptance | Browser | Isolation | Audit | Result |
| --- | --- | --- | --- | --- | --- |
| Identity | Pass | Login/application | Pass | Pass | Ready |
| Organization / Setup | Pass | Wizard | Pass | Pass | Ready |
| Ticket | Pass | List/detail/composer | Pass | Pass | Ready |
| AI / Allowance | Pass | Clear manual fallback | Pass | Pass | Ready |
| Commercial | Pass | Owner/Platform controls | Pass | Pass | Ready |
| Assist | Pass | Platform controls | Pass | Pass | Ready |
| Directory | Pass | Admin controls | Pass | Pass | Ready |
| Appearance | Pass | Tenant/Platform controls | Pass | Pass | Ready |
| Help | Pass | Center/trigger/authoring | Pass | Pass | Ready |
| Notifications | Pass | Header inbox surface | Pass | Pass | Ready |

## 29. Known Limitations

This is local release readiness evidence. Deployment-owned staging requirements
(HTTPS ingress/HSTS, registry/image provenance, managed secret identity and
managed backup/restore) remain governed by `docs/STAGING_RELEASE_CHECKLIST.md`
and are not asserted as completed locally.

## 30. Final Verdict

**ACCEPTED locally.** All GOAL-058 acceptance, cleanup and quality gates passed.
The existing staging-only checklist remains a deployment gate. GOAL-059 was
not started.
