# Business Rules

- A requester must review or edit AI suggestions before final submission.
- AI identifiers must validate against the active organization's catalog.
- Organization isolation and authorization are enforced by the backend.
- Experts see authorized department queues plus directly assigned tickets.
- Internal notes are never returned to requester endpoints.
- Assignment and status changes are immutable auditable events.
- `RESOLVED` and `CLOSED` are distinct. Closure is organization-configurable:
  requester confirmation, automatic expiration, or authorized staff only.
- Reopen obeys the organization window; otherwise a related new ticket is made.
- One requester rating is accepted only after resolution or closure.
- AI, transcription, and file failures cannot block manual ticket submission.
- AI intake never submits a ticket; final creation always requires the user's
  explicit draft request.
- The typed description is retained verbatim. Voice transcription is appended
  and never silently replaces it.
- Intake suggestions below 0.75 confidence or outside the active tenant
  taxonomy/custom-field catalog are rejected rather than applied.
- Only active tenant title and tag vocabulary is supplied to AI. New title/tag
  candidates are recorded only after explicit final ticket submission and stay
  pending until Organization Admin approval.
- Intake voice is limited to 60 seconds and 10 MB, must pass post-upload
  metadata verification, and expires with an unconsumed session after 24 hours.
- An intake may contain up to five requester text or voice messages. Raw
  requester text and voice transcripts are immutable source evidence; AI
  interpretation is separate and never replaces them.
- An AI clarification is optional and must not block final ticket creation.
  A secondary issue only becomes another ticket after explicit requester action.
