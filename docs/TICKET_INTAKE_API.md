# Ticket Intake API — `ticket-intake.v6`

All routes are under `/api/v1`, require a bearer access token and
`X-Organization-Id`, and enforce both organization RLS and session ownership.
No route returns object-storage keys, provider credentials or raw rejected AI
values.

## Session lifecycle

`CREATED → TRANSCRIBING → ANALYZING → SUCCEEDED`

Provider errors stay in the active stage for bounded retry and become `FAILED`
after three attempts. Final draft creation changes the state to `CONSUMED`.
Unconsumed sessions become `EXPIRED` after 24 hours. A failed session can still
be submitted manually.

Before final submission, the requester may explicitly destroy their own session
with the cancellation route. This removes its raw messages, interpretation and
temporary voice objects; it is not a ticket-lifecycle cancellation.

## Routes

- `GET /ticket-intakes/capabilities` — returns the requester-visible effective
  `{ "smartIntakeEnabled": boolean }` policy for the current organization.
- `POST /ticket-intakes` — create/idempotently recover a session. Optional
  legacy body: `{ "description": "..." }`; optional `Idempotency-Key` header.
- `POST /ticket-intakes/:id/messages` — add a raw requester text message:
  `{ "text": "..." }`.
- `POST /ticket-intakes/:id/messages/voice/upload-request` — create a new
  requester voice message and return its signed upload URL.
- `POST /ticket-intakes/:id/messages/:messageId/voice/complete` — verify one
  uploaded voice message.
- `POST /ticket-intakes/:id/messages/:messageId/discard` — discard an intake
  message and its temporary voice object when applicable.
- `POST /ticket-intakes/:id/cancel` — explicitly destroy the owner's
  unsubmitted intake. The server locks ownership, removes temporary audio,
  clears pending processing work and deletes the session plus its messages. A
  consumed session is rejected and the associated ticket is never changed.
- `POST /ticket-intakes/:id/conversation/analyze` — queue analysis of every
  retained requester message. Text and voice share this route.
- `POST /ticket-intakes/:id/voice/upload-request` — body contains `filename`,
  `contentType`, `byteSize`, and `durationSeconds`. Returns a five-minute signed
  URL plus required `Content-Type` and `x-amz-meta-duration-seconds` headers.
- `POST /ticket-intakes/:id/voice/complete` — verifies S3 HEAD metadata and
  marks the object ready.
- `POST /ticket-intakes/:id/voice/discard` — deletes the temporary object and
  resets voice-derived state.
- Legacy single-voice routes remain available for existing sessions; all new
  requester UI uses the multi-message routes above.
- `GET /ticket-intakes/:id` — returns pipeline state, original/combined text,
  accepted suggestions, missing/rejected field names and per-field confidence.
- `POST /tickets/drafts` — existing draft payload plus optional
  `intakeSessionId`; atomically creates the draft, provenance and voice
  attachment, then consumes the session.
- `POST /tickets/intake-batches` — primary draft plus `intakeSessionId` and
  selected `secondaryProposalIds`; submits all selected valid proposals in one transaction.

## Voice policy

Allowed formats are WebM/Opus (`audio/webm`), OGG, WAV, MP3 and MP4
(`audio/mp4` or `video/mp4`). Maximum duration is 60 seconds and maximum size
is 10 MiB. MIME, content length and signed duration metadata are rechecked after
upload, immediately before transcription and before final attachment transfer.

## Guided structured analysis

Smart Intake is controlled separately from the platform-managed provider
credential. When it is disabled by the Organization Admin, text, file and
voice intake remain available and verified voice remains eligible for transfer
to the primary ticket, but either analysis route returns `403` and no
transcription or provider call is queued.

The provider receives redacted ordered requester messages and the current organization's
category, subcategory, department, location, discipline, active custom-field,
active title-library and active typed-tag catalog. Output carries
`contractVersion`, a concise title with an optional reused title-library ID,
taxonomy IDs, priority, up to five typed tag proposals, custom fields, missing
fields and confidence by field. `v3` additionally returns a separate
interpretation, one primary issue, up to two secondary issues and an optional
concise clarification question. These fields never replace raw requester text.
When a requester adds a clarification, the prior primary issue is supplied as
an analysis anchor: the earliest distinct issue remains primary unless the
requester explicitly corrects or replaces it.
A secondary issue is a server-owned, privacy-preserving ticket proposal. It is
created only after explicit selection and batch confirmation with the primary ticket.
Voice, files, raw messages and transcripts never transfer to it. A proposal is
selectable only when its server-validated title, standalone description,
priority and supplied taxonomy values are structurally valid for the tenant.
Its `requiresReview` flag is true below confidence `0.75`; the UI must show a
warning and repeat it in the final confirmation, but an explicit requester
selection may still submit it. Incomplete, invalid or foreign-tenant proposals
remain unavailable. Only values at or above 0.75 that validate against that
catalog are returned in primary-ticket `suggestions`; rejected field names are
reported without persisting invalid values. New title/tag candidates are saved
only when the user explicitly creates the final draft and remain pending for
Organization Admin review.
