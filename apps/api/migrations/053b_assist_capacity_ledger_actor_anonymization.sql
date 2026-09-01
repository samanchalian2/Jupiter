-- GOAL-053 correction for environments that applied the first follow-up.
CREATE OR REPLACE FUNCTION forbid_assist_capacity_ledger_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='UPDATE' AND OLD.actor_user_id IS NOT NULL AND NEW.actor_user_id IS NULL
    AND (to_jsonb(NEW)-'actor_user_id') = (to_jsonb(OLD)-'actor_user_id') THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'assist capacity ledger is immutable';
END;
$$;
