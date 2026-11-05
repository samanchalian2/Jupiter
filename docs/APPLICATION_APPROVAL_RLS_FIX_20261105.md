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
- API typecheck PASS; API build run separately (see handoff).
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
