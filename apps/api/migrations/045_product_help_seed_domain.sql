-- GOAL-046: platform-owned Product Help. This is deliberately not tenant data.
-- Repository documents may create the first published revision only; later
-- runtime revisions remain the source of truth.
CREATE TABLE product_help_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{2,120}$'),
  status text NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED','UNPUBLISHED')),
  current_published_revision_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE product_help_article_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES product_help_articles(id) ON DELETE CASCADE,
  version integer NOT NULL CHECK (version > 0),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  summary text NOT NULL CHECK (char_length(summary) BETWEEN 3 AND 600),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 50000),
  category text NOT NULL CHECK (char_length(category) BETWEEN 2 AND 100),
  audience text[] NOT NULL CHECK (cardinality(audience) > 0 AND audience <@ ARRAY['REQUESTER','EXPERT','SUPERVISOR','ORG_ADMIN','ORG_OWNER','PLATFORM_ADMIN','ALL']::text[]),
  tags text[] NOT NULL DEFAULT '{}'::text[] CHECK (cardinality(tags) <= 20),
  product_area text NOT NULL CHECK (char_length(product_area) BETWEEN 2 AND 100),
  related_feature text,
  related_route text CHECK (related_route IS NULL OR (related_route ~ '^/' AND related_route !~ '[[:space:]]')),
  publication_status text NOT NULL DEFAULT 'DRAFT' CHECK (publication_status IN ('DRAFT','PUBLISHED','UNPUBLISHED')),
  source text NOT NULL CHECK (source IN ('REPOSITORY_SEED','RUNTIME')),
  source_key text,
  source_checksum text,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(article_id, version)
);

ALTER TABLE product_help_articles
  ADD CONSTRAINT product_help_articles_current_revision_fk
  FOREIGN KEY (current_published_revision_id) REFERENCES product_help_article_revisions(id) ON DELETE SET NULL;

CREATE INDEX product_help_articles_published_idx ON product_help_articles(status, updated_at DESC);
CREATE INDEX product_help_article_revisions_discovery_idx ON product_help_article_revisions(product_area, category, publication_status, published_at DESC);
CREATE INDEX product_help_article_revisions_audience_idx ON product_help_article_revisions USING GIN(audience);

GRANT SELECT, INSERT, UPDATE ON product_help_articles, product_help_article_revisions TO jupiter_app;
