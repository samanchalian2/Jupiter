CREATE TABLE user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  occurred_at timestamptz NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX user_notifications_inbox ON user_notifications(organization_id,user_id,created_at DESC);
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_notifications_tenant ON user_notifications USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
GRANT SELECT,INSERT,UPDATE,DELETE ON user_notifications TO jupiter_app;
