-- GOAL-053: package-backed, tenant-scoped Jupiter Assist capacity.
CREATE TABLE IF NOT EXISTS assist_capacity_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES commercial_products(id) ON DELETE RESTRICT,
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9_]{3,80}$'),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 160),
  included_units integer NOT NULL CHECK (included_units > 0),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED')),
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS organization_assist_capacity_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assist_capacity_package_id uuid REFERENCES assist_capacity_packages(id) ON DELETE RESTRICT,
  source text NOT NULL CHECK (source IN ('INCLUDED','PROMOTIONAL','MANUAL','LEGACY_MIGRATED','PURCHASED')),
  allocated_units integer NOT NULL CHECK (allocated_units > 0),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED','EXPIRED')),
  starts_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz,
  contract_reference text,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at IS NULL OR expires_at > starts_at),
  CHECK ((source='LEGACY_MIGRATED') OR expires_at IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_assist_legacy_capacity ON organization_assist_capacity_allocations(organization_id) WHERE source='LEGACY_MIGRATED';
CREATE INDEX IF NOT EXISTS idx_assist_capacity_select ON organization_assist_capacity_allocations(organization_id,status,starts_at,expires_at,created_at);
CREATE TABLE IF NOT EXISTS assist_capacity_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  allocation_id uuid NOT NULL REFERENCES organization_assist_capacity_allocations(id) ON DELETE RESTRICT,
  assist_case_id uuid REFERENCES assist_cases(id) ON DELETE RESTRICT,
  event_type text NOT NULL CHECK (event_type IN ('ALLOCATED','ADJUSTED','CONSUMED')),
  unit_delta integer NOT NULL CHECK (unit_delta <> 0),
  reason text, actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(), metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_assist_capacity_case_consumption ON assist_capacity_ledger(organization_id,assist_case_id) WHERE event_type='CONSUMED';
CREATE UNIQUE INDEX IF NOT EXISTS uq_assist_capacity_idempotency ON assist_capacity_ledger(organization_id,idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assist_capacity_ledger_report ON assist_capacity_ledger(organization_id,allocation_id,occurred_at DESC);

INSERT INTO commercial_products(code,name,status) VALUES
 ('ASSIST_ON_DEMAND','پشتیبانی موردی Jupiter','ACTIVE'), ('ASSIST_BACKUP','پشتیبانی پشتیبان Jupiter','ACTIVE')
ON CONFLICT (code) DO NOTHING;
INSERT INTO organization_assist_capacity_allocations(organization_id,source,allocated_units,status,starts_at,expires_at,contract_reference)
SELECT organization_id,'LEGACY_MIGRATED',capacity_units,'ACTIVE',created_at,NULL,'legacy-policy'
FROM organization_assist_policies WHERE capacity_units>0 ON CONFLICT DO NOTHING;
INSERT INTO assist_capacity_ledger(organization_id,allocation_id,event_type,unit_delta,reason,metadata)
SELECT a.organization_id,a.id,'ALLOCATED',a.allocated_units,'Legacy policy migration',jsonb_build_object('source','LEGACY_MIGRATED')
FROM organization_assist_capacity_allocations a
WHERE a.source='LEGACY_MIGRATED' AND NOT EXISTS (SELECT 1 FROM assist_capacity_ledger l WHERE l.allocation_id=a.id AND l.event_type='ALLOCATED');

ALTER TABLE assist_capacity_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_assist_capacity_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assist_capacity_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY assist_capacity_packages_read ON assist_capacity_packages FOR SELECT USING (true);
CREATE POLICY assist_capacity_allocations_tenant ON organization_assist_capacity_allocations USING (organization_id=app.current_organization_id()) WITH CHECK (organization_id=app.current_organization_id());
CREATE POLICY assist_capacity_ledger_tenant ON assist_capacity_ledger USING (organization_id=app.current_organization_id()) WITH CHECK (organization_id=app.current_organization_id());
GRANT SELECT ON assist_capacity_packages,organization_assist_capacity_allocations,assist_capacity_ledger TO jupiter_app;
GRANT INSERT,UPDATE ON organization_assist_capacity_allocations TO jupiter_app;
GRANT INSERT ON assist_capacity_ledger TO jupiter_app;
CREATE OR REPLACE FUNCTION forbid_assist_capacity_ledger_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- A deleted user is intentionally anonymized by its foreign-key action; the
  -- commercial event itself remains immutable and all other columns stay fixed.
  IF TG_OP='UPDATE' AND OLD.actor_user_id IS NOT NULL AND NEW.actor_user_id IS NULL
    AND (to_jsonb(NEW)-'actor_user_id') = (to_jsonb(OLD)-'actor_user_id') THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'assist capacity ledger is immutable';
END;
$$;
CREATE TRIGGER assist_capacity_ledger_immutable BEFORE UPDATE OR DELETE ON assist_capacity_ledger FOR EACH ROW EXECUTE FUNCTION forbid_assist_capacity_ledger_mutation();
