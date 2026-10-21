# AI Architecture

## GOAL-069 independent operational Investigator

DEC-059 operational Console edits existing output/context/concurrency/review
interval policy with service bounds/defaults. All environments/tenants share the
App monthly budget; scoped manual requests do not create extra allowance.
Configuration Audit records validated limits, never credentials. CommandContext
guards late save/analyze/reconciliation completion, without cancelling committed
server writes. Provider port, scheduling algorithm and commercial boundary stay.

Investigator consumes curated sanitized Hub events/technical feedback, never
Jupiter ticket bodies or files. The generic server accepts a provider port and
Application-bound credential vault; Jupiter's host supplies the allowlist and
deployment encryption key. Local owner-selected GapGPT uses `gpt-6-luna` with
an explicit 100,000 combined input/output token monthly budget. This is not a
customer Smart Action, Personal AI reservation or organization provider setting.

Each attempt reserves a conservative context byte/framing plus hard output
bound under an Application lock before provider dispatch. Safe actual counts
settle the operational attempt even when output validation fails; absent or
uncertain counts retain the bound as UNKNOWN. Findings require schema-valid
authorized evidence citations and remain read-only hypotheses for human review.
There is no tool execution or automatic business/permission/incident mutation.
Scheduling is deduplicated and concrete-tenant scoped (periodic/critical and
UTC daily/weekly). Human ADMIN reconciliation of UNKNOWN attempts requires a
reason and exact provider-verified counts, with immutable terminal values and
real-actor Audit. Console reconciliation requires explicit counts, verification
acknowledgement and reason; values start blank, not zero. Full-Goal acceptance
remains unfinished. The requested transcription model is only a disabled
local preference because Hub has no audio-input operation.

## GOAL-063 personal AI capacity foundation

Personal AI owns a separate `AI` allowance/package pool with a generic
idempotent `AI_ACTION` reservation boundary. It does not reuse the organization
`AI_SMART_ACTIONS` pool, commercial entitlement model or provider credential.
GOAL-063 implements/proves the capacity boundary only; later personal-product
integration must reserve before provider work, settle only a delivered action
and release failures through the same service.

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
