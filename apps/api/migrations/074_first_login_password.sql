-- GOAL-070 / DEC-066. Existing accounts are not retroactively restricted.
ALTER TABLE users
  ADD COLUMN must_change_password boolean NOT NULL DEFAULT false,
  ADD COLUMN credential_version integer NOT NULL DEFAULT 0 CHECK (credential_version >= 0);

COMMENT ON COLUMN users.must_change_password IS 'Local administrator-issued temporary passwords only; Directory credentials are never synchronized.';
COMMENT ON COLUMN users.credential_version IS 'Invalidates prior access tokens and password-change challenges on credential changes.';

-- Descriptive metadata only, never a tenant identifier or automatic merge key.
ALTER TABLE organizations ADD COLUMN legal_name text CHECK (legal_name IS NULL OR char_length(legal_name) BETWEEN 2 AND 160);
