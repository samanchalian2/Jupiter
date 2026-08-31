-- GOAL-051: a commercial unit remains one delivered Smart Action while
-- provider telemetry is retained separately and never becomes a billing unit.
ALTER TABLE commercial_smart_actions
  ADD COLUMN IF NOT EXISTS actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subject_type text,
  ADD COLUMN IF NOT EXISTS subject_id uuid;

ALTER TABLE ai_requests ADD COLUMN IF NOT EXISTS idempotency_key uuid;
CREATE UNIQUE INDEX IF NOT EXISTS ai_requests_organization_idempotency_key ON ai_requests(organization_id,idempotency_key) WHERE idempotency_key IS NOT NULL;
ALTER TABLE ticket_intake_sessions ADD COLUMN IF NOT EXISTS smart_action_key uuid;

CREATE TABLE IF NOT EXISTS ai_operation_telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  commercial_smart_action_id uuid REFERENCES commercial_smart_actions(id) ON DELETE SET NULL,
  operation_code text NOT NULL CHECK (operation_code ~ '^[A-Z0-9_.-]{2,120}$'),
  outcome text NOT NULL CHECK (outcome IN ('SUCCEEDED','FAILED','RETRY','RELEASED')),
  provider text,
  model text,
  input_tokens integer CHECK (input_tokens IS NULL OR input_tokens >= 0),
  output_tokens integer CHECK (output_tokens IS NULL OR output_tokens >= 0),
  audio_duration_seconds numeric(10,3) CHECK (audio_duration_seconds IS NULL OR audio_duration_seconds >= 0),
  estimated_cost numeric(16,8) CHECK (estimated_cost IS NULL OR estimated_cost >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_operation_telemetry_reporting_idx ON ai_operation_telemetry(organization_id,operation_code,created_at DESC);
ALTER TABLE ai_operation_telemetry ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_operation_telemetry_tenant ON ai_operation_telemetry USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
GRANT SELECT,INSERT ON ai_operation_telemetry TO jupiter_app;
