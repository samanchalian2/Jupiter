CREATE TABLE organization_catalog_template_installs (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_code text NOT NULL CHECK(template_code IN ('it-enterprise')),
  installed_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  installed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(organization_id,template_code)
);

CREATE TABLE catalog_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK(kind IN ('category','subcategory','department','location','discipline')),
  name text NOT NULL CHECK(char_length(btrim(name)) BETWEEN 2 AND 160),
  parent_category_id uuid,
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED')),
  source text NOT NULL CHECK(source IN ('AI_INTAKE','ADMIN')),
  confidence numeric(4,3),
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id,kind,name,status),
  FOREIGN KEY(organization_id,parent_category_id) REFERENCES categories(organization_id,id) ON DELETE SET NULL,
  CHECK((status='PENDING' AND reviewed_at IS NULL AND reviewed_by_user_id IS NULL) OR status IN ('APPROVED','REJECTED')),
  CHECK(confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

ALTER TABLE organization_catalog_template_installs ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY organization_catalog_template_installs_tenant ON organization_catalog_template_installs
  USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
CREATE POLICY catalog_suggestions_tenant ON catalog_suggestions
  USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
GRANT SELECT,INSERT,UPDATE,DELETE ON organization_catalog_template_installs,catalog_suggestions TO jupiter_app;
