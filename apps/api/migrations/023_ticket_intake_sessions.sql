CREATE TABLE ticket_intake_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'CREATED' CHECK(status IN ('CREATED','UPLOADING','READY','TRANSCRIBING','ANALYZING','SUCCEEDED','FAILED','CONSUMED','EXPIRED')),
  source_description text NOT NULL DEFAULT '' CHECK(char_length(source_description) <= 10000),
  transcript text CHECK(transcript IS NULL OR char_length(transcript) <= 20000),
  combined_description text CHECK(combined_description IS NULL OR char_length(combined_description) <= 30000),
  analysis_contract_version text NOT NULL DEFAULT 'ticket-intake.v1',
  analysis_result jsonb,
  provider_usage jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(provider_usage)='object'),
  missing_fields jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(missing_fields)='array'),
  confidence_by_field jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(confidence_by_field)='object'),
  rejected_fields jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(rejected_fields)='array'),
  voice_storage_key text UNIQUE CHECK(voice_storage_key IS NULL OR char_length(voice_storage_key) BETWEEN 1 AND 512),
  voice_original_filename text CHECK(voice_original_filename IS NULL OR char_length(voice_original_filename) BETWEEN 1 AND 255),
  voice_content_type text,
  voice_byte_size bigint CHECK(voice_byte_size IS NULL OR voice_byte_size BETWEEN 1 AND 10485760),
  voice_duration_seconds numeric(6,3) CHECK(voice_duration_seconds IS NULL OR voice_duration_seconds > 0 AND voice_duration_seconds <= 60),
  idempotency_key text CHECK(idempotency_key IS NULL OR char_length(idempotency_key) BETWEEN 8 AND 120),
  processing_started_at timestamptz,
  next_attempt_at timestamptz,
  attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 20),
  last_error_code text,
  ticket_id uuid,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id,id),
  UNIQUE(organization_id,created_by_user_id,idempotency_key),
  FOREIGN KEY(organization_id,ticket_id) REFERENCES tickets(organization_id,id) ON DELETE SET NULL (ticket_id),
  CHECK(
    (voice_storage_key IS NULL AND voice_original_filename IS NULL AND voice_content_type IS NULL AND voice_byte_size IS NULL AND voice_duration_seconds IS NULL)
    OR
    (voice_storage_key IS NOT NULL AND voice_original_filename IS NOT NULL AND voice_content_type IS NOT NULL AND voice_byte_size IS NOT NULL AND voice_duration_seconds IS NOT NULL)
  )
);

CREATE INDEX ticket_intakes_worker_queue ON ticket_intake_sessions(status,next_attempt_at,updated_at)
  WHERE status IN ('TRANSCRIBING','ANALYZING');
CREATE INDEX ticket_intakes_expiry ON ticket_intake_sessions(expires_at)
  WHERE status NOT IN ('CONSUMED','EXPIRED');

CREATE TABLE ticket_intake_provenance (
  organization_id uuid NOT NULL,
  ticket_id uuid PRIMARY KEY,
  intake_session_id uuid NOT NULL UNIQUE,
  analysis_contract_version text NOT NULL,
  analysis_result jsonb,
  confidence_by_field jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(organization_id,ticket_id) REFERENCES tickets(organization_id,id) ON DELETE CASCADE,
  FOREIGN KEY(organization_id,intake_session_id) REFERENCES ticket_intake_sessions(organization_id,id) ON DELETE RESTRICT
);

ALTER TABLE ticket_intake_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_intake_provenance ENABLE ROW LEVEL SECURITY;
CREATE POLICY ticket_intake_sessions_tenant ON ticket_intake_sessions
  USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
CREATE POLICY ticket_intake_provenance_tenant ON ticket_intake_provenance
  USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
GRANT SELECT,INSERT,UPDATE,DELETE ON ticket_intake_sessions,ticket_intake_provenance TO jupiter_app;
