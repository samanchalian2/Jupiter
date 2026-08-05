# AI Architecture

The AI Gateway isolates ticketing from providers. Its adapter, context builder,
prompt registry, structured-output validator, redactor, usage recorder, and
retry policy are separate responsibilities. Initial adapter: OpenAI API;
future providers implement the same contract.

Only Platform Admin configures provider credentials and models. Secrets are
encrypted at rest, masked after save, and never committed or logged. An
organization may be enabled or disabled for AI under platform policy.

Analysis runs asynchronously. A draft survives provider failure; users can
submit manually. Output is schema-versioned and may contain only validated
tenant taxonomy IDs: title, normalized description, category/subcategory,
department, discipline, optional location, priority, tags, missing fields,
initial AI response, confidence, and metadata. Low confidence never causes a
deterministic assignment.
