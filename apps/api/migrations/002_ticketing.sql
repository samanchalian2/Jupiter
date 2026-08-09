CREATE TABLE tickets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
 requester_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT, ticket_number bigint GENERATED ALWAYS AS IDENTITY,
 title text NOT NULL CHECK(char_length(title) BETWEEN 3 AND 200), description text NOT NULL CHECK(char_length(description) BETWEEN 1 AND 10000),
 status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER','RESOLVED','CLOSED')),
 priority text NOT NULL DEFAULT 'NORMAL' CHECK(priority IN ('LOW','NORMAL','HIGH','URGENT')),
 category_id uuid, subcategory_id uuid, department_id uuid, location_id uuid, discipline_id uuid,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(organization_id,ticket_number), UNIQUE(organization_id,id),
 FOREIGN KEY(organization_id,category_id) REFERENCES categories(organization_id,id),
 FOREIGN KEY(organization_id,department_id) REFERENCES departments(organization_id,id),
 FOREIGN KEY(organization_id,location_id) REFERENCES locations(organization_id,id),
 FOREIGN KEY(organization_id,discipline_id) REFERENCES disciplines(organization_id,id));
CREATE TABLE ticket_assignments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL, ticket_id uuid NOT NULL,
 assigned_to_user_id uuid NOT NULL REFERENCES users(id), assigned_by_user_id uuid NOT NULL REFERENCES users(id),
 assigned_at timestamptz NOT NULL DEFAULT now(), ended_at timestamptz,
 FOREIGN KEY(organization_id,ticket_id) REFERENCES tickets(organization_id,id) ON DELETE CASCADE);
CREATE UNIQUE INDEX ticket_active_assignment ON ticket_assignments(ticket_id) WHERE ended_at IS NULL;
CREATE TABLE ticket_status_transitions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL, ticket_id uuid NOT NULL,
 from_status text, to_status text NOT NULL, changed_by_user_id uuid NOT NULL REFERENCES users(id),
 reason text, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,ticket_id) REFERENCES tickets(organization_id,id) ON DELETE CASCADE);
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY; ALTER TABLE ticket_assignments ENABLE ROW LEVEL SECURITY; ALTER TABLE ticket_status_transitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tickets_tenant ON tickets USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
CREATE POLICY ticket_assignments_tenant ON ticket_assignments USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
CREATE POLICY ticket_transitions_tenant ON ticket_status_transitions USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
