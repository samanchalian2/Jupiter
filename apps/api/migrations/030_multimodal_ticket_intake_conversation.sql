ALTER TABLE ticket_intake_sessions
  ADD COLUMN conversation_summary text,
  ADD COLUMN primary_issue jsonb,
  ADD COLUMN secondary_issues jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(secondary_issues)='array'),
  ADD COLUMN clarification_question text,
  ADD COLUMN clarification_confidence numeric(4,3) CHECK(clarification_confidence IS NULL OR clarification_confidence BETWEEN 0 AND 1);

CREATE TABLE ticket_intake_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  intake_session_id uuid NOT NULL,
  sequence_number integer NOT NULL CHECK(sequence_number BETWEEN 1 AND 8),
  role text NOT NULL CHECK(role IN ('USER','ASSISTANT')),
  content_type text NOT NULL CHECK(content_type IN ('TEXT','VOICE','CLARIFICATION')),
  text_content text CHECK(text_content IS NULL OR char_length(text_content) <= 20000),
  transcript text CHECK(transcript IS NULL OR char_length(transcript) <= 20000),
  voice_storage_key text UNIQUE CHECK(voice_storage_key IS NULL OR char_length(voice_storage_key) BETWEEN 1 AND 512),
  voice_original_filename text CHECK(voice_original_filename IS NULL OR char_length(voice_original_filename) BETWEEN 1 AND 255),
  voice_content_type text,
  voice_byte_size bigint CHECK(voice_byte_size IS NULL OR voice_byte_size BETWEEN 1 AND 10485760),
  voice_duration_seconds numeric(6,3) CHECK(voice_duration_seconds IS NULL OR voice_duration_seconds > 0 AND voice_duration_seconds <= 60),
  voice_verified_at timestamptz,
  discarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id,intake_session_id,sequence_number),
  FOREIGN KEY(organization_id,intake_session_id) REFERENCES ticket_intake_sessions(organization_id,id) ON DELETE CASCADE,
  CHECK(
    (content_type='TEXT' AND role='USER' AND text_content IS NOT NULL AND voice_storage_key IS NULL)
    OR (content_type='VOICE' AND role='USER' AND text_content IS NULL AND voice_storage_key IS NOT NULL AND voice_original_filename IS NOT NULL AND voice_content_type IS NOT NULL AND voice_byte_size IS NOT NULL AND voice_duration_seconds IS NOT NULL)
    OR (content_type='CLARIFICATION' AND role='ASSISTANT' AND text_content IS NOT NULL AND voice_storage_key IS NULL)
  )
);

CREATE INDEX ticket_intake_messages_session_order ON ticket_intake_messages(intake_session_id,sequence_number) WHERE discarded_at IS NULL;
CREATE INDEX ticket_intake_messages_pending_voice ON ticket_intake_messages(intake_session_id) WHERE content_type='VOICE' AND transcript IS NULL AND discarded_at IS NULL;

ALTER TABLE ticket_intake_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY ticket_intake_messages_tenant ON ticket_intake_messages
  USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
GRANT SELECT,INSERT,UPDATE,DELETE ON ticket_intake_messages TO jupiter_app;
