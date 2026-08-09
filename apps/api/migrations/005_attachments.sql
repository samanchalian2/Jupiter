CREATE TABLE ticket_attachments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL, ticket_id uuid NOT NULL,
 uploaded_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 storage_key text NOT NULL UNIQUE CHECK(char_length(storage_key) BETWEEN 1 AND 512),
 original_filename text NOT NULL CHECK(char_length(original_filename) BETWEEN 1 AND 255),
 content_type text NOT NULL,
 byte_size bigint NOT NULL CHECK(byte_size > 0 AND byte_size <= 52428800),
 state text NOT NULL DEFAULT 'PENDING' CHECK(state IN ('PENDING','AVAILABLE','REJECTED')),
 created_at timestamptz NOT NULL DEFAULT now(), available_at timestamptz,
 FOREIGN KEY(organization_id,ticket_id) REFERENCES tickets(organization_id,id) ON DELETE CASCADE
);
CREATE INDEX ticket_attachments_ticket_created ON ticket_attachments(ticket_id, created_at);
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY ticket_attachments_tenant ON ticket_attachments USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON ticket_attachments TO jupiter_app;
