-- Independent operational AI only. No customer allowance or business FK.
CREATE TABLE observability.ai_configurations (
 application_id uuid PRIMARY KEY REFERENCES observability.applications(id),
 enabled boolean NOT NULL DEFAULT false,external_processing_allowed boolean NOT NULL DEFAULT false,
 provider_code text NOT NULL DEFAULT 'OPENAI_COMPATIBLE' CHECK(provider_code='OPENAI_COMPATIBLE'),
 endpoint text NOT NULL CHECK(char_length(endpoint) BETWEEN 1 AND 2048),
 model text NOT NULL CHECK(char_length(model) BETWEEN 1 AND 160),credential_ciphertext text NOT NULL,
 monthly_token_budget bigint NOT NULL DEFAULT 0 CHECK(monthly_token_budget BETWEEN 0 AND 1000000000),
 max_output_tokens integer NOT NULL DEFAULT 1024 CHECK(max_output_tokens BETWEEN 128 AND 4096),
 max_context_bytes integer NOT NULL DEFAULT 16000 CHECK(max_context_bytes BETWEEN 2048 AND 32768),
 max_concurrent integer NOT NULL DEFAULT 1 CHECK(max_concurrent BETWEEN 1 AND 4),
 review_interval_seconds integer NOT NULL DEFAULT 300 CHECK(review_interval_seconds BETWEEN 300 AND 86400),
 updated_by uuid NOT NULL REFERENCES observability.principals(id),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE observability.investigations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL,environment_id uuid NOT NULL,tenant_reference text,
 tenant_scope_key text GENERATED ALWAYS AS (COALESCE(tenant_reference,'')) STORED,
 kind text NOT NULL CHECK(kind IN ('ISSUE','INCIDENT','DAILY','WEEKLY')),target_reference uuid,
 idempotency_key text NOT NULL CHECK(char_length(idempotency_key) BETWEEN 1 AND 160),
 status text NOT NULL DEFAULT 'QUEUED' CHECK(status IN ('QUEUED','RUNNING','SUCCEEDED','FAILED','BUDGET_DENIED','SKIPPED')),
 output jsonb CHECK(output IS NULL OR octet_length(output::text)<=32768),
 evidence_references jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(evidence_references)='array' AND octet_length(evidence_references::text)<=8192),
 failure_code text CHECK(failure_code ~ '^[A-Z0-9_]{1,100}$'),
 requested_by uuid REFERENCES observability.principals(id),created_at timestamptz NOT NULL DEFAULT now(),completed_at timestamptz,
 UNIQUE(application_id,environment_id,id,tenant_scope_key),UNIQUE(application_id,environment_id,tenant_scope_key,idempotency_key),
 FOREIGN KEY(application_id,environment_id) REFERENCES observability.environments(application_id,id),
 CHECK((kind IN ('ISSUE','INCIDENT'))=(target_reference IS NOT NULL))
);
CREATE TABLE observability.ai_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL,environment_id uuid NOT NULL,tenant_reference text,
 tenant_scope_key text GENERATED ALWAYS AS (COALESCE(tenant_reference,'')) STORED,
 investigation_id uuid NOT NULL,attempt integer NOT NULL CHECK(attempt BETWEEN 1 AND 12),
 period_start timestamptz NOT NULL,reserved_tokens integer NOT NULL CHECK(reserved_tokens>0),
 status text NOT NULL DEFAULT 'RESERVED' CHECK(status IN ('RESERVED','SETTLED','UNKNOWN','RELEASED')),
 input_tokens integer CHECK(input_tokens>=0),output_tokens integer CHECK(output_tokens>=0),
 provider_code text NOT NULL,model text NOT NULL,outcome text,created_at timestamptz NOT NULL DEFAULT now(),settled_at timestamptz,
 UNIQUE(investigation_id,attempt),
 FOREIGN KEY(application_id,environment_id,investigation_id,tenant_scope_key) REFERENCES observability.investigations(application_id,environment_id,id,tenant_scope_key),
 CHECK(status<>'SETTLED' OR (input_tokens IS NOT NULL AND output_tokens IS NOT NULL AND settled_at IS NOT NULL)),
 CHECK(input_tokens IS NULL OR output_tokens IS NULL OR input_tokens+output_tokens<=reserved_tokens)
);
CREATE FUNCTION observability.protect_ai_attempt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF ROW(NEW.id,NEW.application_id,NEW.environment_id,NEW.tenant_reference,NEW.investigation_id,NEW.attempt,NEW.period_start,NEW.reserved_tokens,NEW.provider_code,NEW.model,NEW.created_at)
 IS DISTINCT FROM ROW(OLD.id,OLD.application_id,OLD.environment_id,OLD.tenant_reference,OLD.investigation_id,OLD.attempt,OLD.period_start,OLD.reserved_tokens,OLD.provider_code,OLD.model,OLD.created_at)
 OR OLD.status IN ('SETTLED','RELEASED') OR OLD.status='UNKNOWN' AND NEW.status<>'SETTLED'
 THEN RAISE EXCEPTION 'immutable operational AI ledger'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_ai_attempt BEFORE UPDATE ON observability.ai_attempts FOR EACH ROW EXECUTE FUNCTION observability.protect_ai_attempt();
ALTER TABLE observability.ai_configurations ENABLE ROW LEVEL SECURITY;ALTER TABLE observability.ai_configurations FORCE ROW LEVEL SECURITY;
CREATE POLICY ai_configuration_control ON observability.ai_configurations TO observability_control USING(true) WITH CHECK(true);
CREATE POLICY ai_configuration_worker ON observability.ai_configurations TO observability_worker USING(true);
GRANT SELECT,INSERT,UPDATE ON observability.ai_configurations TO observability_control;
GRANT SELECT ON observability.ai_configurations TO observability_worker;
DO $$ DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['investigations','ai_attempts'] LOOP
  EXECUTE format('ALTER TABLE observability.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE observability.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY data_scope ON observability.%I TO observability_runtime,observability_worker USING(observability.scope_allowed(application_id,environment_id,tenant_reference)) WITH CHECK(observability.scope_allowed(application_id,environment_id,tenant_reference))',t);
 END LOOP;
END $$;
GRANT SELECT,INSERT ON observability.investigations TO observability_runtime;
GRANT SELECT ON observability.ai_attempts TO observability_runtime;
GRANT SELECT,INSERT,UPDATE ON observability.investigations,observability.ai_attempts TO observability_worker;
CREATE INDEX observability_investigations_time ON observability.investigations(application_id,environment_id,created_at DESC);
CREATE INDEX observability_ai_budget ON observability.ai_attempts(application_id,period_start,status);
CREATE INDEX observability_ai_active ON observability.ai_attempts(application_id,created_at) WHERE status='RESERVED';
CREATE INDEX observability_ai_schedule ON observability.ai_configurations(updated_at,application_id) WHERE enabled;
