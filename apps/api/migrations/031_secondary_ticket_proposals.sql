-- GOAL-021: secondary proposal IDs are server-generated JSON values on the
-- owned intake; this relation records only their accepted ticket links.
CREATE TABLE ticket_intake_secondary_ticket_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  intake_session_id uuid NOT NULL,
  proposal_id uuid NOT NULL,
  primary_ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT,
  secondary_ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id,intake_session_id,proposal_id),
  UNIQUE(secondary_ticket_id),
  FOREIGN KEY(organization_id,intake_session_id) REFERENCES ticket_intake_sessions(organization_id,id) ON DELETE RESTRICT
);

ALTER TABLE ticket_intake_secondary_ticket_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY ticket_intake_secondary_ticket_links_tenant ON ticket_intake_secondary_ticket_links
  USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
GRANT SELECT,INSERT,UPDATE,DELETE ON ticket_intake_secondary_ticket_links TO jupiter_app;
