-- Fixed operational counters only; no payload, identity or business accounting.
CREATE TABLE observability.health_reports (
 application_id uuid NOT NULL,environment_id uuid NOT NULL,report_id uuid NOT NULL,
 tenant_reference text,provenance text NOT NULL CHECK(provenance IN ('SERVER_MEASURED','CLIENT_REPORTED','SERVER_SDK_REPORTED')),
 observed_at timestamptz NOT NULL,received_at timestamptz NOT NULL DEFAULT now(),payload_hash text NOT NULL,
 received_events integer NOT NULL DEFAULT 0 CHECK(received_events BETWEEN 0 AND 1000000000),
 accepted_events integer NOT NULL DEFAULT 0 CHECK(accepted_events BETWEEN 0 AND 1000000000),
 duplicate_events integer NOT NULL DEFAULT 0 CHECK(duplicate_events BETWEEN 0 AND 1000000000),
 rejected_events integer NOT NULL DEFAULT 0 CHECK(rejected_events BETWEEN 0 AND 1000000000),
 retryable_events integer NOT NULL DEFAULT 0 CHECK(retryable_events BETWEEN 0 AND 1000000000),
 failed_batches integer NOT NULL DEFAULT 0 CHECK(failed_batches BETWEEN 0 AND 1000000000),
 dropped_events integer NOT NULL DEFAULT 0 CHECK(dropped_events BETWEEN 0 AND 1000000000),
 recovered_events integer NOT NULL DEFAULT 0 CHECK(recovered_events BETWEEN 0 AND 1000000000),
 recovery_failed_events integer NOT NULL DEFAULT 0 CHECK(recovery_failed_events BETWEEN 0 AND 1000000000),
 PRIMARY KEY(application_id,environment_id,report_id),
 FOREIGN KEY(application_id,environment_id) REFERENCES observability.environments(application_id,id),
 CHECK(provenance='SERVER_MEASURED' OR received_events+accepted_events+duplicate_events+rejected_events+retryable_events+failed_batches=0),
 CHECK(provenance<>'SERVER_MEASURED' OR dropped_events+recovered_events+recovery_failed_events=0)
);
CREATE INDEX observability_health_scope_time ON observability.health_reports(application_id,environment_id,observed_at);
CREATE INDEX observability_health_receipt_expiry ON observability.health_reports(application_id,environment_id,received_at);
CREATE TABLE observability.storage_samples (
 application_id uuid NOT NULL,environment_id uuid NOT NULL,bucket_start timestamptz NOT NULL,
 measured_at timestamptz NOT NULL DEFAULT now(),logical_bytes bigint NOT NULL CHECK(logical_bytes>=0),
 PRIMARY KEY(application_id,environment_id,bucket_start),
 FOREIGN KEY(application_id,environment_id) REFERENCES observability.environments(application_id,id)
);
ALTER TABLE observability.health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE observability.health_reports FORCE ROW LEVEL SECURITY;
CREATE POLICY health_scope ON observability.health_reports TO observability_runtime,observability_worker
 USING(observability.scope_allowed(application_id,environment_id,tenant_reference)) WITH CHECK(observability.scope_allowed(application_id,environment_id,tenant_reference));
ALTER TABLE observability.storage_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE observability.storage_samples FORCE ROW LEVEL SECURITY;
CREATE POLICY storage_scope ON observability.storage_samples TO observability_runtime,observability_worker
 USING(observability.scope_allowed(application_id,environment_id)) WITH CHECK(observability.scope_allowed(application_id,environment_id));
GRANT SELECT ON observability.health_reports,observability.storage_samples TO observability_runtime;
GRANT SELECT,INSERT,DELETE ON observability.health_reports,observability.storage_samples TO observability_worker;
