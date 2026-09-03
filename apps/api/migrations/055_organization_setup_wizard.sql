-- GOAL-055: versioned, tenant-scoped progress for setup organizations.
ALTER TABLE organization_setup_progress
  ADD COLUMN wizard_version smallint NOT NULL DEFAULT 1 CHECK (wizard_version=1),
  ADD COLUMN current_step text NOT NULL DEFAULT 'PROFILE',
  ADD COLUMN step_states jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN started_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN completed_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK (version > 0);

ALTER TABLE organization_settings
  ADD COLUMN contact_phone text CHECK (contact_phone IS NULL OR char_length(contact_phone) BETWEEN 5 AND 40);
