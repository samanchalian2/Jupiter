-- GOAL-031: additive public-account identity and pre-tenant application foundation.
-- Existing users keep their legacy credential columns during the staged migration.
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

CREATE TABLE authentication_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  identity_type text NOT NULL CHECK (identity_type IN ('EMAIL_PASSWORD','TENANT_USERNAME_PASSWORD')),
  identifier text NOT NULL CHECK (identifier = lower(identifier)),
  password_hash text NOT NULL,
  email_verified_at timestamptz,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((identity_type = 'EMAIL_PASSWORD' AND organization_id IS NULL) OR (identity_type = 'TENANT_USERNAME_PASSWORD' AND organization_id IS NOT NULL))
);
CREATE UNIQUE INDEX authentication_identities_global_identifier_unique
  ON authentication_identities(identity_type,identifier)
  WHERE organization_id IS NULL;
CREATE UNIQUE INDEX authentication_identities_tenant_identifier_unique
  ON authentication_identities(organization_id,identity_type,identifier)
  WHERE organization_id IS NOT NULL;

CREATE TABLE directory_principals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'ACTIVE_DIRECTORY' CHECK (source IN ('ACTIVE_DIRECTORY')),
  external_object_id text NOT NULL CHECK (char_length(external_object_id) BETWEEN 1 AND 512),
  account_name text CHECK (account_name IS NULL OR account_name = lower(account_name)),
  email text CHECK (email IS NULL OR email = lower(email)),
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 160),
  status text NOT NULL DEFAULT 'PENDING_ACTIVATION' CHECK (status IN ('PENDING_ACTIVATION','ACTIVE','SUSPENDED')),
  managed_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id,external_object_id),
  UNIQUE(organization_id,id)
);
CREATE UNIQUE INDEX directory_principals_organization_user_unique
  ON directory_principals(organization_id,user_id) WHERE user_id IS NOT NULL;

CREATE TABLE public_account_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  identity_id uuid NOT NULL REFERENCES authentication_identities(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);
CREATE INDEX public_account_verification_tokens_active_lookup
  ON public_account_verification_tokens(user_id,created_at DESC) WHERE consumed_at IS NULL;

CREATE TABLE public_account_verification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid NOT NULL UNIQUE REFERENCES public_account_verification_tokens(id) ON DELETE CASCADE,
  recipient_email text NOT NULL CHECK (recipient_email = lower(recipient_email)),
  status text NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED','DELIVERED','FAILED','PENDING_CONFIGURATION')),
  failure_code text,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'DELIVERED') = (delivered_at IS NOT NULL))
);

CREATE TABLE organization_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  organization_name text NOT NULL CHECK (char_length(organization_name) BETWEEN 2 AND 160),
  preferred_slug text CHECK (preferred_slug IS NULL OR preferred_slug ~ '^[a-z0-9-]{3,63}$'),
  contact_name text NOT NULL CHECK (char_length(contact_name) BETWEEN 2 AND 160),
  contact_phone text CHECK (contact_phone IS NULL OR char_length(contact_phone) BETWEEN 5 AND 40),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SUBMITTED','UNDER_REVIEW','NEEDS_INFORMATION','APPROVED','REJECTED','CANCELLED')),
  client_request_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz
);
CREATE UNIQUE INDEX organization_applications_request_id_unique
  ON organization_applications(applicant_user_id,client_request_id);
CREATE UNIQUE INDEX organization_applications_one_open_per_applicant
  ON organization_applications(applicant_user_id)
  WHERE status NOT IN ('REJECTED','CANCELLED','APPROVED');
CREATE INDEX organization_applications_applicant_lookup
  ON organization_applications(applicant_user_id,created_at DESC);

CREATE TABLE organization_application_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES organization_applications(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  from_status text,
  to_status text NOT NULL CHECK (to_status IN ('DRAFT','SUBMITTED','UNDER_REVIEW','NEEDS_INFORMATION','APPROVED','REJECTED','CANCELLED')),
  idempotency_key uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(application_id,idempotency_key)
);

ALTER TABLE directory_principals ENABLE ROW LEVEL SECURITY;
CREATE POLICY directory_principals_tenant ON directory_principals
  USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

GRANT SELECT, INSERT, UPDATE, DELETE ON authentication_identities,
  directory_principals, public_account_verification_tokens,
  public_account_verification_deliveries, organization_applications,
  organization_application_transitions TO jupiter_app;
