CREATE TABLE ticket_title_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL CHECK(char_length(btrim(title)) BETWEEN 3 AND 200),
  normalized_title text NOT NULL CHECK(char_length(normalized_title) BETWEEN 3 AND 200),
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','ACTIVE','DISABLED')),
  usage_count integer NOT NULL DEFAULT 0 CHECK(usage_count >= 0),
  created_from_ticket_id uuid REFERENCES tickets(id) ON DELETE SET NULL,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id,normalized_title)
);

INSERT INTO ticket_title_library(organization_id,title,normalized_title,status,usage_count,created_from_ticket_id,created_by_user_id)
SELECT organization_id, min(title), lower(regexp_replace(btrim(title),'\\s+',' ','g')), 'PENDING', count(*)::int,
  (array_agg(id ORDER BY id))[1], (array_agg(requester_user_id ORDER BY requester_user_id))[1]
FROM tickets GROUP BY organization_id,lower(regexp_replace(btrim(title),'\\s+',' ','g'))
ON CONFLICT(organization_id,normalized_title) DO NOTHING;

ALTER TABLE ticket_tags ADD COLUMN kind text NOT NULL DEFAULT 'OTHER' CHECK(kind IN ('DOMAIN','SERVICE_ASSET','ISSUE_TYPE','IMPACT_SCOPE','CONTEXT','OTHER'));
ALTER TABLE ticket_tags ADD COLUMN status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('PENDING','ACTIVE','DISABLED'));
ALTER TABLE ticket_tags ADD COLUMN normalized_name text;
ALTER TABLE ticket_tags ADD COLUMN usage_count integer NOT NULL DEFAULT 0 CHECK(usage_count >= 0);
UPDATE ticket_tags SET normalized_name=lower(regexp_replace(btrim(name),'\\s+',' ','g')) WHERE normalized_name IS NULL;
ALTER TABLE ticket_tags ALTER COLUMN normalized_name SET NOT NULL;
ALTER TABLE ticket_tags ADD CONSTRAINT ticket_tags_organization_normalized_name_unique UNIQUE(organization_id,normalized_name);
UPDATE ticket_tags tag SET usage_count=(SELECT count(*)::int FROM ticket_tag_links link WHERE link.tag_id=tag.id);

ALTER TABLE ticket_title_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY ticket_title_library_tenant ON ticket_title_library
  USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
GRANT SELECT,INSERT,UPDATE,DELETE ON ticket_title_library TO jupiter_app;
