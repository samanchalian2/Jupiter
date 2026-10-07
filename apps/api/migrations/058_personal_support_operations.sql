-- GOAL-062: independent Personal Support operations and governed catalog.
CREATE TABLE personal_service_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9_]{3,64}$'),
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 120),
  description text NOT NULL CHECK (char_length(description) BETWEEN 2 AND 1000),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED')),
  sla_minutes integer NOT NULL DEFAULT 480 CHECK (sla_minutes BETWEEN 15 AND 43200),
  access_grant_minutes integer NOT NULL DEFAULT 1440 CHECK (access_grant_minutes BETWEEN 15 AND 43200),
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO personal_service_catalog(code,display_name,description,status,sla_minutes,access_grant_minutes)
VALUES(
  'PERSONAL_SUPPORT',
  'پشتیبانی شخصی Jupiter',
  'رسیدگی مستقیم کارشناسان Jupiter به درخواست پشتیبانی فضای شخصی',
  'ACTIVE',480,1440
);

CREATE TABLE personal_support_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL,
  requested_by_user_id uuid NOT NULL,
  service_code text NOT NULL REFERENCES personal_service_catalog(code) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'QUEUED' CHECK (
    status IN ('QUEUED','ACCEPTED','IN_PROGRESS','WAITING_FOR_USER','COMPLETED','CANCELLED','REJECTED','REVOKED')
  ),
  request_note text CHECK (request_note IS NULL OR char_length(request_note)<=1000),
  closure_note text CHECK (closure_note IS NULL OR char_length(closure_note)<=1000),
  assigned_support_agent_user_id uuid REFERENCES jupiter_support_agents(user_id) ON DELETE RESTRICT,
  sla_minutes_snapshot integer NOT NULL CHECK (sla_minutes_snapshot BETWEEN 15 AND 43200),
  access_grant_minutes_snapshot integer NOT NULL CHECK (access_grant_minutes_snapshot BETWEEN 15 AND 43200),
  accepted_at timestamptz,
  sla_due_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id,ticket_id),
  UNIQUE(organization_id,id),
  FOREIGN KEY(organization_id,ticket_id) REFERENCES tickets(organization_id,id) ON DELETE CASCADE,
  FOREIGN KEY(organization_id,requested_by_user_id) REFERENCES memberships(organization_id,user_id) ON DELETE RESTRICT
);

CREATE INDEX personal_support_cases_queue
  ON personal_support_cases(status,created_at);
CREATE INDEX personal_support_cases_owner
  ON personal_support_cases(organization_id,requested_by_user_id,created_at DESC);

ALTER TABLE support_access_grants
  ADD COLUMN grant_source text NOT NULL DEFAULT 'ORGANIZATION_ASSIST'
    CHECK (grant_source IN ('ORGANIZATION_ASSIST','PERSONAL_SUPPORT')),
  ADD COLUMN personal_support_case_id uuid,
  ADD CONSTRAINT support_access_grants_personal_case_fk
    FOREIGN KEY(organization_id,personal_support_case_id)
    REFERENCES personal_support_cases(organization_id,id) ON DELETE CASCADE,
  ADD CONSTRAINT support_access_grants_source_shape_check CHECK (
    (grant_source='ORGANIZATION_ASSIST' AND personal_support_case_id IS NULL)
    OR
    (grant_source='PERSONAL_SUPPORT' AND personal_support_case_id IS NOT NULL
      AND scope='ROUTED_ONLY' AND ticket_id IS NOT NULL
      AND department_id IS NULL AND category_id IS NULL)
  );

CREATE UNIQUE INDEX support_access_grants_personal_case_unique
  ON support_access_grants(personal_support_case_id)
  WHERE grant_source='PERSONAL_SUPPORT';

ALTER TABLE personal_support_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY personal_support_cases_tenant ON personal_support_cases
  USING (organization_id=app.current_organization_id())
  WITH CHECK (organization_id=app.current_organization_id());
GRANT SELECT,INSERT,UPDATE,DELETE ON personal_service_catalog,personal_support_cases TO jupiter_app;
