CREATE OR REPLACE FUNCTION app.apply_usage_allowance_pool() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.allowance_pool_code IS NULL THEN NEW.allowance_pool_code:=CASE WHEN NEW.capability_code IN ('AI_TICKET_REVIEW','AI_SMART_INTAKE') THEN 'AI_SMART_ACTIONS' ELSE NEW.capability_code END; END IF;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION app.apply_addon_allowance_pool() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.allowance_pool_code IS NULL THEN NEW.allowance_pool_code:=CASE WHEN NEW.capability_code IN ('AI_TICKET_REVIEW','AI_SMART_INTAKE') THEN 'AI_SMART_ACTIONS' ELSE NEW.capability_code END; END IF;
  IF NEW.expires_at IS NULL THEN NEW.expires_at:=COALESCE(NEW.created_at,now())+interval '12 months'; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER commercial_usage_allowances_pool_before_insert ON commercial_usage_allowances;
DROP TRIGGER commercial_addon_allocations_pool_before_insert ON commercial_addon_allocations;
CREATE TRIGGER commercial_usage_allowances_pool_before_insert BEFORE INSERT ON commercial_usage_allowances FOR EACH ROW EXECUTE FUNCTION app.apply_usage_allowance_pool();
CREATE TRIGGER commercial_addon_allocations_pool_before_insert BEFORE INSERT ON commercial_addon_allocations FOR EACH ROW EXECUTE FUNCTION app.apply_addon_allowance_pool();
