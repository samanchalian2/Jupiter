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
- Web typecheck and web test suite passed (11 tests) after the owner-facing terminology refinement.

## Authenticated browser acceptance (2026-09-01)

- Authenticated Platform Commercial Console acceptance confirmed the compact Smart Action report at 375, 768, 1024 and 1440 px. All four RTL views had no document-level horizontal overflow and the report rendered without an API error.
- The Platform report presents only the intended operational projection: organization, capability, reservation status/source, model and aggregate telemetry. The live sample had no action rows; its empty state and explanatory copy expose no ticket text, prompt, transcript, credential or provider secret.
- Authenticated Owner dashboard acceptance confirmed the Persian RTL AI-usage section at 375, 768, 1024 and 1440 px, again with no document-level horizontal overflow. Capability codes are rendered with non-technical labels: «بررسی هوشمند تیکت» and «تکمیل هوشمند درخواست».
- The `jupiter-demo` organization had no active `AI_SMART_INTAKE` entitlement and no enabled organization feature setting during the check. Its manual ticket composer remained available and explicitly states that AI never submits a ticket automatically and that all fields remain editable before submission.
- A temporary `ORG_OWNER` assignment was used only to perform the Owner acceptance check, then removed exactly after it completed. The original ownerless state was restored and the restoration was recorded in the audit log.

## Deliberate limits

No provider framework, BYOK, payment, invoice, pricing, RAG, multimodal attachment analysis or automatic ticket submission was added. Manual ticketing remains available for every denied AI operation.
