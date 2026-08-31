CREATE TABLE directory_connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 120),
  status text NOT NULL DEFAULT 'UNPAIRED' CHECK (status IN ('UNPAIRED','PAIRED','REVOKED')),
  device_id uuid UNIQUE,
  device_token_hash text,
  paired_at timestamptz,
  last_seen_at timestamptz,
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id,id),
  CHECK ((status = 'PAIRED') = (device_id IS NOT NULL AND device_token_hash IS NOT NULL AND paired_at IS NOT NULL)),
  CHECK (status <> 'REVOKED' OR device_token_hash IS NULL)
);

CREATE TABLE directory_connector_pairings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connector_id uuid NOT NULL,
  pairing_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id,connector_id) REFERENCES directory_connectors(organization_id,id) ON DELETE CASCADE,
  CHECK (expires_at > created_at)
);

CREATE INDEX directory_connectors_organization_lookup ON directory_connectors(organization_id,created_at DESC);
CREATE INDEX directory_connector_pairings_active_lookup ON directory_connector_pairings(organization_id,connector_id,expires_at DESC) WHERE consumed_at IS NULL;

ALTER TABLE directory_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_connector_pairings ENABLE ROW LEVEL SECURITY;
CREATE POLICY directory_connectors_tenant ON directory_connectors
  USING (organization_id=app.current_organization_id()) WITH CHECK (organization_id=app.current_organization_id());
CREATE POLICY directory_connector_pairings_tenant ON directory_connector_pairings
  USING (organization_id=app.current_organization_id()) WITH CHECK (organization_id=app.current_organization_id());
GRANT SELECT,INSERT,UPDATE,DELETE ON directory_connectors,directory_connector_pairings TO jupiter_app;
