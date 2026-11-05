# Organization application approval RLS remediation — 2026-11-05

Main API logs confirmed POST approve returned500: memberships INSERT violated RLS.
Main still runs fe64140; GOAL070 is Preview-only and was not promoted here.

Fix: transaction-local app.organization_id is set to the newly inserted tenant
before membership/roles writes. Platform transition Audit requires NULL scope,
then tenant provisioning Audit requires the new organization scope. No policy,
role, grant, schema, authentication or tenant boundary was relaxed.

Current source uses the shared SETUP provisioning helper; main received only the
equivalent scoped compiled-service hotfix, not an unapproved full GOAL070 release.
Original compiled file retained as .pre-rls-fix next to the main service module.
Only jupiter-main-api restarted; no Arandi database/service/config changes.

Validation:
- Regression setup-provisioning-rls.spec.ts PASS (1 test).
- API typecheck and API build PASS.
- Actual deployed service + runtime DB credentials transaction smoke PASS:
  temporary applicant/application → approve → owner/admin roles → same-key retry.
- Explicit ROLLBACK and absence of fixture organization confirmed PASS.
- Main readiness200 after initial restart; final readiness checked in handoff.
- No real customer application approved or modified by acceptance.
- Browser acceptance unavailable: browser automation disabled in Work settings.
- Full API/Web suites not run; no Web code or migration changed.

Server acceptance utility contains no credentials and reads only the existing
server environment file locally; it is removed after validation. No secrets
were written to evidence/repository. Existing unrelated working edits preserved.

## Follow-up — approved applicant shown an implicit new-request form

Production logs prove approval201 at09:44:29 and09:45:59 UTC; subsequent
create+submit201 at09:45:36 and09:46:39 are NEW applications, not rollback of
the approved application. The UI excluded APPROVED from `active` and treated
null as permission to render a new form; main also lacked an entry CTA.

Selection now prefers a pending application, then an approved organization.
Approved state hides the implicit new form and shows the organization entry
CTA. Another organization remains possible only through explicit intent.
Window focus refreshes account/application state. Existing pending requests
retain precedence; no history/duplicates/customer rows were deleted or merged.

Current-source Web63 tests/typecheck/build PASS; new regression covers approved
landing, explicit another-organization intent and four pending states. Main web
built from a detached fe64140 checkout with ONLY PublicOnboarding changes;
GOAL070 not promoted. Its TypeScript/Vite build PASS. Runtime JS
index-D4eTvBG8.js SHA2565807a071b6c1d2bfb2e2d848f61829f14daebfeace3dcd9861df0d38ee639c9a
matches local artifact. Public page and JS200; API active. Previous static tree
backed up at /srv/jupiter/approval-web-before-20261105.tar.gz; old hashed assets
retained for existing sessions. No service restart/database mutation for UI fix.
No authenticated browser acceptance claimed: Work browser automation unavailable.
