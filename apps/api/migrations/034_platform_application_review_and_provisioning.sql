-- GOAL-033: platform review, safe tenant provisioning and initial ownership.
-- Existing organizations deliberately retain their active/suspended state and
-- are never given an owner by this migration.
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_status_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_status_check
  CHECK (status IN ('setup','active','suspended'));

ALTER TABLE organization_applications
  ADD COLUMN reviewed_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  ADD COLUMN review_note text,
  ADD COLUMN reviewed_at timestamptz,
  ADD COLUMN provisioned_organization_id uuid UNIQUE REFERENCES organizations(id) ON DELETE RESTRICT,
  ADD CONSTRAINT organization_applications_review_note_length
    CHECK (review_note IS NULL OR char_length(review_note) <= 1000);

CREATE INDEX organization_applications_platform_review_lookup
  ON organization_applications(status,submitted_at DESC,created_at DESC);

INSERT INTO roles(code,name) VALUES ('ORG_OWNER','Organization owner') ON CONFLICT (code) DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
  SELECT owner.id,permission.id
  FROM roles owner
  JOIN roles admin ON admin.code='ORG_ADMIN'
  JOIN role_permissions admin_permission ON admin_permission.role_id=admin.id
  JOIN permissions permission ON permission.id=admin_permission.permission_id
  WHERE owner.code='ORG_OWNER'
  ON CONFLICT DO NOTHING;
