-- DEC-062: independent operational estimates, never customer billing/pricing.
ALTER TABLE observability.ai_configurations
 ADD COLUMN monthly_request_limit integer CHECK(monthly_request_limit BETWEEN 0 AND 1000000000),
 ADD COLUMN monthly_estimated_cost_micros bigint CHECK(monthly_estimated_cost_micros BETWEEN 0 AND 1000000000000),
 ADD COLUMN input_rate_micros_per_million bigint CHECK(input_rate_micros_per_million BETWEEN 0 AND 1000000000000),
 ADD COLUMN output_rate_micros_per_million bigint CHECK(output_rate_micros_per_million BETWEEN 0 AND 1000000000000),
 ADD CONSTRAINT ai_explicit_cost_rates CHECK((input_rate_micros_per_million IS NULL)=(output_rate_micros_per_million IS NULL) AND (monthly_estimated_cost_micros IS NULL OR input_rate_micros_per_million IS NOT NULL));

-- Legacy ledger remains deliberately unpriced. Never revalue historical calls.
ALTER TABLE observability.ai_attempts
 ADD COLUMN input_rate_micros_per_million bigint CHECK(input_rate_micros_per_million BETWEEN 0 AND 1000000000000),
 ADD COLUMN output_rate_micros_per_million bigint CHECK(output_rate_micros_per_million BETWEEN 0 AND 1000000000000),
 ADD COLUMN reserved_cost_micros bigint CHECK(reserved_cost_micros>=0),
 ADD COLUMN estimated_cost_micros bigint CHECK(estimated_cost_micros>=0),
 ADD CONSTRAINT ai_attempt_cost_snapshot CHECK((input_rate_micros_per_million IS NULL)=(output_rate_micros_per_million IS NULL) AND (reserved_cost_micros IS NULL)=(input_rate_micros_per_million IS NULL)),
 ADD CONSTRAINT ai_attempt_cost_settlement CHECK((estimated_cost_micros IS NULL OR (status='SETTLED' AND reserved_cost_micros IS NOT NULL AND estimated_cost_micros<=reserved_cost_micros)) AND (status<>'SETTLED' OR reserved_cost_micros IS NULL OR estimated_cost_micros IS NOT NULL)),
 ADD CONSTRAINT ai_attempt_cost_value CHECK(estimated_cost_micros IS NULL OR estimated_cost_micros=ceil((input_tokens::numeric*input_rate_micros_per_million+output_tokens::numeric*output_rate_micros_per_million)/1000000));

CREATE OR REPLACE FUNCTION observability.protect_ai_attempt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF ROW(NEW.id,NEW.application_id,NEW.environment_id,NEW.tenant_reference,NEW.investigation_id,NEW.attempt,NEW.period_start,NEW.reserved_tokens,NEW.provider_code,NEW.model,NEW.created_at,NEW.input_rate_micros_per_million,NEW.output_rate_micros_per_million,NEW.reserved_cost_micros)
 IS DISTINCT FROM ROW(OLD.id,OLD.application_id,OLD.environment_id,OLD.tenant_reference,OLD.investigation_id,OLD.attempt,OLD.period_start,OLD.reserved_tokens,OLD.provider_code,OLD.model,OLD.created_at,OLD.input_rate_micros_per_million,OLD.output_rate_micros_per_million,OLD.reserved_cost_micros)
 OR OLD.status IN ('SETTLED','RELEASED') OR OLD.status='UNKNOWN' AND NEW.status<>'SETTLED'
 THEN RAISE EXCEPTION 'immutable operational AI ledger'; END IF;
 RETURN NEW;
END $$;
-- Existing forced RLS, table-level grants, tenant FKs and App/month indexes apply.
