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

## Master Upgrade rules

- Organization applications use only the statuses in DEC-020. Applicant
  submission requires verified email. Platform review follows `SUBMITTED` →
  `UNDER_REVIEW` → `NEEDS_INFORMATION`/`REJECTED`/`APPROVED`; information and
  rejection require an applicant-visible note. Approval provisions exactly one
  `setup` tenant and initial applicant owner/admin membership atomically.
- Existing organizations remain operational without an `ORG_OWNER`; owner-only
  commercial actions require explicit Platform Admin assignment.
- Directory synchronization will provision users and memberships only. It never
  receives, stores or validates AD passwords, and can map only REQUESTER,
  EXPERT and SUPERVISOR roles.
- Directory connector pairing is organization-bound and owner/admin controlled.
  A pairing code is single-use for 15 minutes; revoking a connector invalidates
  its device credential and unused pairing material. GOAL-036 has no directory
  synchronization behavior.
- A directory sync produces a preview before apply. It may create, update,
  suspend, mark out-of-scope or leave a principal unchanged. Disabled accounts
  suspend immediately; full-sync scope exit has a seven-day grace. Directory
  synchronization never assigns or changes ORG_ADMIN or ORG_OWNER.
- Effective commercial capability will require entitlement, organization setting
  and platform availability. Server-side checks are mandatory.
- A provider call is not customer-billable. One allowance unit settles only on
  a unique, successfully delivered Commercial Smart Action; the delivered AI
  ticket review is the first implementation of this rule.
- Jupiter Assist use will settle only when a Jupiter agent accepts a permitted
  case. A request, routing, reassignment or reopen does not consume a unit.
- Restricted tickets will require a matching active support grant even when broad
  Jupiter support is otherwise enabled.
- A Jupiter support agent is never a tenant member. Its access comes only from
  an active, unrevoked and unexpired support grant; a restricted ticket needs a
  matching explicit routed-ticket grant even when full support exists.
- Product Help is platform-owned, not tenant knowledge. Only an article's
  current revision with both article and revision publication state `PUBLISHED`
  may be returned, and only where its audience intersects the caller's exact
  active role/platform audience (or `ALL`). Missing, draft, unpublished and
  unauthorized slugs share the same non-disclosing result.
- Repository Help content may create an initial published revision only. A
  later seed run must not alter an existing article or runtime revision.
- Only Platform Admin can create, draft, preview, publish, unpublish, restore
  or export Product Help. Every edit appends a revision; restore copies a
  selected prior revision into a new draft rather than changing history.
- Publishing makes one selected revision current and unpublishes a preceding
  published revision. Exports return only current published runtime content and
  may be scoped to one slug, one category or all Help.
- Only Platform Admin may change platform appearance. It accepts only approved
  brand, density and radius presets plus an internal managed logo path;
  organization branding cannot alter semantic colors, density, radius or
  security-sensitive UI.
