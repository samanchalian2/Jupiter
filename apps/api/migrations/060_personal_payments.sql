-- GOAL-064: provider-neutral personal payment orders and exact-once fulfillment.
CREATE TABLE personal_payment_settings (
  provider_code text PRIMARY KEY CHECK (provider_code='ZARINPAL'),
  availability text NOT NULL DEFAULT 'DISABLED' CHECK (availability IN ('DISABLED','ENABLED')),
  mode text NOT NULL DEFAULT 'LOCAL_TEST' CHECK (mode IN ('LOCAL_TEST','LIVE')),
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO personal_payment_settings(provider_code) VALUES('ZARINPAL');

CREATE TABLE personal_payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  package_id uuid NOT NULL REFERENCES personal_packages(id) ON DELETE RESTRICT,
  package_code_snapshot text NOT NULL,
  package_name_snapshot text NOT NULL,
  pool_code text NOT NULL CHECK (pool_code IN ('SUPPORT','AI')),
  unit_count_snapshot integer NOT NULL CHECK (unit_count_snapshot>0),
  amount_irt_snapshot bigint NOT NULL CHECK (amount_irt_snapshot>0),
  currency text NOT NULL DEFAULT 'IRT' CHECK (currency='IRT'),
  validity_days_snapshot integer NOT NULL CHECK (validity_days_snapshot BETWEEN 1 AND 1825),
  provider_code text NOT NULL CHECK (provider_code='ZARINPAL'),
  provider_mode text NOT NULL CHECK (provider_mode IN ('LOCAL_TEST','LIVE')),
  provider_authority text,
  provider_reference text,
  idempotency_key text NOT NULL CHECK (char_length(idempotency_key) BETWEEN 8 AND 200),
  status text NOT NULL DEFAULT 'CREATED'
    CHECK (status IN ('CREATED','CREATING','PENDING','VERIFYING','PAID','FAILED','CANCELLED','EXPIRED')),
  expires_at timestamptz NOT NULL,
  paid_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status='PAID' AND paid_at IS NOT NULL AND provider_reference IS NOT NULL) OR status<>'PAID'),
  UNIQUE(organization_id,idempotency_key),
  UNIQUE(organization_id,id),
  UNIQUE(provider_code,provider_authority)
);

CREATE TABLE personal_payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  order_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('CREATE','VERIFY')),
  outcome text NOT NULL CHECK (outcome IN ('REQUESTED','SUCCEEDED','FAILED')),
  provider_code text NOT NULL CHECK (provider_code='ZARINPAL'),
  provider_result_code text,
  failure_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(organization_id,order_id)
    REFERENCES personal_payment_orders(organization_id,id) ON DELETE RESTRICT
);

CREATE TABLE personal_payment_fulfillments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  order_id uuid NOT NULL,
  allocation_id uuid NOT NULL,
  fulfilled_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(organization_id,order_id)
    REFERENCES personal_payment_orders(organization_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(organization_id,allocation_id)
    REFERENCES personal_package_allocations(organization_id,id) ON DELETE RESTRICT,
  UNIQUE(order_id),
  UNIQUE(allocation_id)
);

CREATE TABLE personal_payment_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  order_id uuid NOT NULL,
  amount_irt bigint NOT NULL CHECK (amount_irt>0),
  external_reference text NOT NULL CHECK (char_length(external_reference) BETWEEN 2 AND 200),
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 2 AND 1000),
  recorded_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(organization_id,order_id)
    REFERENCES personal_payment_orders(organization_id,id) ON DELETE RESTRICT,
  UNIQUE(order_id,external_reference)
);

CREATE INDEX personal_payment_orders_owner ON personal_payment_orders(organization_id,owner_user_id,created_at DESC);
CREATE INDEX personal_payment_orders_operations ON personal_payment_orders(status,expires_at);
CREATE INDEX personal_payment_attempts_order ON personal_payment_attempts(organization_id,order_id,created_at);
CREATE INDEX personal_payment_refunds_order ON personal_payment_refunds(organization_id,order_id,created_at);

ALTER TABLE personal_payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_payment_fulfillments ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_payment_refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY personal_payment_orders_tenant ON personal_payment_orders
  USING (organization_id=app.current_organization_id())
  WITH CHECK (organization_id=app.current_organization_id());
CREATE POLICY personal_payment_attempts_tenant ON personal_payment_attempts
  USING (organization_id=app.current_organization_id())
  WITH CHECK (organization_id=app.current_organization_id());
CREATE POLICY personal_payment_fulfillments_tenant ON personal_payment_fulfillments
  USING (organization_id=app.current_organization_id())
  WITH CHECK (organization_id=app.current_organization_id());
CREATE POLICY personal_payment_refunds_tenant ON personal_payment_refunds
  USING (organization_id=app.current_organization_id())
  WITH CHECK (organization_id=app.current_organization_id());

GRANT SELECT ON personal_payment_settings TO jupiter_app;
GRANT SELECT ON personal_payment_orders,personal_payment_attempts,
  personal_payment_fulfillments,personal_payment_refunds TO jupiter_app;
REVOKE INSERT,UPDATE,DELETE ON personal_payment_orders,personal_payment_attempts,
  personal_payment_fulfillments,personal_payment_refunds FROM jupiter_app;
