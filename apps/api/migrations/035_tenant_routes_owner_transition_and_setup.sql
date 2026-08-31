-- GOAL-034: resumable setup for newly provisioned tenants. Existing tenants
-- are deliberately not initialized here and require explicit owner assignment.
CREATE TABLE organization_setup_progress (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  confirmed_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE organization_setup_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY organization_setup_progress_tenant ON organization_setup_progress
  USING (organization_id=app.current_organization_id())
  WITH CHECK (organization_id=app.current_organization_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_setup_progress TO jupiter_app;
