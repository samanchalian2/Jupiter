-- PostgreSQL's regular-expression dialect does not treat \s as a portable
-- whitespace class. Keep route validation explicit and forward-only.
ALTER TABLE product_help_article_revisions
  DROP CONSTRAINT product_help_article_revisions_related_route_check;
ALTER TABLE product_help_article_revisions
  ADD CONSTRAINT product_help_article_revisions_related_route_check
  CHECK (related_route IS NULL OR (related_route ~ '^/' AND related_route !~ '[[:space:]]'));
