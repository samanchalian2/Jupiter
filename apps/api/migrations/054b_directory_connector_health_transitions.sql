CREATE TABLE directory_connector_health_transitions (
  connector_id uuid PRIMARY KEY REFERENCES directory_connectors(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  last_notified_health text,
  changed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE directory_connector_health_transitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY directory_connector_health_transitions_tenant ON directory_connector_health_transitions USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
GRANT SELECT,INSERT,UPDATE,DELETE ON directory_connector_health_transitions TO jupiter_app;
