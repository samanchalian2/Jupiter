-- Repair migration for installations that applied the first GOAL-040 migration.
DROP TRIGGER IF EXISTS commercial_usage_ledger_immutable ON commercial_usage_ledger;
CREATE TRIGGER commercial_usage_ledger_immutable BEFORE UPDATE ON commercial_usage_ledger FOR EACH ROW EXECUTE FUNCTION app.prevent_commercial_usage_ledger_mutation();
REVOKE UPDATE,DELETE ON commercial_usage_ledger FROM jupiter_app;
