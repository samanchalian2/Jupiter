-- GOAL-069. Product-agnostic persistence; no Jupiter business FK or data rewrite.
CREATE SCHEMA observability;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='observability_runtime') THEN
    CREATE ROLE observability_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='observability_worker') THEN
    CREATE ROLE observability_worker NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END $$;
GRANT USAGE ON SCHEMA observability TO observability_runtime,observability_worker;

CREATE TABLE observability.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK(slug ~ '^[a-z0-9][a-z0-9-]{2,62}$'),
  name text NOT NULL CHECK(char_length(name) BETWEEN 1 AND 160),
  description text NOT NULL DEFAULT '' CHECK(char_length(description)<=2000),
  enabled boolean NOT NULL DEFAULT true,
  allowed_origins text[] NOT NULL DEFAULT '{}',
  policy jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(policy)='object' AND octet_length(policy::text)<=8192),
  raw_retention_days integer NOT NULL DEFAULT 30 CHECK(raw_retention_days BETWEEN 7 AND 365),
  aggregate_retention_days integer NOT NULL DEFAULT 365 CHECK(aggregate_retention_days BETWEEN 30 AND 1825),
  incident_retention_days integer NOT NULL DEFAULT 180 CHECK(incident_retention_days BETWEEN 30 AND 1825),
  feedback_retention_days integer NOT NULL DEFAULT 180 CHECK(feedback_retention_days BETWEEN 30 AND 1825),
  ai_enabled boolean NOT NULL DEFAULT false,
  external_ai_allowed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE observability.environments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL REFERENCES observability.applications(id) ON DELETE RESTRICT,
  key text NOT NULL CHECK(key ~ '^[a-zA-Z0-9_-]{1,64}$'),
  kind text NOT NULL CHECK(kind IN ('DEVELOPMENT','TEST','STAGING','PRODUCTION')),
  enabled boolean NOT NULL DEFAULT true,created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(application_id,key),UNIQUE(application_id,id)
);
CREATE TABLE observability.principals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),issuer text NOT NULL CHECK(char_length(issuer) BETWEEN 1 AND 160),
  subject text NOT NULL CHECK(char_length(subject) BETWEEN 1 AND 160),
  display_name text NOT NULL CHECK(char_length(display_name) BETWEEN 1 AND 160),
  active boolean NOT NULL DEFAULT true,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(issuer,subject)
);
CREATE TABLE observability.global_grants (
  principal_id uuid NOT NULL REFERENCES observability.principals(id),
  permission text NOT NULL CHECK(permission IN ('HUB_SUPER_ADMIN','REGISTRY_CREATE')),
  granted_by uuid REFERENCES observability.principals(id),revoked_at timestamptz,
  reason text NOT NULL CHECK(char_length(reason) BETWEEN 3 AND 500),created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(principal_id,permission)
);
CREATE TABLE observability.access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL REFERENCES observability.applications(id),
  environment_id uuid,tenant_reference text CHECK(char_length(tenant_reference) BETWEEN 1 AND 160),
  principal_id uuid NOT NULL REFERENCES observability.principals(id),
  role text NOT NULL CHECK(role IN ('ADMIN','OPERATOR','ANALYST','VIEWER')),
  granted_by uuid NOT NULL REFERENCES observability.principals(id),reason text NOT NULL CHECK(char_length(reason) BETWEEN 3 AND 500),
  revoked_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(application_id,environment_id) REFERENCES observability.environments(application_id,id)
);
CREATE UNIQUE INDEX observability_active_grant ON observability.access_grants(application_id,principal_id,COALESCE(environment_id,'00000000-0000-0000-0000-000000000000'::uuid),COALESCE(tenant_reference,'')) WHERE revoked_at IS NULL;
CREATE TABLE observability.credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL,
  environment_id uuid NOT NULL,kind text NOT NULL CHECK(kind IN ('SERVER','BROWSER')),
  token_hash text NOT NULL UNIQUE CHECK(token_hash ~ '^[a-f0-9]{64}$'),
  actor_reference text CHECK(char_length(actor_reference) BETWEEN 1 AND 160),tenant_reference text CHECK(char_length(tenant_reference) BETWEEN 1 AND 160),
  tenant_all boolean NOT NULL DEFAULT false,
  permissions text[] NOT NULL CHECK(cardinality(permissions) BETWEEN 1 AND 8),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  parent_id uuid REFERENCES observability.credentials(id),created_by uuid REFERENCES observability.principals(id),
  expires_at timestamptz NOT NULL,revoked_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(application_id,environment_id) REFERENCES observability.environments(application_id,id),
  CHECK(kind<>'BROWSER' OR (tenant_all=false AND expires_at<=created_at+interval '15 minutes')),
  CHECK(expires_at>created_at)
);
CREATE INDEX observability_credentials_parent ON observability.credentials(parent_id) WHERE parent_id IS NOT NULL;

