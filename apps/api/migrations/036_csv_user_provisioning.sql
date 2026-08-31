CREATE TABLE organization_user_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  idempotency_key uuid NOT NULL,
  payload_hash text NOT NULL,
  result jsonb NOT NULL,
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id,idempotency_key)
);
ALTER TABLE organization_user_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY organization_user_imports_tenant ON organization_user_imports USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
GRANT SELECT,INSERT,UPDATE,DELETE ON organization_user_imports TO jupiter_app;
