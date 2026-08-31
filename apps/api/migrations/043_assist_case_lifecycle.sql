-- GOAL-043: independent Jupiter Assist lifecycle; ticket lifecycle is unchanged.
ALTER TABLE organization_assist_policies ADD COLUMN IF NOT EXISTS assist_sla_minutes integer NOT NULL DEFAULT 480 CHECK (assist_sla_minutes > 0);
CREATE TABLE assist_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL, requested_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_support_agent_user_id uuid REFERENCES jupiter_support_agents(user_id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('NOT_REQUESTED','REQUESTED','PENDING_APPROVAL','QUEUED','ACCEPTED','IN_PROGRESS','WAITING_FOR_ORGANIZATION','COMPLETED','CANCELLED','DECLINED')),
  request_note text CHECK (request_note IS NULL OR char_length(request_note)<=1000),
  accepted_at timestamptz, assist_sla_due_at timestamptz, completed_at timestamptz,
  capacity_settled_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id,ticket_id), UNIQUE(organization_id,id), FOREIGN KEY(organization_id,ticket_id) REFERENCES tickets(organization_id,id) ON DELETE CASCADE
);
CREATE TABLE assist_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assist_case_id uuid NOT NULL, support_agent_user_id uuid NOT NULL REFERENCES jupiter_support_agents(user_id) ON DELETE RESTRICT,
  duration_code text NOT NULL CHECK (duration_code IN ('TWO_HOURS','TWENTY_FOUR_HOURS','UNTIL_CASE_COMPLETION')),
  status text NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED','APPROVED','REJECTED','CANCELLED')),
  reviewed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL, reviewed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(organization_id,assist_case_id) REFERENCES assist_cases(organization_id,id) ON DELETE CASCADE
);
ALTER TABLE assist_cases ENABLE ROW LEVEL SECURITY; ALTER TABLE assist_access_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY assist_cases_tenant ON assist_cases USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
CREATE POLICY assist_access_requests_tenant ON assist_access_requests USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
GRANT SELECT,INSERT,UPDATE,DELETE ON assist_cases,assist_access_requests TO jupiter_app;
