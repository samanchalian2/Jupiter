-- Safe, reversible Platform organization deletion. Data remains intact while
-- tenant access is denied; physical purge is deliberately outside this scope.
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_status_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_status_check
  CHECK (status IN ('setup','active','suspended','archived'));

ALTER TABLE organizations
  ADD COLUMN archived_at timestamptz,
  ADD COLUMN archived_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  ADD COLUMN archive_reason text,
  ADD CONSTRAINT organizations_archive_shape_check CHECK (
    (
      status='archived'
      AND archived_at IS NOT NULL
      AND archived_by_user_id IS NOT NULL
      AND char_length(archive_reason) BETWEEN 10 AND 500
    ) OR (
      status<>'archived'
      AND archived_at IS NULL
      AND archived_by_user_id IS NULL
      AND archive_reason IS NULL
    )
  );

CREATE TABLE organization_archive_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('ARCHIVED','RESTORED')),
  from_status text NOT NULL CHECK (from_status IN ('suspended','archived')),
  to_status text NOT NULL CHECK (to_status IN ('suspended','archived')),
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 10 AND 500),
  idempotency_key uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id,idempotency_key)
);

CREATE INDEX organization_archive_transitions_history
  ON organization_archive_transitions(organization_id,created_at DESC);

GRANT SELECT,INSERT ON organization_archive_transitions TO jupiter_app;
