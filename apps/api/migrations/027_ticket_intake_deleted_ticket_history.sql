ALTER TABLE ticket_intake_sessions DROP CONSTRAINT ticket_intake_consumption_complete;
ALTER TABLE ticket_intake_sessions ADD CONSTRAINT ticket_intake_consumed_timestamp
  CHECK(status<>'CONSUMED' OR consumed_at IS NOT NULL);
ALTER TABLE ticket_intake_sessions ADD CONSTRAINT ticket_intake_ticket_only_after_consumption
  CHECK(ticket_id IS NULL OR status='CONSUMED');
