CREATE TABLE knowledge_article_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES knowledge_articles(id) ON DELETE CASCADE,
  version integer NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  author_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(article_id, version)
);
ALTER TABLE knowledge_article_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY knowledge_article_revisions_tenant ON knowledge_article_revisions USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
GRANT SELECT,INSERT ON knowledge_article_revisions TO jupiter_app;
