-- GOAL-063: recurring and purchased capacity for personal SUPPORT and AI.
CREATE TABLE personal_allowance_policies (
  pool_code text PRIMARY KEY CHECK (pool_code IN ('SUPPORT','AI')),
  default_monthly_units integer NOT NULL CHECK (default_monthly_units BETWEEN 0 AND 1000000),
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO personal_allowance_policies(pool_code,default_monthly_units)
VALUES('SUPPORT',3),('AI',10);

CREATE TABLE personal_allowance_overrides (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pool_code text NOT NULL REFERENCES personal_allowance_policies(pool_code) ON DELETE RESTRICT,
  monthly_units integer NOT NULL CHECK (monthly_units BETWEEN 0 AND 1000000),
  updated_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(organization_id,pool_code)
);

CREATE TABLE personal_allowance_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pool_code text NOT NULL REFERENCES personal_allowance_policies(pool_code) ON DELETE RESTRICT,
  period_starts_at timestamptz NOT NULL,
  period_ends_at timestamptz NOT NULL,
  granted_units integer NOT NULL CHECK (granted_units BETWEEN 0 AND 1000000),
  policy_source text NOT NULL CHECK (policy_source IN ('DEFAULT','OVERRIDE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (period_ends_at>period_starts_at),
  UNIQUE(organization_id,pool_code,period_starts_at,period_ends_at),
  UNIQUE(organization_id,id)
);

CREATE TABLE personal_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9_]{3,64}$'),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  description text NOT NULL CHECK (char_length(description) BETWEEN 2 AND 1000),
  pool_code text NOT NULL REFERENCES personal_allowance_policies(pool_code) ON DELETE RESTRICT,
  unit_count integer NOT NULL CHECK (unit_count BETWEEN 1 AND 1000000),
  price_irt bigint NOT NULL CHECK (price_irt BETWEEN 0 AND 9000000000000000),
  validity_days integer NOT NULL DEFAULT 365 CHECK (validity_days BETWEEN 1 AND 1825),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','RETIRED')),
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE personal_package_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES personal_packages(id) ON DELETE RESTRICT,
  package_code_snapshot text NOT NULL,
  package_name_snapshot text NOT NULL,
  pool_code text NOT NULL REFERENCES personal_allowance_policies(pool_code) ON DELETE RESTRICT,
  granted_units integer NOT NULL CHECK (granted_units>0),
  price_irt_snapshot bigint NOT NULL CHECK (price_irt_snapshot>=0),
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REVOKED')),
  allocation_source text NOT NULL CHECK (allocation_source IN ('MANUAL','PAYMENT')),
  idempotency_key text NOT NULL CHECK (char_length(idempotency_key) BETWEEN 8 AND 200),
  allocation_reason text CHECK (allocation_reason IS NULL OR char_length(allocation_reason) BETWEEN 2 AND 1000),
  allocated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at>starts_at),
  UNIQUE(organization_id,idempotency_key),
  UNIQUE(organization_id,id)
);

CREATE TABLE personal_capacity_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pool_code text NOT NULL REFERENCES personal_allowance_policies(pool_code) ON DELETE RESTRICT,
  source text NOT NULL CHECK (source IN ('MONTHLY','PURCHASED')),
  allowance_window_id uuid,
  package_allocation_id uuid,
  subject_type text NOT NULL CHECK (subject_type IN ('SUPPORT_CASE','AI_ACTION')),
  subject_id uuid,
  idempotency_key text NOT NULL CHECK (char_length(idempotency_key) BETWEEN 8 AND 200),
  unit_count integer NOT NULL DEFAULT 1 CHECK (unit_count=1),
  status text NOT NULL DEFAULT 'RESERVED' CHECK (status IN ('RESERVED','SETTLED','RELEASED')),
  reserved_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz,
  released_at timestamptz,
  release_reason text CHECK (release_reason IS NULL OR char_length(release_reason) BETWEEN 2 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(organization_id,allowance_window_id)
    REFERENCES personal_allowance_windows(organization_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(organization_id,package_allocation_id)
    REFERENCES personal_package_allocations(organization_id,id) ON DELETE RESTRICT,
  CHECK (
    (source='MONTHLY' AND allowance_window_id IS NOT NULL AND package_allocation_id IS NULL)
    OR (source='PURCHASED' AND package_allocation_id IS NOT NULL AND allowance_window_id IS NULL)
  ),
  CHECK (
    (status='RESERVED' AND settled_at IS NULL AND released_at IS NULL)
    OR (status='SETTLED' AND settled_at IS NOT NULL AND released_at IS NULL)
    OR (status='RELEASED' AND settled_at IS NULL AND released_at IS NOT NULL)
  ),
  UNIQUE(organization_id,idempotency_key),
  UNIQUE(organization_id,id)
);

ALTER TABLE personal_support_cases
  ADD COLUMN capacity_reservation_id uuid,
  ADD CONSTRAINT personal_support_cases_capacity_reservation_fk
    FOREIGN KEY(organization_id,capacity_reservation_id)
    REFERENCES personal_capacity_reservations(organization_id,id) ON DELETE RESTRICT,
  ADD CONSTRAINT personal_support_cases_capacity_reservation_unique UNIQUE(capacity_reservation_id);

CREATE INDEX personal_allowance_windows_current
  ON personal_allowance_windows(organization_id,pool_code,period_ends_at);
CREATE INDEX personal_package_allocations_consumption
  ON personal_package_allocations(organization_id,pool_code,status,expires_at,created_at,id);
CREATE INDEX personal_capacity_reservations_source
  ON personal_capacity_reservations(organization_id,pool_code,status,source);
CREATE INDEX personal_capacity_reservations_subject
  ON personal_capacity_reservations(organization_id,subject_type,subject_id);

ALTER TABLE personal_allowance_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_allowance_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_package_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_capacity_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY personal_allowance_overrides_tenant ON personal_allowance_overrides
  USING (organization_id=app.current_organization_id())
  WITH CHECK (organization_id=app.current_organization_id());
CREATE POLICY personal_allowance_windows_tenant ON personal_allowance_windows
  USING (organization_id=app.current_organization_id())
  WITH CHECK (organization_id=app.current_organization_id());
CREATE POLICY personal_package_allocations_tenant ON personal_package_allocations
  USING (organization_id=app.current_organization_id())
  WITH CHECK (organization_id=app.current_organization_id());
CREATE POLICY personal_capacity_reservations_tenant ON personal_capacity_reservations
  USING (organization_id=app.current_organization_id())
  WITH CHECK (organization_id=app.current_organization_id());

GRANT SELECT ON personal_allowance_policies,personal_packages TO jupiter_app;
GRANT SELECT ON personal_allowance_overrides TO jupiter_app;
GRANT SELECT,INSERT ON personal_allowance_windows TO jupiter_app;
GRANT SELECT ON personal_package_allocations TO jupiter_app;
GRANT SELECT,INSERT,UPDATE ON personal_capacity_reservations TO jupiter_app;
REVOKE UPDATE,DELETE ON personal_allowance_windows FROM jupiter_app;
