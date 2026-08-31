-- GOAL-052: recurring, shared organizational Smart Action capacity.
CREATE TABLE commercial_allowance_policies (
  pool_code text PRIMARY KEY CHECK(pool_code ~ '^[A-Z0-9_.-]{2,120}$'),
  default_periodic_units integer NOT NULL CHECK(default_periodic_units >= 0),
  default_emergency_units integer NOT NULL CHECK(default_emergency_units >= 0),
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO commercial_allowance_policies(pool_code,default_periodic_units,default_emergency_units)
VALUES('AI_SMART_ACTIONS',25,3) ON CONFLICT(pool_code) DO NOTHING;

CREATE TABLE organization_allowance_policy_overrides (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pool_code text NOT NULL REFERENCES commercial_allowance_policies(pool_code) ON DELETE RESTRICT,
  periodic_units integer CHECK(periodic_units IS NULL OR periodic_units >= 0),
  emergency_units integer CHECK(emergency_units IS NULL OR emergency_units >= 0),
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(organization_id,pool_code),
  CHECK(periodic_units IS NOT NULL OR emergency_units IS NOT NULL)
);

ALTER TABLE commercial_usage_allowances ADD COLUMN allowance_pool_code text;
UPDATE commercial_usage_allowances SET allowance_pool_code=capability_code WHERE allowance_pool_code IS NULL;
ALTER TABLE commercial_usage_allowances ALTER COLUMN allowance_pool_code SET NOT NULL;
ALTER TABLE commercial_usage_allowances ADD COLUMN allocation_origin text NOT NULL DEFAULT 'LEGACY' CHECK(allocation_origin IN ('LEGACY','POLICY','MANUAL'));
CREATE UNIQUE INDEX commercial_usage_allowances_policy_window_unique ON commercial_usage_allowances(organization_id,allowance_pool_code,allocation_type,period_starts_at,period_ends_at) WHERE allocation_origin='POLICY';

ALTER TABLE commercial_addon_allocations ADD COLUMN allowance_pool_code text;
UPDATE commercial_addon_allocations SET allowance_pool_code=capability_code WHERE allowance_pool_code IS NULL;
ALTER TABLE commercial_addon_allocations ALTER COLUMN allowance_pool_code SET NOT NULL;
ALTER TABLE commercial_addon_allocations ADD COLUMN expires_at timestamptz;
UPDATE commercial_addon_allocations SET expires_at=created_at+interval '12 months' WHERE expires_at IS NULL;
ALTER TABLE commercial_addon_allocations ALTER COLUMN expires_at SET NOT NULL;
CREATE INDEX commercial_addon_allocations_active_pool_idx ON commercial_addon_allocations(organization_id,allowance_pool_code,expires_at);

ALTER TABLE commercial_smart_actions ADD COLUMN allowance_pool_code text;
UPDATE commercial_smart_actions SET allowance_pool_code=capability_code WHERE allowance_pool_code IS NULL;
ALTER TABLE commercial_smart_actions ALTER COLUMN allowance_pool_code SET NOT NULL;
CREATE INDEX commercial_smart_actions_pool_usage_idx ON commercial_smart_actions(organization_id,allowance_pool_code,reservation_source,status);

ALTER TABLE organization_allowance_policy_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY organization_allowance_policy_overrides_tenant ON organization_allowance_policy_overrides USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
GRANT SELECT,INSERT,UPDATE,DELETE ON commercial_allowance_policies,organization_allowance_policy_overrides TO jupiter_app;