CREATE FUNCTION observability.scope_allowed(app uuid,env uuid DEFAULT NULL,tenant text DEFAULT NULL) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT current_user='observability_worker' OR (
    app::text=ANY(string_to_array(COALESCE(current_setting('obs.applications',true),''),','))
    AND (env IS NULL OR COALESCE(current_setting('obs.environment',true),'')='' OR env::text=current_setting('obs.environment',true))
    AND (env IS NULL OR COALESCE(current_setting('obs.tenant_all',true),'false')='true' OR COALESCE(tenant,'')=COALESCE(current_setting('obs.tenant',true),''))
  )
$$;

CREATE TABLE observability.events (
  application_id uuid NOT NULL,environment_id uuid NOT NULL,event_id uuid NOT NULL,
  schema_version text NOT NULL CHECK(schema_version IN ('1.0','1.1')),
  occurred_at timestamptz NOT NULL,received_at timestamptz NOT NULL DEFAULT now(),
  release_version text CHECK(char_length(release_version)<=160),
  source text NOT NULL CHECK(source IN ('BROWSER','SERVER','WORKER','REFERENCE_CLIENT')),
  category text NOT NULL CHECK(category IN ('FRONTEND','BACKEND','WORKER','CONNECTIVITY','PERFORMANCE','BUSINESS_OPERATION','USER_FEEDBACK')),
  severity text NOT NULL CHECK(severity IN ('DEBUG','INFO','WARNING','ERROR','CRITICAL')),
  event_code text NOT NULL CHECK(event_code ~ '^[A-Za-z0-9_.:-]{1,100}$'),
  normalized_message text NOT NULL CHECK(char_length(normalized_message) BETWEEN 1 AND 2000),
  exception_type text CHECK(char_length(exception_type)<=160),sanitized_stack text CHECK(char_length(sanitized_stack)<=8000),
  fingerprint text NOT NULL CHECK(fingerprint ~ '^[a-f0-9]{64}$'),fingerprint_version integer NOT NULL,
  trace_id text CHECK(trace_id ~ '^[a-f0-9]{32}$'),span_id text CHECK(span_id ~ '^[a-f0-9]{16}$'),request_id text CHECK(char_length(request_id)<=160),
  actor_reference text CHECK(char_length(actor_reference)<=160),tenant_reference text CHECK(char_length(tenant_reference)<=160),
  session_correlation_id text CHECK(char_length(session_correlation_id)<=160),
  operation_name text CHECK(char_length(operation_name)<=160),route_template text CHECK(char_length(route_template)<=256),
  http_status integer CHECK(http_status BETWEEN 100 AND 599),duration_ms double precision CHECK(duration_ms BETWEEN 0 AND 86400000),
  browser_family text CHECK(char_length(browser_family)<=160),browser_version text CHECK(char_length(browser_version)<=160),
  operating_system text CHECK(char_length(operating_system)<=160),device_class text CHECK(char_length(device_class)<=160),
  connectivity_state text CHECK(connectivity_state IN ('ONLINE','OFFLINE','UNKNOWN')),
  safe_metadata jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(safe_metadata)='object' AND octet_length(safe_metadata::text)<=8192),
  attribution text NOT NULL CHECK(attribution IN ('TRUSTED','UNATTRIBUTED')),
  PRIMARY KEY(application_id,environment_id,event_id),
  FOREIGN KEY(application_id,environment_id) REFERENCES observability.environments(application_id,id)
);
CREATE INDEX observability_events_time ON observability.events(application_id,environment_id,received_at DESC,event_id);
CREATE INDEX observability_events_tenant ON observability.events(application_id,environment_id,tenant_reference,received_at DESC);
CREATE INDEX observability_events_fingerprint ON observability.events(application_id,environment_id,fingerprint,received_at DESC);
CREATE INDEX observability_events_trace ON observability.events(application_id,environment_id,trace_id) WHERE trace_id IS NOT NULL;
CREATE TABLE observability.ingestion_receipts (
  application_id uuid NOT NULL,environment_id uuid NOT NULL,event_id uuid NOT NULL,
  tenant_reference text,actor_reference text,payload_hash text NOT NULL CHECK(payload_hash ~ '^[a-f0-9]{64}$'),
  received_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(application_id,environment_id,event_id),
  FOREIGN KEY(application_id,environment_id) REFERENCES observability.environments(application_id,id)
);
CREATE TABLE observability.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL,environment_id uuid NOT NULL,
  tenant_reference text,event_id uuid,
  kind text NOT NULL CHECK(kind IN ('AGGREGATE','RULE_EVALUATION','INVESTIGATE','ALERT_DELIVERY','RETENTION')),
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','RUNNING','SUCCEEDED','FAILED')),
  dedupe_key text NOT NULL CHECK(char_length(dedupe_key) BETWEEN 1 AND 200),
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 12),
  available_at timestamptz NOT NULL DEFAULT now(),lease_until timestamptz,lease_owner uuid,
  failure_code text CHECK(char_length(failure_code)<=100),created_at timestamptz NOT NULL DEFAULT now(),completed_at timestamptz,
  FOREIGN KEY(application_id,environment_id) REFERENCES observability.environments(application_id,id),
  UNIQUE(application_id,environment_id,kind,dedupe_key),
  CHECK((status='RUNNING')=(lease_until IS NOT NULL AND lease_owner IS NOT NULL))
);
CREATE INDEX observability_jobs_ready ON observability.jobs(available_at,created_at) WHERE status IN ('PENDING','RUNNING');
CREATE TABLE observability.audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid REFERENCES observability.applications(id),
  actor_principal_id uuid REFERENCES observability.principals(id),action text NOT NULL CHECK(char_length(action)<=100),
  reason text NOT NULL CHECK(char_length(reason) BETWEEN 3 AND 500),
  metadata jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(metadata)='object' AND octet_length(metadata::text)<=2048),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX observability_audit_time ON observability.audit(application_id,created_at DESC);

