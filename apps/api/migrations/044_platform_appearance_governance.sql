-- GOAL-045: one auditable, preset-only platform appearance record.
-- Organization logo remains a narrower, tenant-owned override; no CSS/JS is stored.
CREATE TABLE platform_appearance_settings (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  brand_preset text NOT NULL DEFAULT 'JUPITER' CHECK (brand_preset IN ('JUPITER','OCEAN','TEAL')),
  density_preset text NOT NULL DEFAULT 'STANDARD' CHECK (density_preset IN ('COMFORTABLE','STANDARD','COMPACT')),
  radius_preset text NOT NULL DEFAULT 'MEDIUM' CHECK (radius_preset IN ('SMALL','MEDIUM','LARGE')),
  logo_url text CHECK (logo_url IS NULL OR logo_url ~ '^/[A-Za-z0-9._/-]{1,512}$'),
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO platform_appearance_settings(singleton) VALUES(true) ON CONFLICT(singleton) DO NOTHING;
GRANT SELECT,INSERT,UPDATE ON platform_appearance_settings TO jupiter_app;
