# AI Architecture

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
