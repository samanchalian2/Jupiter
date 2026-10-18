-- Principal-addressed operational inbox, independent of business memberships.
ALTER TABLE observability.alerts ADD COLUMN tenant_scope_key text GENERATED ALWAYS AS (COALESCE(tenant_reference,'')) STORED;
ALTER TABLE observability.alerts ADD CONSTRAINT observability_alert_scope_id UNIQUE(application_id,environment_id,id,tenant_scope_key);
CREATE TABLE observability.alert_inbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL,environment_id uuid NOT NULL,
 tenant_reference text,alert_id uuid NOT NULL,recipient_principal_id uuid NOT NULL REFERENCES observability.principals(id),
 tenant_scope_key text GENERATED ALWAYS AS (COALESCE(tenant_reference,'')) STORED,
 delivered_at timestamptz NOT NULL DEFAULT now(),read_at timestamptz,
 UNIQUE(alert_id,recipient_principal_id),
 FOREIGN KEY(application_id,environment_id,alert_id,tenant_scope_key) REFERENCES observability.alerts(application_id,environment_id,id,tenant_scope_key)
);
ALTER TABLE observability.alert_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE observability.alert_inbox FORCE ROW LEVEL SECURITY;
CREATE POLICY inbox_runtime ON observability.alert_inbox TO observability_runtime
 USING(observability.scope_allowed(application_id,environment_id,tenant_reference) AND recipient_principal_id::text=current_setting('obs.principal',true))
 WITH CHECK(observability.scope_allowed(application_id,environment_id,tenant_reference) AND recipient_principal_id::text=current_setting('obs.principal',true));
CREATE POLICY inbox_worker ON observability.alert_inbox TO observability_worker USING(true) WITH CHECK(true);
GRANT SELECT ON observability.alert_inbox TO observability_runtime;
GRANT UPDATE(read_at) ON observability.alert_inbox TO observability_runtime;
GRANT SELECT,INSERT ON observability.alert_inbox TO observability_worker;
CREATE INDEX observability_inbox_recipient ON observability.alert_inbox(recipient_principal_id,delivered_at DESC);
CREATE INDEX observability_inbox_alert ON observability.alert_inbox(application_id,environment_id,alert_id);
