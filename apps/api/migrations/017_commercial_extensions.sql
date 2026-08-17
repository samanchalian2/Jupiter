CREATE TABLE ticket_custom_field_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  field_key text NOT NULL CHECK(field_key ~ '^[a-z][a-z0-9_]{1,63}$'),
  label text NOT NULL CHECK(char_length(label) BETWEEN 2 AND 120),
  field_type text NOT NULL CHECK(field_type IN ('TEXT','NUMBER','DATE','SELECT','BOOLEAN')),
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_required boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id,field_key)
);
CREATE TABLE ticket_custom_field_values (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES ticket_custom_field_definitions(id) ON DELETE CASCADE,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(ticket_id,field_id)
);
CREATE TABLE email_integration_settings (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  inbound_address text NOT NULL CHECK(position('@' in inbound_address)>1),
  sender_name text NOT NULL CHECK(char_length(sender_name) BETWEEN 2 AND 120),
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE ticket_custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_integration_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY custom_field_definitions_tenant ON ticket_custom_field_definitions USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
CREATE POLICY custom_field_values_tenant ON ticket_custom_field_values USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
CREATE POLICY email_integration_settings_tenant ON email_integration_settings USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
GRANT SELECT,INSERT,UPDATE,DELETE ON ticket_custom_field_definitions,ticket_custom_field_values,email_integration_settings TO jupiter_app;
