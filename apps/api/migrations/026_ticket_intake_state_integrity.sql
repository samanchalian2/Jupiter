ALTER TABLE ticket_intake_sessions ADD CONSTRAINT ticket_intake_verified_voice_exists
  CHECK(voice_verified_at IS NULL OR voice_storage_key IS NOT NULL);
ALTER TABLE ticket_intake_sessions ADD CONSTRAINT ticket_intake_consumption_complete
  CHECK((status='CONSUMED')=(ticket_id IS NOT NULL AND consumed_at IS NOT NULL));
ALTER TABLE ticket_intake_sessions ADD CONSTRAINT ticket_intake_success_has_result
  CHECK(status<>'SUCCEEDED' OR analysis_result IS NOT NULL);

