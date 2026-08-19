# Ticket Intake API — `ticket-intake.v1`

All routes are under `/api/v1`, require a bearer access token and
`X-Organization-Id`, and enforce both organization RLS and session ownership.
No route returns object-storage keys, provider credentials or raw rejected AI
values.

## Session lifecycle

`CREATED → UPLOADING → READY → TRANSCRIBING → ANALYZING → SUCCEEDED`

Provider errors stay in the active stage for bounded retry and become `FAILED`
after three attempts. Final draft creation changes the state to `CONSUMED`.
Unconsumed sessions become `EXPIRED` after 24 hours. A failed session can still
be submitted manually.

## Routes

- `POST /ticket-intakes` — create/idempotently recover a session. Optional
  body: `{ "description": "..." }`; optional `Idempotency-Key` header.
- `POST /ticket-intakes/:id/voice/upload-request` — body contains `filename`,
  `contentType`, `byteSize`, and `durationSeconds`. Returns a five-minute signed
  URL plus required `Content-Type` and `x-amz-meta-duration-seconds` headers.
- `POST /ticket-intakes/:id/voice/complete` — verifies S3 HEAD metadata and
  marks the object ready.
- `POST /ticket-intakes/:id/voice/discard` — deletes the temporary object and
  resets voice-derived state.
- `POST /ticket-intakes/:id/analyze` — idempotently queues transcription and/or
  analysis.
- `GET /ticket-intakes/:id` — returns pipeline state, original/combined text,
  accepted suggestions, missing/rejected field names and per-field confidence.
- `POST /tickets/drafts` — existing draft payload plus optional
  `intakeSessionId`; atomically creates the draft, provenance and voice
  attachment, then consumes the session.

## Voice policy

Allowed formats are WebM/Opus (`audio/webm`), OGG, WAV, MP3 and MP4
(`audio/mp4` or `video/mp4`). Maximum duration is 60 seconds and maximum size
is 10 MiB. MIME, content length and signed duration metadata are rechecked after
upload, immediately before transcription and before final attachment transfer.

## Structured analysis

The provider receives redacted combined text and the current organization's
category, subcategory, department, location, discipline and active custom-field
catalog. Output carries `contractVersion`, title, taxonomy IDs, priority,
custom fields, missing fields and confidence by field. Only values at or above
0.75 that validate against that catalog are returned in `suggestions`; rejected
field names are reported without persisting invalid values.
