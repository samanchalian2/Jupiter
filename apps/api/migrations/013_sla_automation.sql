CREATE TABLE business_calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  timezone text NOT NULL DEFAULT 'Asia/Tehran',
  workdays smallint[] NOT NULL DEFAULT ARRAY[1,2,3,4,5],
  start_minute integer NOT NULL DEFAULT 480 CHECK(start_minute BETWEEN 0 AND 1439),
  end_minute integer NOT NULL DEFAULT 1020 CHECK(end_minute BETWEEN 1 AND 1440),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(end_minute > start_minute)
);
ALTER TABLE sla_policies ADD COLUMN warning_minutes integer NOT NULL DEFAULT 30 CHECK(warning_minutes > 0);
ALTER TABLE sla_policies ADD COLUMN escalation_role text NOT NULL DEFAULT 'SUPERVISOR' CHECK(escalation_role IN ('SUPERVISOR','ORG_ADMIN'));
ALTER TABLE ticket_sla_clocks ADD COLUMN warning_at timestamptz;
ALTER TABLE ticket_sla_clocks ADD COLUMN escalated_at timestamptz;
ALTER TABLE business_calendars ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_calendars_tenant ON business_calendars USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
GRANT SELECT,INSERT,UPDATE,DELETE ON business_calendars TO jupiter_app;
