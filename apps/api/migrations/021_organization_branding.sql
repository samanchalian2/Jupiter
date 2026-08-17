ALTER TABLE organization_settings
  ADD COLUMN logo_storage_key text CHECK (logo_storage_key IS NULL OR char_length(logo_storage_key) BETWEEN 1 AND 512);
