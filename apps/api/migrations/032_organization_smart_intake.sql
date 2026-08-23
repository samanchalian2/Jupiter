-- GOAL-024: organization administrators may control only the requester smart
-- intake feature. Provider credentials and models remain platform-managed.
ALTER TABLE organization_ai_settings
  ADD COLUMN smart_intake_enabled boolean NOT NULL DEFAULT false;

-- Preserve the effective feature state for already configured organizations.
UPDATE organization_ai_settings
SET smart_intake_enabled = true
WHERE enabled = true
  AND api_key_ciphertext IS NOT NULL
  AND COALESCE(NULLIF(btrim(analysis_model), ''), NULLIF(btrim(model), '')) IS NOT NULL;
