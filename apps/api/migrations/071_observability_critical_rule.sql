-- Additive operational rule: only trusted SERVER/WORKER critical events qualify.
ALTER TABLE observability.monitoring_rules DROP CONSTRAINT monitoring_rules_code_check;
ALTER TABLE observability.monitoring_rules ADD CONSTRAINT monitoring_rules_code_check
 CHECK(code IN ('ERROR_BURST','ERROR_RATE','RELEASE_REGRESSION','BUSINESS_FAILURE','SLOW_OPERATION','WORKER_FAILURE','CONNECTIVITY_FAILURE','USER_IMPACT','ISSUE_REOPENED','CRITICAL_EVENT'));
INSERT INTO observability.monitoring_rules(application_id,code,threshold,minimum_samples)
 SELECT id,'CRITICAL_EVENT',1,1 FROM observability.applications
 ON CONFLICT(application_id,code) DO NOTHING;
CREATE INDEX observability_pipeline_failures
 ON observability.jobs(completed_at,application_id,environment_id)
 WHERE status='FAILED' AND kind IN ('AGGREGATE','RULE_EVALUATION','ALERT_DELIVERY','RETENTION');
