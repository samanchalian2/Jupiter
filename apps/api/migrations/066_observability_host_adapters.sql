-- External host role mappings coexist with manual Hub grants and never own them.
ALTER TABLE observability.access_grants ADD COLUMN managed_by text CHECK(char_length(managed_by) BETWEEN 1 AND 100);
DROP INDEX observability.observability_active_grant;
CREATE UNIQUE INDEX observability_active_grant ON observability.access_grants(application_id,principal_id,COALESCE(environment_id,'00000000-0000-0000-0000-000000000000'::uuid),COALESCE(tenant_reference,''),COALESCE(managed_by,'')) WHERE revoked_at IS NULL;
