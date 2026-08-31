-- GOAL-042: commercial policy and delegated Jupiter support access foundation.
-- Assist workflow, queue and ticket lifecycle remain deliberately separate.
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS is_restricted boolean NOT NULL DEFAULT false;

CREATE TABLE jupiter_support_agents (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED')),
  enabled_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  enabled_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE organization_assist_policies (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  request_policy text NOT NULL DEFAULT 'DISABLED' CHECK (request_policy IN ('DISABLED','USER_REQUEST_ALLOWED','ADMIN_APPROVAL_REQUIRED','AUTO_OVERFLOW','ALWAYS_ROUTE')),
  default_access_scope text NOT NULL DEFAULT 'ROUTED_ONLY' CHECK (default_access_scope IN ('ROUTED_ONLY','SELECTED_SCOPE','FULL_SUPPORT')),
  capacity_units integer NOT NULL DEFAULT 0 CHECK (capacity_units >= 0),
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE support_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  support_agent_user_id uuid NOT NULL REFERENCES jupiter_support_agents(user_id) ON DELETE RESTRICT,
  scope text NOT NULL DEFAULT 'ROUTED_ONLY' CHECK (scope IN ('ROUTED_ONLY','SELECTED_SCOPE','FULL_SUPPORT')),
  ticket_id uuid,
  department_id uuid,
  category_id uuid,
  allows_restricted boolean NOT NULL DEFAULT false,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revoked_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > starts_at),
  CHECK (
    (scope='ROUTED_ONLY' AND ticket_id IS NOT NULL AND department_id IS NULL AND category_id IS NULL)
    OR (scope='SELECTED_SCOPE' AND ticket_id IS NULL AND (department_id IS NOT NULL OR category_id IS NOT NULL))
    OR (scope='FULL_SUPPORT' AND ticket_id IS NULL AND department_id IS NULL AND category_id IS NULL)
  ),
  CHECK (NOT allows_restricted OR (scope='ROUTED_ONLY' AND ticket_id IS NOT NULL)),
  FOREIGN KEY (organization_id,ticket_id) REFERENCES tickets(organization_id,id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id,department_id) REFERENCES departments(organization_id,id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id,category_id) REFERENCES categories(organization_id,id) ON DELETE RESTRICT
);
CREATE INDEX support_access_grants_lookup ON support_access_grants(organization_id,support_agent_user_id,expires_at) WHERE revoked_at IS NULL;

ALTER TABLE organization_assist_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_access_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY organization_assist_policies_tenant ON organization_assist_policies USING (organization_id=app.current_organization_id()) WITH CHECK (organization_id=app.current_organization_id());
CREATE POLICY support_access_grants_tenant ON support_access_grants USING (organization_id=app.current_organization_id()) WITH CHECK (organization_id=app.current_organization_id());
GRANT SELECT,INSERT,UPDATE,DELETE ON jupiter_support_agents,organization_assist_policies,support_access_grants TO jupiter_app;
