-- Operational maintenance only; no business/security Audit deletion permission.
CREATE TABLE observability.maintenance_state (
 application_id uuid NOT NULL,environment_id uuid NOT NULL,
 last_completed_at timestamptz,last_counts jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(last_counts)='object' AND octet_length(last_counts::text)<=2048),
 PRIMARY KEY(application_id,environment_id),
 FOREIGN KEY(application_id,environment_id) REFERENCES observability.environments(application_id,id)
);
ALTER TABLE observability.maintenance_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE observability.maintenance_state FORCE ROW LEVEL SECURITY;
CREATE POLICY maintenance_scope ON observability.maintenance_state TO observability_runtime,observability_worker
 USING(observability.scope_allowed(application_id,environment_id)) WITH CHECK(observability.scope_allowed(application_id,environment_id));
GRANT SELECT ON observability.maintenance_state TO observability_runtime;
GRANT SELECT,INSERT,UPDATE ON observability.maintenance_state TO observability_worker;
GRANT DELETE ON observability.alert_inbox TO observability_worker;
-- Bounded child purges must not scan all histories for each parent.
CREATE INDEX observability_incident_activity_parent ON observability.incident_activity(application_id,environment_id,incident_id,created_at);
CREATE INDEX observability_feedback_replies_parent ON observability.feedback_replies(application_id,environment_id,feedback_id,created_at);
CREATE INDEX observability_receipts_expiry ON observability.ingestion_receipts(application_id,environment_id,received_at,event_id);
CREATE INDEX observability_jobs_event_active ON observability.jobs(application_id,environment_id,event_id) WHERE status IN ('PENDING','RUNNING');
CREATE INDEX observability_jobs_terminal_time ON observability.jobs(application_id,environment_id,completed_at,id) WHERE status IN ('SUCCEEDED','FAILED');
CREATE INDEX observability_incidents_retention ON observability.incidents(application_id,environment_id,updated_at,id) WHERE status IN ('RESOLVED','IGNORED','FALSE_POSITIVE');
CREATE INDEX observability_feedback_retention ON observability.feedback(application_id,environment_id,updated_at,id) WHERE status IN ('RESOLVED','CLOSED');
