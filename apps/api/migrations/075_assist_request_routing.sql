-- Nullable preserves all existing organization policy behavior until explicit consent.
ALTER TABLE organization_assist_policies ADD COLUMN self_service_enabled boolean;
ALTER TABLE assist_cases ADD COLUMN ticket_only_delegation boolean NOT NULL DEFAULT false;
ALTER TABLE assist_cases ADD CONSTRAINT assist_cases_grant_identity UNIQUE(organization_id,id,ticket_id);
ALTER TABLE support_access_grants ADD COLUMN assist_case_id uuid;
ALTER TABLE support_access_grants ADD CONSTRAINT support_grant_assist_case_tenant
  FOREIGN KEY (organization_id,assist_case_id,ticket_id) REFERENCES assist_cases(organization_id,id,ticket_id) ON DELETE CASCADE;
ALTER TABLE support_access_grants ADD CONSTRAINT support_grant_assist_case_scope
  CHECK (assist_case_id IS NULL OR (grant_source='ORGANIZATION_ASSIST' AND scope='ROUTED_ONLY' AND ticket_id IS NOT NULL AND NOT allows_restricted));
CREATE UNIQUE INDEX support_grant_assist_case_agent ON support_access_grants(organization_id,assist_case_id,support_agent_user_id) WHERE assist_case_id IS NOT NULL;

CREATE TABLE ticket_submission_receipts (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_key uuid NOT NULL,
  request_hash text NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(organization_id,user_id,request_key)
);
ALTER TABLE ticket_submission_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY ticket_submission_receipts_tenant ON ticket_submission_receipts
  USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
GRANT SELECT,INSERT ON ticket_submission_receipts TO jupiter_app;
