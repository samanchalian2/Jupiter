-- PostgreSQL's regex dialect rejects the bounded repetition used in migration 044.
ALTER TABLE platform_appearance_settings DROP CONSTRAINT IF EXISTS platform_appearance_settings_logo_url_check;
ALTER TABLE platform_appearance_settings ADD CONSTRAINT platform_appearance_settings_logo_url_check CHECK (logo_url IS NULL OR (logo_url ~ '^/[A-Za-z0-9._/-]+$' AND char_length(logo_url) <= 512));
