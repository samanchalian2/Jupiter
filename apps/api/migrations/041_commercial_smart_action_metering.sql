CREATE TABLE commercial_smart_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  capability_code text NOT NULL CHECK (capability_code ~ '^[A-Z0-9_.-]{2,120}$'),
  idempotency_key uuid NOT NULL,
  unit_count integer NOT NULL DEFAULT 1 CHECK (unit_count > 0),
  reservation_source text NOT NULL CHECK (reservation_source IN ('PERIODIC','ADDON','EMERGENCY')),
  status text NOT NULL CHECK (status IN ('RESERVED','SETTLED','RELEASED')),
  delivery_reference uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz,
  released_at timestamptz,
  UNIQUE(organization_id,idempotency_key)
);
ALTER TABLE commercial_smart_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY commercial_smart_actions_tenant ON commercial_smart_actions USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
GRANT SELECT,INSERT,UPDATE ON commercial_smart_actions TO jupiter_app;
