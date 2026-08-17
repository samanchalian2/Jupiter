ALTER TABLE users ADD COLUMN IF NOT EXISTS username text;

UPDATE users
SET username = lower(split_part(email, '@', 1))
WHERE username IS NULL
  AND split_part(email, '@', 1) ~ '^[a-z0-9][a-z0-9._-]{1,62}$'
  AND NOT EXISTS (
    SELECT 1 FROM users conflicting
    WHERE conflicting.id <> users.id
      AND lower(split_part(conflicting.email, '@', 1)) = lower(split_part(users.email, '@', 1))
  );

UPDATE users SET username = 's.chalian'
WHERE lower(email) = 's.chalian@pnsgroup.co'
  AND (username IS NULL OR username = 's.chalian');

ALTER TABLE users
  ADD CONSTRAINT users_username_lowercase CHECK (username IS NULL OR username = lower(username)),
  ADD CONSTRAINT users_username_format CHECK (username IS NULL OR username ~ '^[a-z0-9][a-z0-9._-]{1,62}$');

CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique
  ON users(username) WHERE username IS NOT NULL;

UPDATE ticket_custom_field_definitions
SET is_active = false, updated_at = now()
WHERE label ~ '[?]'
   OR position(chr(65533) IN label) > 0;
