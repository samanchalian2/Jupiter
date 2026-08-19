ALTER TABLE organization_ai_settings
  ADD COLUMN provider_base_url text NOT NULL DEFAULT 'https://api.openai.com/v1',
  ADD COLUMN analysis_model text,
  ADD COLUMN transcription_model text NOT NULL DEFAULT 'gpt-4o-mini-transcribe',
  ADD COLUMN api_key_ciphertext bytea,
  ADD COLUMN api_key_iv bytea,
  ADD COLUMN api_key_auth_tag bytea,
  ADD COLUMN credential_version integer NOT NULL DEFAULT 1;

UPDATE organization_ai_settings SET analysis_model = model WHERE analysis_model IS NULL;
ALTER TABLE organization_ai_settings ALTER COLUMN analysis_model SET NOT NULL;

ALTER TABLE organization_ai_settings
  ADD CONSTRAINT organization_ai_credentials_complete CHECK (
    (api_key_ciphertext IS NULL AND api_key_iv IS NULL AND api_key_auth_tag IS NULL)
    OR
    (api_key_ciphertext IS NOT NULL AND api_key_iv IS NOT NULL AND api_key_auth_tag IS NOT NULL)
  );

