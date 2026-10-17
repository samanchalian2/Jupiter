-- Forward-only operational notes, grant-scoped writes and immutable Audit.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='observability_control') THEN
  CREATE ROLE observability_control NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
 END IF;
END $$;
GRANT USAGE ON SCHEMA observability TO observability_control;
DO $$ DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['applications','environments','access_grants','credentials'] LOOP
  EXECUTE format('CREATE POLICY control_plane ON observability.%I TO observability_control USING(true) WITH CHECK(true)',t);
 END LOOP;
END $$;
GRANT SELECT,INSERT,UPDATE ON observability.applications,observability.environments,observability.principals,observability.global_grants,observability.access_grants,observability.credentials,observability.monitoring_rules TO observability_control;
GRANT SELECT,INSERT ON observability.audit TO observability_control;
CREATE TABLE observability.issue_activity (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL,environment_id uuid NOT NULL,tenant_reference text,
 tenant_scope_key text GENERATED ALWAYS AS (COALESCE(tenant_reference,'')) STORED,
 issue_id uuid NOT NULL,actor_principal_id uuid NOT NULL REFERENCES observability.principals(id),
 kind text NOT NULL CHECK(kind IN ('STATUS_CHANGED','ASSIGNED','NOTE_ADDED')),
 body text NOT NULL CHECK(char_length(body) BETWEEN 3 AND 4000),created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(application_id,environment_id,issue_id,tenant_scope_key) REFERENCES observability.issues(application_id,environment_id,id,tenant_scope_key)
);
ALTER TABLE observability.issue_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE observability.issue_activity FORCE ROW LEVEL SECURITY;
CREATE POLICY issue_activity_scope ON observability.issue_activity TO observability_runtime,observability_worker USING(observability.scope_allowed(application_id,environment_id,tenant_reference)) WITH CHECK(observability.scope_allowed(application_id,environment_id,tenant_reference));
ALTER TABLE observability.audit ENABLE ROW LEVEL SECURITY;ALTER TABLE observability.audit FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_scope ON observability.audit TO observability_runtime,observability_worker USING(application_id IS NOT NULL AND observability.scope_allowed(application_id)) WITH CHECK(application_id IS NOT NULL AND observability.scope_allowed(application_id));
CREATE POLICY audit_control ON observability.audit TO observability_control USING(true) WITH CHECK(true);
GRANT SELECT,INSERT ON observability.issue_activity TO observability_runtime;
GRANT UPDATE(status,resolved_at,assigned_principal_id) ON observability.issues TO observability_runtime;
GRANT INSERT ON observability.audit TO observability_runtime;
GRANT SELECT,INSERT ON observability.issue_activity,observability.audit TO observability_worker;
CREATE INDEX observability_issue_activity_time ON observability.issue_activity(application_id,environment_id,issue_id,created_at);
CREATE INDEX observability_rule_scan ON observability.issues(last_seen DESC,id) WHERE status NOT IN ('RESOLVED','IGNORED');
