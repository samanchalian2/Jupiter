-- GOAL-069 operational state; independent of ticketing/commercial tables.
ALTER TABLE observability.events ADD COLUMN tenant_scope_key text GENERATED ALWAYS AS (COALESCE(tenant_reference,'')) STORED;
ALTER TABLE observability.events ADD CONSTRAINT observability_event_scope UNIQUE(application_id,environment_id,event_id,tenant_scope_key);
CREATE TABLE observability.issues (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL,environment_id uuid NOT NULL,tenant_reference text,
 tenant_scope_key text GENERATED ALWAYS AS (COALESCE(tenant_reference,'')) STORED,
 fingerprint text NOT NULL,fingerprint_version integer NOT NULL,
 title text NOT NULL CHECK(char_length(title) BETWEEN 1 AND 2000),
 status text NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','INVESTIGATING','RESOLVED','IGNORED','REOPENED')),
 severity text NOT NULL CHECK(severity IN ('DEBUG','INFO','WARNING','ERROR','CRITICAL')),
 first_seen timestamptz NOT NULL,last_seen timestamptz NOT NULL,occurrence_count bigint NOT NULL DEFAULT 0,
 assigned_principal_id uuid REFERENCES observability.principals(id),resolved_at timestamptz,regression_count integer NOT NULL DEFAULT 0,
 UNIQUE(application_id,environment_id,tenant_scope_key,fingerprint),UNIQUE(application_id,environment_id,id,tenant_scope_key),
 FOREIGN KEY(application_id,environment_id) REFERENCES observability.environments(application_id,id)
);
CREATE TABLE observability.issue_events (
 application_id uuid NOT NULL,environment_id uuid NOT NULL,tenant_reference text,issue_id uuid NOT NULL,event_id uuid NOT NULL,
 tenant_scope_key text GENERATED ALWAYS AS (COALESCE(tenant_reference,'')) STORED,
 PRIMARY KEY(application_id,environment_id,event_id),
 FOREIGN KEY(application_id,environment_id,issue_id,tenant_scope_key) REFERENCES observability.issues(application_id,environment_id,id,tenant_scope_key),
 FOREIGN KEY(application_id,environment_id,event_id,tenant_scope_key) REFERENCES observability.events(application_id,environment_id,event_id,tenant_scope_key) ON DELETE CASCADE
);
CREATE TABLE observability.incidents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL,environment_id uuid NOT NULL,tenant_reference text,
 tenant_scope_key text GENERATED ALWAYS AS (COALESCE(tenant_reference,'')) STORED,
 issue_id uuid NOT NULL,title text NOT NULL CHECK(char_length(title) BETWEEN 1 AND 2000),
 status text NOT NULL DEFAULT 'NEW' CHECK(status IN ('NEW','TRIAGED','INVESTIGATING','MITIGATED','RESOLVED','REOPENED','IGNORED','FALSE_POSITIVE')),
 severity text NOT NULL,impact jsonb NOT NULL DEFAULT '{}' CHECK(octet_length(impact::text)<=4096),
 assigned_principal_id uuid REFERENCES observability.principals(id),
 rule_code text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),resolved_at timestamptz,
 UNIQUE(application_id,environment_id,id,tenant_scope_key),
 FOREIGN KEY(application_id,environment_id,issue_id,tenant_scope_key) REFERENCES observability.issues(application_id,environment_id,id,tenant_scope_key)
);
CREATE UNIQUE INDEX observability_active_incident ON observability.incidents(application_id,environment_id,issue_id,rule_code) WHERE status NOT IN ('RESOLVED','IGNORED','FALSE_POSITIVE');
CREATE TABLE observability.incident_activity (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL,environment_id uuid NOT NULL,tenant_reference text,
 tenant_scope_key text GENERATED ALWAYS AS (COALESCE(tenant_reference,'')) STORED,
 incident_id uuid NOT NULL,actor_principal_id uuid REFERENCES observability.principals(id),kind text NOT NULL,
 reason text NOT NULL CHECK(char_length(reason) BETWEEN 3 AND 4000),from_status text,to_status text,created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(application_id,environment_id,incident_id,tenant_scope_key) REFERENCES observability.incidents(application_id,environment_id,id,tenant_scope_key)
);
CREATE TABLE observability.feedback (
 id uuid NOT NULL,application_id uuid NOT NULL,environment_id uuid NOT NULL,tenant_reference text,actor_reference text NOT NULL,
 tracking_id text NOT NULL UNIQUE CHECK(tracking_id ~ '^FB-[A-Z0-9-]{8,64}$'),
 category text NOT NULL CHECK(category IN ('BUG','USAGE_PROBLEM','FEATURE_REQUEST','FEEDBACK','OTHER')),
 subject text NOT NULL CHECK(char_length(subject) BETWEEN 1 AND 160),description text NOT NULL CHECK(char_length(description) BETWEEN 1 AND 8000),
 status text NOT NULL DEFAULT 'NEW' CHECK(status IN ('NEW','TRIAGED','IN_PROGRESS','RESOLVED','CLOSED')),
 related_event_id uuid,payload_hash text NOT NULL,diagnostic_consent boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(application_id,environment_id,id),FOREIGN KEY(application_id,environment_id) REFERENCES observability.environments(application_id,id)
);
CREATE TABLE observability.feedback_replies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL,environment_id uuid NOT NULL,tenant_reference text,
 feedback_id uuid NOT NULL,actor_principal_id uuid NOT NULL REFERENCES observability.principals(id),
 body text NOT NULL CHECK(char_length(body) BETWEEN 1 AND 4000),internal boolean NOT NULL DEFAULT false,created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(application_id,environment_id,feedback_id) REFERENCES observability.feedback(application_id,environment_id,id)
);
CREATE TABLE observability.monitoring_rules (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL REFERENCES observability.applications(id),
 code text NOT NULL CHECK(code IN ('ERROR_BURST','ERROR_RATE','RELEASE_REGRESSION','BUSINESS_FAILURE','SLOW_OPERATION','WORKER_FAILURE','CONNECTIVITY_FAILURE','USER_IMPACT','ISSUE_REOPENED')),
 enabled boolean NOT NULL DEFAULT true,minimum_samples integer NOT NULL DEFAULT 5 CHECK(minimum_samples BETWEEN 1 AND 10000),
 threshold double precision NOT NULL DEFAULT 5 CHECK(threshold>0),window_seconds integer NOT NULL DEFAULT 300 CHECK(window_seconds BETWEEN 60 AND 86400),
 cooldown_seconds integer NOT NULL DEFAULT 900 CHECK(cooldown_seconds BETWEEN 60 AND 86400),UNIQUE(application_id,code)
);
CREATE TABLE observability.alerts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL,environment_id uuid NOT NULL,tenant_reference text,
 incident_id uuid,title text NOT NULL,dedupe_key text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(application_id,environment_id,dedupe_key),FOREIGN KEY(application_id,environment_id) REFERENCES observability.environments(application_id,id)
);
CREATE TABLE observability.aggregates (
 application_id uuid NOT NULL,environment_id uuid NOT NULL,tenant_reference text,
 tenant_scope_key text GENERATED ALWAYS AS (COALESCE(tenant_reference,'')) STORED,
 bucket_start timestamptz NOT NULL,category text NOT NULL,operation_name text NOT NULL DEFAULT '',release_version text NOT NULL DEFAULT '',
 event_count bigint NOT NULL DEFAULT 0,error_count bigint NOT NULL DEFAULT 0,duration_sum double precision NOT NULL DEFAULT 0,duration_count bigint NOT NULL DEFAULT 0,
 operation_count bigint NOT NULL DEFAULT 0,operation_failure_count bigint NOT NULL DEFAULT 0,
 PRIMARY KEY(application_id,environment_id,tenant_scope_key,bucket_start,category,operation_name,release_version),
 FOREIGN KEY(application_id,environment_id) REFERENCES observability.environments(application_id,id)
);
CREATE INDEX observability_issues_time ON observability.issues(application_id,environment_id,last_seen DESC);
CREATE INDEX observability_incidents_time ON observability.incidents(application_id,environment_id,created_at DESC);
CREATE INDEX observability_feedback_owner ON observability.feedback(application_id,actor_reference,created_at DESC);
CREATE INDEX observability_aggregates_time ON observability.aggregates(application_id,environment_id,bucket_start DESC);
DO $$ DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['issues','issue_events','incidents','incident_activity','alerts','aggregates'] LOOP
  EXECUTE format('ALTER TABLE observability.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE observability.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY data_scope ON observability.%I TO observability_runtime,observability_worker USING(observability.scope_allowed(application_id,environment_id,tenant_reference)) WITH CHECK(observability.scope_allowed(application_id,environment_id,tenant_reference))',t);
 END LOOP;
