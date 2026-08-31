# AI Architecture

## GOAL-051 complete AI Smart Action coverage

`AI_TICKET_REVIEW` and `AI_SMART_INTAKE` now use the same commercial boundary: effective capability resolution, one idempotent reservation before queue/provider work, safe telemetry, and one settlement only after a valid persisted result is available to the requester. Smart Intake's text, conversation, title, taxonomy, secondary-issue and voice stages share its single reservation. Standalone attachment transcription remains non-commercial. Telemetry deliberately stores only provider/model, token counts, audio duration, estimated cost and outcome; it stores no prompt, ticket text, transcript, file or credential.

The AI Gateway isolates ticketing from providers. Its adapter, context builder,
prompt registry, structured-output validator, redactor, usage recorder, and
retry policy are separate responsibilities. Initial adapter: OpenAI API;
future providers implement the same contract.

Only Platform Admin configures provider credentials and models. Secrets are
encrypted at rest, masked after save, and never committed or logged. An
organization may be enabled or disabled for AI under platform policy.

The OpenAI-compatible configuration is organization-scoped: Base URL, one
shared API key, an analysis model and a transcription model. AES-256-GCM uses a
unique IV per credential and a deployment-owned 32-byte master key. API reads
expose only whether a credential exists. Production URLs require HTTPS and an
explicit host allowlist; loopback HTTP exists only for development fakes.

Analysis runs asynchronously. A draft survives provider failure; users can
submit manually. Output is schema-versioned and may contain only validated
tenant taxonomy IDs: title, normalized description, category/subcategory,
department, discipline, optional location, priority, tags, missing fields,
initial AI response, confidence, and metadata. Low confidence never causes a
deterministic assignment.

Pre-ticket analysis uses `ticket-intake.v2`. A worker first transcribes an
optional verified object through Audio Transcriptions, appends that text to the
unchanged typed description, and calls Chat Completions structured output with
only the current tenant catalog. Each proposed field carries confidence; the
application validates IDs, custom-field types/options and the 0.75 threshold
before persisting suggestions. Active tenant title-library and typed-tag values
are additional optional context; new values remain pending until Organization
Admin approval and are recorded only after final ticket submission. Provider
retries use a bounded lease and three attempts; a terminal failure retains all
manual input.

`ticket-intake.v3` additionally accepts an ordered short conversation of text
and voice messages. Raw requester messages and transcripts remain separate
from the AI interpretation. The provider resolves corrections, negation and
multi-issue statements before proposing one primary issue, optional secondary
issues and an optional clarification question. It cannot create a secondary
ticket or block manual final submission.

## Commercial Smart Action metering

The AI Gateway remains the sole provider boundary and Platform Admin remains
the sole owner of provider credentials. Commercial usage is a separate domain:
provider token/cost telemetry supports operations, while customer allowance is
settled only by a successfully delivered Commercial Smart Action. Connection
tests, diagnostics, retries, transcription plumbing and provider failures are
never customer-billable.

Commercial gating is server-side and combines entitlement, organization policy,
platform availability and remaining allowance. A lack of commercial AI access
never blocks manual ticketing or changes the explicit-submission, confidence,
tenant-taxonomy or immutable-input invariants.

GOAL-041 applies this boundary to the customer-facing `AI_TICKET_REVIEW`
Smart Action. The gateway reserves one unit before permitted work begins,
releases it when no deliverable result exists, and settles it exactly once only
after the authorized result has been persisted. The action reservation, usage
ledger event and minimal settlement audit remain distinct from provider
telemetry.
