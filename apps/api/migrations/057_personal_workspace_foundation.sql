-- GOAL-061: backward-compatible personal workspace tenant foundation.
ALTER TABLE organizations
  ADD COLUMN workspace_type text NOT NULL DEFAULT 'ORGANIZATION',
  ADD COLUMN personal_owner_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  ADD CONSTRAINT organizations_workspace_type_check
    CHECK (workspace_type IN ('ORGANIZATION','PERSONAL')),
  ADD CONSTRAINT organizations_personal_owner_shape_check
    CHECK (
      (workspace_type='ORGANIZATION' AND personal_owner_user_id IS NULL)
      OR (workspace_type='PERSONAL' AND personal_owner_user_id IS NOT NULL)
    );

CREATE UNIQUE INDEX organizations_personal_owner_unique
  ON organizations(personal_owner_user_id)
  WHERE workspace_type='PERSONAL';

CREATE INDEX organizations_workspace_type_lookup
  ON organizations(workspace_type,status,created_at);

CREATE OR REPLACE FUNCTION app.enforce_personal_membership()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  target_workspace_type text;
  target_owner uuid;
BEGIN
  SELECT workspace_type,personal_owner_user_id
    INTO target_workspace_type,target_owner
    FROM organizations WHERE id=NEW.organization_id;
  IF target_workspace_type='PERSONAL' THEN
    IF NEW.user_id IS DISTINCT FROM target_owner THEN
      RAISE EXCEPTION 'personal workspace accepts only its verified owner'
        USING ERRCODE='23514',CONSTRAINT='memberships_personal_owner_only';
    END IF;
    IF NEW.status<>'active' THEN
      RAISE EXCEPTION 'personal workspace owner membership must remain active'
        USING ERRCODE='23514',CONSTRAINT='memberships_personal_owner_active';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER memberships_personal_workspace_guard
  BEFORE INSERT OR UPDATE OF organization_id,user_id,status ON memberships
  FOR EACH ROW EXECUTE FUNCTION app.enforce_personal_membership();

CREATE OR REPLACE FUNCTION app.enforce_personal_membership_role()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  target_workspace_type text;
  target_role_code text;
BEGIN
  SELECT organization.workspace_type,role.code
    INTO target_workspace_type,target_role_code
    FROM memberships membership
    JOIN organizations organization ON organization.id=membership.organization_id
    JOIN roles role ON role.id=NEW.role_id
    WHERE membership.id=NEW.membership_id;
  IF target_workspace_type='PERSONAL' AND target_role_code<>'REQUESTER' THEN
    RAISE EXCEPTION 'personal workspace membership may only have REQUESTER role'
      USING ERRCODE='23514',CONSTRAINT='membership_roles_personal_requester_only';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER membership_roles_personal_workspace_guard
  BEFORE INSERT OR UPDATE OF membership_id,role_id ON membership_roles
  FOR EACH ROW EXECUTE FUNCTION app.enforce_personal_membership_role();
