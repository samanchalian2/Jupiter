-- GOAL-040: allocation foundations only. Customer-facing consumption settles in GOAL-041.
ALTER TABLE commercial_addon_packages
  ADD COLUMN capability_code text NOT NULL DEFAULT 'UNASSIGNED' CHECK (capability_code ~ '^[A-Z0-9_.-]{2,120}$'),
  ADD COLUMN unit_count integer NOT NULL DEFAULT 0 CHECK (unit_count >= 0),
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE commercial_usage_allowances
  ADD COLUMN allocation_type text NOT NULL DEFAULT 'PERIODIC' CHECK (allocation_type IN ('PERIODIC','EMERGENCY')),
  ADD COLUMN idempotency_key uuid,
  ADD COLUMN created_by_user_id uuid REFERENCES users(id),
  ADD CONSTRAINT commercial_usage_allowances_organization_idempotency_key UNIQUE (organization_id,idempotency_key);

CREATE TABLE commercial_addon_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  addon_package_id uuid NOT NULL REFERENCES commercial_addon_packages(id) ON DELETE RESTRICT,
  capability_code text NOT NULL CHECK (capability_code ~ '^[A-Z0-9_.-]{2,120}$'),
  granted_units integer NOT NULL CHECK (granted_units > 0),
  idempotency_key uuid NOT NULL,
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id,idempotency_key)
);
ALTER TABLE commercial_addon_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY commercial_addon_allocations_tenant ON commercial_addon_allocations USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());

CREATE OR REPLACE FUNCTION app.prevent_commercial_usage_ledger_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'commercial_usage_ledger is immutable';
END;
$$;
CREATE TRIGGER commercial_usage_ledger_immutable BEFORE UPDATE ON commercial_usage_ledger FOR EACH ROW EXECUTE FUNCTION app.prevent_commercial_usage_ledger_mutation();

GRANT SELECT,INSERT,UPDATE,DELETE ON commercial_addon_allocations TO jupiter_app;
REVOKE UPDATE,DELETE ON commercial_usage_ledger FROM jupiter_app;