-- Product runtime receives only explicit transaction scope. Configuration/auth
-- discovery is performed by the trusted host's control-plane connection.
ALTER TABLE observability.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE observability.applications FORCE ROW LEVEL SECURITY;
CREATE POLICY app_scope ON observability.applications TO observability_runtime,observability_worker USING(observability.scope_allowed(id)) WITH CHECK(observability.scope_allowed(id));
ALTER TABLE observability.environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE observability.environments FORCE ROW LEVEL SECURITY;
CREATE POLICY environment_scope ON observability.environments TO observability_runtime,observability_worker
  USING(observability.scope_allowed(application_id) AND (current_user='observability_worker' OR COALESCE(current_setting('obs.environment',true),'')='' OR id::text=current_setting('obs.environment',true)))
  WITH CHECK(observability.scope_allowed(application_id) AND (current_user='observability_worker' OR COALESCE(current_setting('obs.environment',true),'')='' OR id::text=current_setting('obs.environment',true)));
DO $$ DECLARE table_name text;BEGIN
  FOREACH table_name IN ARRAY ARRAY['access_grants','credentials','events','ingestion_receipts','jobs'] LOOP
    EXECUTE format('ALTER TABLE observability.%I ENABLE ROW LEVEL SECURITY',table_name);
    EXECUTE format('ALTER TABLE observability.%I FORCE ROW LEVEL SECURITY',table_name);
    EXECUTE format('CREATE POLICY data_scope ON observability.%I TO observability_runtime,observability_worker USING(observability.scope_allowed(application_id,environment_id,tenant_reference)) WITH CHECK(observability.scope_allowed(application_id,environment_id,tenant_reference))',table_name);
  END LOOP;
END $$;
GRANT SELECT ON observability.applications,observability.environments TO observability_runtime;
GRANT SELECT,INSERT ON observability.events,observability.ingestion_receipts,observability.jobs TO observability_runtime;
GRANT SELECT,INSERT,UPDATE,DELETE ON observability.events,observability.ingestion_receipts,observability.jobs TO observability_worker;
GRANT SELECT ON observability.applications,observability.environments TO observability_worker;
-- Principals/global grants/audit/credential hashes are never directly readable
-- by the ingestion/data runtime role. Control-plane service enforces its grants.
