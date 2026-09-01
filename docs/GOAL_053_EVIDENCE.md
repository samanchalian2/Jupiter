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
