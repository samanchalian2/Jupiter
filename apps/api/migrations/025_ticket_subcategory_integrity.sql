ALTER TABLE subcategories ADD CONSTRAINT subcategories_tenant_category_id_unique UNIQUE(organization_id,category_id,id);
ALTER TABLE tickets ADD CONSTRAINT tickets_subcategory_requires_category CHECK(subcategory_id IS NULL OR category_id IS NOT NULL);
ALTER TABLE tickets ADD CONSTRAINT tickets_subcategory_tenant_fk
  FOREIGN KEY(organization_id,category_id,subcategory_id)
  REFERENCES subcategories(organization_id,category_id,id);
