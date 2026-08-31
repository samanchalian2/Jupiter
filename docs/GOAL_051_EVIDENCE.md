# GOAL-051 — Complete AI Smart Action Metering Coverage

## Delivered boundary

- Migration `049_ai_smart_action_metering.sql` adds actor and safe subject references to `commercial_smart_actions`, request/intake idempotency references and tenant-RLS `ai_operation_telemetry`.
- Ticket Review and Smart Intake reserve an effective capability before queue/provider work. A valid, persisted result settles exactly once; failure, validation rejection, cancellation and expiry release the reservation.
- Text, conversation and voice Smart Intake stages share one `AI_SMART_INTAKE` action. Standalone attachment transcription is not commercialized.
- Telemetry keeps operation/outcome, provider/model, token totals, duration and optional cost only. No prompt, ticket text, transcript, file or secret is stored.

## API and UI

- Platform: `GET /platform/commercial/smart-actions` returns a Platform-Admin-only safe operational projection.
- Owner: `GET /platform/commercial/owner/smart-actions` returns capability/source consumption totals only for `ORG_OWNER`.
- Ticket Review accepts `Idempotency-Key`; the owner commercial dashboard explains consumption and the Platform commercial console shows a compact safe report.

## Verification

- API typecheck passed.
- Migration runner applied through migration 049 successfully.
- API test suite passed: 26 files, 89 tests, including Ticket Review idempotency and Smart Intake settlement/telemetry assertions.

## Deliberate limits

No provider framework, BYOK, payment, invoice, pricing, RAG, multimodal attachment analysis or automatic ticket submission was added. Manual ticketing remains available for every denied AI operation.