END $$;
ALTER TABLE observability.feedback ENABLE ROW LEVEL SECURITY;ALTER TABLE observability.feedback FORCE ROW LEVEL SECURITY;
CREATE POLICY feedback_scope ON observability.feedback TO observability_runtime,observability_worker
 USING(current_user='observability_worker' OR (observability.scope_allowed(application_id) AND environment_id::text=current_setting('obs.environment',true) AND (COALESCE(current_setting('obs.actor_all',true),'false')='true' AND observability.scope_allowed(application_id,environment_id,tenant_reference) OR actor_reference=current_setting('obs.actor',true))))
 WITH CHECK(observability.scope_allowed(application_id,environment_id,tenant_reference) AND (current_user='observability_worker' OR actor_reference=current_setting('obs.actor',true) OR COALESCE(current_setting('obs.actor_all',true),'false')='true'));
ALTER TABLE observability.feedback_replies ENABLE ROW LEVEL SECURITY;ALTER TABLE observability.feedback_replies FORCE ROW LEVEL SECURITY;
CREATE POLICY reply_scope ON observability.feedback_replies TO observability_runtime,observability_worker
 USING(current_user='observability_worker' OR EXISTS(SELECT 1 FROM observability.feedback f WHERE f.id=feedback_id AND f.application_id=feedback_replies.application_id AND f.environment_id=feedback_replies.environment_id AND (COALESCE(current_setting('obs.actor_all',true),'false')='true' OR (f.actor_reference=current_setting('obs.actor',true) AND internal=false))))
 WITH CHECK(current_user='observability_worker' OR (COALESCE(current_setting('obs.actor_all',true),'false')='true' AND observability.scope_allowed(application_id,environment_id,tenant_reference)));
GRANT SELECT ON observability.issues,observability.issue_events,observability.incidents,observability.incident_activity,observability.alerts,observability.aggregates TO observability_runtime;
GRANT SELECT,INSERT,UPDATE ON observability.feedback TO observability_runtime;
GRANT SELECT,INSERT ON observability.feedback_replies TO observability_runtime;
GRANT UPDATE(status,updated_at,resolved_at,assigned_principal_id) ON observability.incidents TO observability_runtime;
GRANT INSERT ON observability.incident_activity TO observability_runtime;
GRANT SELECT,INSERT,UPDATE,DELETE ON observability.issues,observability.issue_events,observability.incidents,observability.incident_activity,observability.feedback,observability.feedback_replies,observability.monitoring_rules,observability.alerts,observability.aggregates TO observability_worker;
