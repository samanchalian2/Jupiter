-- GOAL-057: safe, nullable primary overrides. NULL preserves inheritance.
ALTER TABLE platform_appearance_settings
  ADD COLUMN custom_primary text NULL
    CHECK (custom_primary IS NULL OR custom_primary ~ '^#[0-9A-F]{6}$');

ALTER TABLE organization_settings
  ADD COLUMN appearance_primary text NULL
    CHECK (appearance_primary IS NULL OR appearance_primary ~ '^#[0-9A-F]{6}$');
