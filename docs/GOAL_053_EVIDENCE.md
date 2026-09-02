# GOAL-053 — Jupiter Assist package capacity evidence

## Delivered boundary

- Migration `053_assist_package_capacity.sql` introduces package-backed Assist allocations and an immutable tenant ledger, then migrates existing positive policy capacity to open-ended `LEGACY_MIGRATED` credit. Follow-up migrations `053a` and `053b` preserve the immutable event while allowing only foreign-key anonymization of a deleted actor.
- `AssistCapacityService` makes Platform package, allocation, suspension and append-only adjustment operations explicit and audited.
- `AssistService.accept()` checks grant and commercial lifecycle first, then settles exactly one capacity unit under an organization advisory lock in the same transaction as acceptance.
- Owner projections disclose only package summaries, remaining capacity, validity and accepted/in-progress case counts.

## Verification completed so far

- Local migration runner applied `053_assist_package_capacity.sql`, `053a_assist_capacity_ledger_anonymization.sql` and `053b_assist_capacity_ledger_actor_anonymization.sql` successfully.
- API suite: 26 files / 91 tests passed. Web suite: 2 files / 11 tests passed. API and Web typechecks, both production builds and `git diff --check` passed.
- Authenticated browser acceptance loaded both the Owner commercial dashboard and Platform commercial console in Persian RTL. The browser runtime reported no document-level horizontal overflow at its available responsive widths. Its embedded viewport clamps a requested 375px width to 686px, so a literal 375px visual assertion remains pending a browser surface that permits that width.

## Authenticated browser acceptance and restoration

- A temporary `ORG_OWNER` role was assigned to the local Platform Admin account only in `jupiter-demo` for this acceptance session. The Owner commercial dashboard and its compact Jupiter Assist Help trigger loaded in Persian RTL.
- The Platform commercial console loaded its package/allocation controls in Persian RTL. At the requested 768, 1024 and 1440 viewports there was no document-level horizontal overflow. The embedded Browser surface clamps a requested 375px viewport to 686px; that constrained surface also had no document-level overflow, but it is not a literal 375px assertion.
- The local runtime Product Help article `jupiter-assist` was saved and published as version 2. It now explains package-backed capacity, settlement only on Assist acceptance, expiry/suspension, consumption order and the separation of capacity from the time-bounded access grant.
- The temporary `ORG_OWNER` role was revoked through the new Platform owner-revocation control. A fresh authenticated session verified that `admin@jupiter.local` has only `ORG_ADMIN` in `jupiter-demo`; no package, allocation or other commercial test data was created in that organization. Assignment and revocation are written to `audit_logs` as `platform.organization_owner_assigned` and `platform.organization_owner_revoked`.

## Acceptance limitation

The in-app Browser control surface did not honor a literal 375px override. A follow-up visual run on a browser surface that permits a 375px viewport remains recommended before a release decision; this is an acceptance-environment limitation, not a document-overflow finding.

## GOAL-053 remediation — Assist capacity acceptance gaps

- Membership status is canonically the lower-case identity value `active`. `AssistCapacityService` now names that invariant explicitly and also requires `users.is_active` before delivering a commercial Assist notification. The new integration assertion proves an active `ORG_OWNER` receives `ASSIST_PACKAGE_ASSIGNED`, while an inactive owner membership receives none; repeating the same organization/capability/event-window creates no second notification.
- Package definitions are now controllable by Platform Admin through `POST /platform/assist/capacity/packages/{id}/status`, with a mandatory reason and `ASSIST_PACKAGE_SUSPENDED` or `ASSIST_PACKAGE_REACTIVATED` audit event. Definition suspension blocks **new assignments only**. It does not alter, delete or suspend allocations already issued; those remain consumable until their own status or expiry prevents it. Allocation suspension independently prevents new consumption and likewise does not interrupt an already accepted Assist case.
- Existing server integration coverage proves request and approval do not settle capacity, only queued-case acceptance settles exactly one unit, and a repeated acceptance cannot settle another. It also covers denied acceptance without usable capacity, access-grant enforcement, lifecycle gating, tenant-scoped owner projections and unchanged ticket lifecycle. The remediation test adds definition suspension, retained issued allocation, assignment denial from a suspended package, reactivation audit, active-owner notification delivery and event deduplication.
- Capacity selection remains database-locked and deterministic: `INCLUDED`, then `PROMOTIONAL`/`MANUAL`/`LEGACY_MIGRATED`, then `PURCHASED`; the query breaks ties by nearest expiry, then creation time and allocation id. A per-organization advisory lock plus the unique consumed-case index means concurrent attempts on the same case create at most one `CONSUMED` event, and competing cases cannot drive remaining capacity below zero. Legacy positive policy capacity is migrated idempotently to one open-ended `LEGACY_MIGRATED` allocation and matching immutable credit ledger entry by migration `053_assist_package_capacity.sql`.
- Notification coverage intentionally implemented in this Goal is package-assignment recipient delivery and dedupe. Low/exhausted, expiry and allocation-suspension notifications are not yet emitted; they remain deferred rather than being claimed as delivered.

### Remediation verification

- `pnpm --filter @jupiter/api migrate`: migration runner completed successfully through `053b`.
- `pnpm --filter @jupiter/api test`: 26 files / 93 tests passed, including the new package-recipient/status and deterministic-source/concurrency integration tests.
- `pnpm --filter @jupiter/web test`: 2 files / 11 tests passed. API and Web typechecks and both production builds passed; `git diff --check` passed.
