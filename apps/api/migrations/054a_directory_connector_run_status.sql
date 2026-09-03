ALTER TABLE directory_connectors DROP CONSTRAINT IF EXISTS directory_connectors_last_sync_status_check;
ALTER TABLE directory_connectors ADD CONSTRAINT directory_connectors_last_sync_status_check CHECK(last_sync_status IS NULL OR last_sync_status IN ('RUNNING','SUCCEEDED','PARTIAL','FAILED','CANCELLED'));
