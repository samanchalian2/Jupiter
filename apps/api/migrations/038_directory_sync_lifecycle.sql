-- GOAL-037: tenant-safe directory synchronization lifecycle.  Directory
-- credentials never enter these tables; the connector supplies only approved
-- identity attributes over its paired outbound HTTPS channel.
ALTER TABLE directory_connectors
  ADD COLUMN version text,
  ADD COLUMN last_heartbeat_at timestamptz,
  ADD COLUMN last_sync_at timestamptz,
  ADD COLUMN last_sync_status text CHECK (last_sync_status IN ('SUCCEEDED','FAILED','PREVIEWED')),
  ADD COLUMN last_error_code text;

CREATE TABLE directory_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connector_id uuid NOT NULL,
  request_id uuid NOT NULL,
  sync_kind text NOT NULL CHECK (sync_kind IN ('FULL','DELTA')),
  status text NOT NULL CHECK (status IN ('PREVIEWED','APPLIED','FAILED')),
  scope_fingerprint text NOT NULL CHECK (char_length(scope_fingerprint) BETWEEN 8 AND 256),
  plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz,
  UNIQUE(organization_id,id),
  UNIQUE(connector_id,request_id),
  FOREIGN KEY (organization_id,connector_id) REFERENCES directory_connectors(organization_id,id) ON DELETE CASCADE,
  CHECK ((status='APPLIED') = (applied_at IS NOT NULL))
);

CREATE TABLE directory_connector_nonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connector_id uuid NOT NULL,
  nonce_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(connector_id,nonce_hash),
  FOREIGN KEY (organization_id,connector_id) REFERENCES directory_connectors(organization_id,id) ON DELETE CASCADE
);

CREATE TABLE directory_principal_role_grants (
  directory_principal_id uuid NOT NULL REFERENCES directory_principals(id) ON DELETE CASCADE,
  membership_id uuid NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(directory_principal_id,role_id)
);

CREATE INDEX directory_sync_runs_connector_lookup ON directory_sync_runs(organization_id,connector_id,created_at DESC);
CREATE INDEX directory_connector_nonces_expiry ON directory_connector_nonces(expires_at);

ALTER TABLE directory_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_connector_nonces ENABLE ROW LEVEL SECURITY;
CREATE POLICY directory_sync_runs_tenant ON directory_sync_runs
  USING (organization_id=app.current_organization_id()) WITH CHECK (organization_id=app.current_organization_id());
CREATE POLICY directory_connector_nonces_tenant ON directory_connector_nonces
  USING (organization_id=app.current_organization_id()) WITH CHECK (organization_id=app.current_organization_id());
GRANT SELECT,INSERT,UPDATE,DELETE ON directory_sync_runs,directory_connector_nonces,directory_principal_role_grants TO jupiter_app;
