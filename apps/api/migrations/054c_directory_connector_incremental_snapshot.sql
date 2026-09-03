-- GOAL-054: the scheduled mode is a snapshot comparison, never a claim of AD delta tracking.
UPDATE directory_sync_runs SET sync_kind='INCREMENTAL_SNAPSHOT' WHERE sync_kind='DELTA';
ALTER TABLE directory_sync_runs DROP CONSTRAINT IF EXISTS directory_sync_runs_sync_kind_check;
ALTER TABLE directory_sync_runs ADD CONSTRAINT directory_sync_runs_sync_kind_check CHECK (sync_kind IN ('FULL','INCREMENTAL_SNAPSHOT'));
