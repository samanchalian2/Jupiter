-- Platform and public audit events intentionally have no organization. Treat
-- that NULL as the platform scope while preserving strict tenant isolation.
DROP POLICY IF EXISTS audit_logs_tenant ON audit_logs;
CREATE POLICY audit_logs_tenant ON audit_logs
  USING (organization_id IS NOT DISTINCT FROM app.current_organization_id())
  WITH CHECK (organization_id IS NOT DISTINCT FROM app.current_organization_id());
