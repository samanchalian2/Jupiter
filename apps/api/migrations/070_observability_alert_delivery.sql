-- Delivery pagination/backpressure state; no change to business notifications.
ALTER TABLE observability.alerts ADD COLUMN delivery_cursor uuid;
ALTER TABLE observability.alerts ADD COLUMN delivery_completed_at timestamptz;
UPDATE observability.alerts a SET delivery_completed_at=j.completed_at FROM observability.jobs j
 WHERE j.application_id=a.application_id AND j.environment_id=a.environment_id
 AND j.kind='ALERT_DELIVERY' AND j.dedupe_key='alert:'||a.id::text AND j.status='SUCCEEDED';
CREATE INDEX observability_alert_job_scope ON observability.jobs(application_id,environment_id,available_at)
 WHERE kind='ALERT_DELIVERY';
