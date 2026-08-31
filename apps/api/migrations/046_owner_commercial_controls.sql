ALTER TABLE commercial_smart_actions DROP CONSTRAINT IF EXISTS commercial_smart_actions_reservation_source_check;
ALTER TABLE commercial_smart_actions ADD CONSTRAINT commercial_smart_actions_reservation_source_check CHECK(reservation_source IN ('PERIODIC','ADDON','EMERGENCY','OVERAGE'));

CREATE TABLE commercial_overage_policies (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  capability_code text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  limit_units integer NOT NULL DEFAULT 0 CHECK(limit_units >= 0),
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(organization_id, capability_code)
);

CREATE TABLE commercial_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  request_type text NOT NULL CHECK(request_type IN ('ADDON','RENEWAL','SERVICE_ACTIVATION')),
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED','APPLIED')),
  capability_code text,
  requested_units integer CHECK(requested_units IS NULL OR requested_units > 0),
  subscription_id uuid REFERENCES commercial_subscriptions(id) ON DELETE SET NULL,
  addon_package_id uuid REFERENCES commercial_addon_packages(id) ON DELETE SET NULL,
  product_id uuid REFERENCES commercial_products(id) ON DELETE SET NULL,
  request_note text,
  decision_note text,
  apply_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key uuid NOT NULL,
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  applied_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, idempotency_key)
);
CREATE INDEX commercial_requests_queue ON commercial_requests(status, created_at);
CREATE INDEX commercial_requests_tenant ON commercial_requests(organization_id, created_at DESC);

CREATE TABLE commercial_notification_marks (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  alert_code text NOT NULL,
  capability_code text NOT NULL DEFAULT '',
  window_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(organization_id, alert_code, capability_code, window_key)
);

ALTER TABLE user_notifications ALTER COLUMN ticket_id DROP NOT NULL;

ALTER TABLE commercial_overage_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_notification_marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY commercial_overage_policies_tenant ON commercial_overage_policies USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
CREATE POLICY commercial_requests_tenant ON commercial_requests USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
CREATE POLICY commercial_notification_marks_tenant ON commercial_notification_marks USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
GRANT SELECT,INSERT,UPDATE,DELETE ON commercial_overage_policies,commercial_requests,commercial_notification_marks TO jupiter_app;
