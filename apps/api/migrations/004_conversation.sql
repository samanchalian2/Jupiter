CREATE TABLE ticket_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL, ticket_id uuid NOT NULL,
 author_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 body text NOT NULL CHECK(char_length(body) BETWEEN 1 AND 10000),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,ticket_id) REFERENCES tickets(organization_id,id) ON DELETE CASCADE
);
CREATE INDEX ticket_messages_ticket_created ON ticket_messages(ticket_id, created_at);

CREATE TABLE ticket_internal_notes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL, ticket_id uuid NOT NULL,
 author_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 body text NOT NULL CHECK(char_length(body) BETWEEN 1 AND 10000),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,ticket_id) REFERENCES tickets(organization_id,id) ON DELETE CASCADE
);
CREATE INDEX ticket_internal_notes_ticket_created ON ticket_internal_notes(ticket_id, created_at);

CREATE TABLE ticket_activities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL, ticket_id uuid NOT NULL,
 actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
 activity_type text NOT NULL CHECK(activity_type ~ '^[a-z][a-z0-9_.-]{2,100}$'),
 visibility text NOT NULL CHECK(visibility IN ('REQUESTER','STAFF')),
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,ticket_id) REFERENCES tickets(organization_id,id) ON DELETE CASCADE
);
CREATE INDEX ticket_activities_ticket_created ON ticket_activities(ticket_id, created_at);

ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY ticket_messages_tenant ON ticket_messages USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
CREATE POLICY ticket_internal_notes_tenant ON ticket_internal_notes USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
CREATE POLICY ticket_activities_tenant ON ticket_activities USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());

GRANT SELECT, INSERT ON ticket_messages, ticket_internal_notes, ticket_activities TO jupiter_app;
REVOKE UPDATE, DELETE ON ticket_messages, ticket_internal_notes, ticket_activities FROM jupiter_app;
