-- GOAL-054: operational, cloud-governed Directory Connector state.
ALTER TABLE directory_connectors
  ADD COLUMN IF NOT EXISTS last_successful_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_failed_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS current_policy_version integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS host_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE directory_sync_runs ADD COLUMN IF NOT EXISTS mode text;
ALTER TABLE directory_sync_runs ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE directory_sync_runs ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE directory_sync_runs ADD COLUMN IF NOT EXISTS scope_policy_version integer;
ALTER TABLE directory_sync_runs ADD COLUMN IF NOT EXISTS mapping_version integer;
ALTER TABLE directory_sync_runs ADD COLUMN IF NOT EXISTS discovered_count integer NOT NULL DEFAULT 0;
ALTER TABLE directory_sync_runs ADD COLUMN IF NOT EXISTS create_count integer NOT NULL DEFAULT 0;
ALTER TABLE directory_sync_runs ADD COLUMN IF NOT EXISTS update_count integer NOT NULL DEFAULT 0;
ALTER TABLE directory_sync_runs ADD COLUMN IF NOT EXISTS suspend_count integer NOT NULL DEFAULT 0;
ALTER TABLE directory_sync_runs ADD COLUMN IF NOT EXISTS conflict_count integer NOT NULL DEFAULT 0;
ALTER TABLE directory_sync_runs ADD COLUMN IF NOT EXISTS unchanged_count integer NOT NULL DEFAULT 0;
ALTER TABLE directory_sync_runs ADD COLUMN IF NOT EXISTS out_of_scope_count integer NOT NULL DEFAULT 0;
ALTER TABLE directory_sync_runs ADD COLUMN IF NOT EXISTS failure_code text;
ALTER TABLE directory_sync_runs DROP CONSTRAINT IF EXISTS directory_sync_runs_status_check;
ALTER TABLE directory_sync_runs ADD CONSTRAINT directory_sync_runs_status_check CHECK(status IN ('QUEUED','RUNNING','SUCCEEDED','PARTIAL','FAILED','CANCELLED','PREVIEWED','APPLIED'));
ALTER TABLE directory_sync_runs DROP CONSTRAINT IF EXISTS directory_sync_runs_sync_kind_check;
ALTER TABLE directory_sync_runs ADD CONSTRAINT directory_sync_runs_sync_kind_check CHECK(sync_kind IN ('FULL','INCREMENTAL_SNAPSHOT','DELTA'));
UPDATE directory_sync_runs SET sync_kind='INCREMENTAL_SNAPSHOT' WHERE sync_kind='DELTA';
UPDATE directory_sync_runs SET status='SUCCEEDED',started_at=created_at,completed_at=COALESCE(applied_at,created_at) WHERE status='APPLIED';
UPDATE directory_sync_runs SET status='CANCELLED',started_at=created_at,completed_at=created_at WHERE status='PREVIEWED';

CREATE TABLE directory_scope_policies (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  scope_type text NOT NULL DEFAULT 'SELECTED_OUS' CHECK(scope_type IN ('ENTIRE_DIRECTORY','SELECTED_OUS','SELECTED_GROUPS')),
  selected_ou_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_group_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE directory_scope_catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connector_id uuid NOT NULL, generation integer NOT NULL CHECK(generation>0), item_type text NOT NULL CHECK(item_type IN ('OU','GROUP')),
  external_id text NOT NULL, display_name text NOT NULL, distinguished_name text, last_discovered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id,connector_id,item_type,external_id),
  FOREIGN KEY(organization_id,connector_id) REFERENCES directory_connectors(organization_id,id) ON DELETE CASCADE
);
CREATE TABLE directory_group_role_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  group_external_id text NOT NULL, role_code text NOT NULL CHECK(role_code IN ('REQUESTER','EXPERT','SUPERVISOR')),
  enabled boolean NOT NULL DEFAULT true, version integer NOT NULL DEFAULT 1, updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL, updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id,group_external_id,role_code)
);
CREATE TABLE directory_sync_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connector_id uuid NOT NULL, mode text NOT NULL CHECK(mode IN ('FULL','INCREMENTAL_SNAPSHOT')), status text NOT NULL DEFAULT 'QUEUED' CHECK(status IN ('QUEUED','CLAIMED','COMPLETED','FAILED','CANCELLED')),
  idempotency_key text NOT NULL, requested_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL, requested_at timestamptz NOT NULL DEFAULT now(), claimed_at timestamptz, completed_at timestamptz,
  UNIQUE(connector_id,idempotency_key), FOREIGN KEY(organization_id,connector_id) REFERENCES directory_connectors(organization_id,id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX directory_sync_commands_one_active ON directory_sync_commands(connector_id) WHERE status IN ('QUEUED','CLAIMED');
CREATE TABLE directory_sync_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connector_id uuid NOT NULL, external_object_id text NOT NULL, conflict_type text NOT NULL, details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','RESOLVED')), first_seen_at timestamptz NOT NULL DEFAULT now(), last_seen_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz,
  UNIQUE(organization_id,connector_id,external_object_id,conflict_type), FOREIGN KEY(organization_id,connector_id) REFERENCES directory_connectors(organization_id,id) ON DELETE CASCADE
);
CREATE INDEX directory_scope_catalog_lookup ON directory_scope_catalog_items(organization_id,connector_id,item_type,last_discovered_at DESC);
CREATE INDEX directory_sync_conflicts_lookup ON directory_sync_conflicts(organization_id,connector_id,status,last_seen_at DESC);

ALTER TABLE directory_scope_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_scope_catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_group_role_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_sync_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_sync_conflicts ENABLE ROW LEVEL SECURITY;
CREATE POLICY directory_scope_policies_tenant ON directory_scope_policies USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
CREATE POLICY directory_scope_catalog_items_tenant ON directory_scope_catalog_items USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
CREATE POLICY directory_group_role_mappings_tenant ON directory_group_role_mappings USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
CREATE POLICY directory_sync_commands_tenant ON directory_sync_commands USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
CREATE POLICY directory_sync_conflicts_tenant ON directory_sync_conflicts USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
GRANT SELECT,INSERT,UPDATE,DELETE ON directory_scope_policies,directory_scope_catalog_items,directory_group_role_mappings,directory_sync_commands,directory_sync_conflicts TO jupiter_app;
