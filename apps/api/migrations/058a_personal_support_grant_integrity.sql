-- GOAL-062 hardening: a Personal Support grant must reference the exact case ticket.
ALTER TABLE personal_support_cases
  ADD CONSTRAINT personal_support_cases_grant_identity_unique
    UNIQUE(organization_id,id,ticket_id);

ALTER TABLE support_access_grants
  DROP CONSTRAINT support_access_grants_personal_case_fk,
  ADD CONSTRAINT support_access_grants_personal_case_fk
    FOREIGN KEY(organization_id,personal_support_case_id,ticket_id)
    REFERENCES personal_support_cases(organization_id,id,ticket_id) ON DELETE CASCADE;

REVOKE INSERT,UPDATE,DELETE ON personal_service_catalog FROM jupiter_app;
