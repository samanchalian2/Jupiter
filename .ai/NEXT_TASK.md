# Next Task

## GOAL-022 — Reviewable AI secondary proposals and stable smart completion

**Status:** COMPLETE (local verification, 2026-08-24)

`ticket-intake.v5` keeps primary-field auto-apply at
the 0.75 confidence gate, permits only structurally valid low-confidence
secondary proposals to be selected with an explicit final warning, and lets a
requester add a context-bound text or voice clarification before analysis is
run again. The composer remains visible while analysis is running and only
collapses after success. API typecheck, 53 API tests, Web typecheck, 11 Web
tests, production builds and local browser acceptance passed.

## GOAL-021 — Confirmed AI secondary-ticket batches

**Status:** COMPLETE (local verification, 2026-08-23)

The v4 provider contract, server-generated secondary proposal IDs, atomic batch
submission and requester confirmation UI are complete. See DEC-012.

## GOAL-020 — Multimodal guided ticket-intake conversation

**Status:** COMPLETE (local verification, 2026-08-23)

The approved text/voice conversation, immutable raw messages, separate AI
interpretation, optional clarification and multiple voice attachment handoff
are complete. See `docs/TICKET_INTAKE_API.md`.

## Voice re-record replacement

**Status:** COMPLETE (local verification, 2026-08-23)

A re-record operation removes the precisely tracked prior intake transcript
from the composer description while retaining surrounding typed content. The
next voice analysis therefore appends only the fresh transcript.

## Voice-intake upload recovery

**Status:** COMPLETE (local verification, 2026-08-22)

The recorded-voice presigned upload now signs its required duration metadata
header, so MinIO accepts the browser PUT and the session can advance from
`UPLOADING` to verification, transcription and analysis. A real metadata-bearing
WebM-style PUT and a synthetic non-personal transcription request passed. The
composer converts the browser's WebM/Opus capture to provider-compatible WAV
before upload because the real provider rejected WebM after successful upload
verification. A generated-WAV run reached `SUCCEEDED` through the worker and
provider; intake polling has its own bounded request budget so it cannot
exhaust the normal application allowance. An already-open composer upgrades a
retained WebM capture locally on its next operation. See
`docs/VOICE_INTAKE_UPLOAD_EVIDENCE.md`.

## Local object-storage recovery

**Status:** COMPLETE (local verification, 2026-08-22)

`pnpm dev` now establishes local S3-compatible storage before the application
processes start. MinIO liveness, bucket availability and an actual signed
PNG-style upload/metadata/cleanup path were verified. A logo whose earlier
browser upload failed while storage was unavailable must be uploaded again;
the failed operation deliberately did not replace the prior logo. See
`docs/LOCAL_OBJECT_STORAGE_EVIDENCE.md`.

## GOAL-019 — Smart composer, vocabulary management, search and reporting

**Status:** COMPLETE (local verification, 2026-08-22)

`ticket-intake.v2` tag suggestions, manual typed-tag selection, Organization
Admin title/tag review, tag-aware search/queue filters and reporting are
implemented and covered by API/Web tests and production builds. An
authenticated browser run confirmed a non-copy AI title plus the responsive
composer/tag interface at 375/768/1440 px without horizontal overflow. The
approved starter template is installed in Jupiter Demo Organization (nine
categories and 24 subcategories); a real provider run applied category,
subcategory, priority and five typed tag candidates. New candidates remain
subject to the existing final-submit and Organization Admin review workflow.
See `docs/GOAL_019_EVIDENCE.md`.

## GOAL-015 — Smart ticket composer and acceptance E2E

**Status:** COMPLETE (local verification, 2026-08-19)

The description-first composer, AI/microphone toolbar, one-minute recorder,
playback/delete/re-record controls, signed upload headers, processing/fallback
states, direct accepted suggestions, AI provenance badges, low-confidence
Persian guidance and explicit final submission are implemented. Authenticated
REQUESTER acceptance passed at 375, 768 and 1440 pixels with no overflow; the
complete release gate passes. See `docs/GOAL_015_EVIDENCE.md`.

There is no further local smart-intake Goal. The next unfinished product gate
is the external staging-only Phase 9 checklist below.

**External runtime note:** the real provider currently returns
`429 billing_not_active`. GOAL-015 development and automated acceptance can use
the deterministic provider fake; live inference will require the project
owner to activate API billing before staging acceptance.

## Local runtime resilience

**Status:** COMPLETE (local verification, 2026-08-19)

The local API defaults to the Windows PostgreSQL service port 5432 and its SLA
interval cannot terminate the process when the database is temporarily
unavailable; its ignored local environment has a persistent JWT key so restarts
do not invalidate local browser sessions. API typecheck and a real local
bootstrap-admin login passed. The next unfinished roadmap work remains the
staging-only Phase 9 gates below.

## List hover readability

**Status:** COMPLETE (local verification, 2026-08-15)

List-row hover and keyboard-focus styles now preserve readable foreground text
and use a restrained branded surface. The next unfinished roadmap work remains
the staging-only Phase 9 gates below.

## Brand color update

**Status:** COMPLETE (local verification, 2026-08-15)

The primary Jupiter purple is `#6d5587`, with white primary-button text and
accessible hover, soft-surface, border, focus, and ticket-tag companion values.
The next unfinished roadmap work remains the staging-only Phase 9 gates below.

## Control and icon color consistency

**Status:** COMPLETE (local verification, 2026-08-15)

Buttons and interactive/navigation icons consistently use the `#6d5587` brand
token, with white text retained on primary-filled buttons.

## Organization branding

**Status:** COMPLETE (local verification, 2026-08-15)

The supplied logo is the default identity asset. Organization administrators
have a branded, role-protected upload control with preview and Persian guidance:
PNG/JPEG/WebP only, maximum 2 MB, and a recommended square 512 × 512 px source.
Migration 021 applied; API typecheck, 31 API tests, and web typecheck/production build
pass. The next unfinished roadmap work remains the staging-only Phase 9 gates.

## Browser identity

**Status:** COMPLETE (local verification, 2026-08-15)

The supplied logo is served as the standard favicon and the document title is
the full Jupiter product title. The favicon follows an administrator's active
organization-logo update.

## Brand mark continuity

**Status:** COMPLETE (local verification, 2026-08-15)

The displayed logo is 46px (about 21% larger). The browser retains the latest
organization logo through sign-out so that the login screen uses it too, while
safely falling back to the built-in Jupiter mark if the secured URL is no longer
available.

## Responsive administration and local object storage

**Status:** COMPLETE (local verification, 2026-08-15)

Administration tables now use contained horizontal scrolling on narrow screens;
all product routes passed 390px and 1440px document-overflow checks. Local
MinIO and the attachment bucket are running at port 9000, and a real
organization-logo upload was verified.

## Ticket experience v2

**Status:** COMPLETE (local verification, 2026-08-15)

The combined requester intake/history page, staff queue, direct ticket routes,
conversation/details/activity tabs, role-safe activity data, responsive mobile
states, and accessible filter sheet are implemented and live-tested. See
`docs/TICKET_UX_V2_EVIDENCE.md`. The next unfinished roadmap work remains the
staging-only Phase 9 gates below.

## InspectA commercial remediation

**Status:** COMPLETE (local verification)

All 32 findings in `docs/inspectA.md` have implementation and verification
evidence, with the item-by-item audit in `docs/INSPECTA_EVIDENCE.md`. Production email and AI/transcription vendors remain deployment
configuration inputs; the application has secure ingress/provider boundaries
and visible failure/retry behavior until those credentials are supplied.

## Commercial transformation — Phase 9

**Status:** IN PROGRESS — staging gates required

Run the staged deployment gates in `docs/STAGING_RELEASE_CHECKLIST.md` against
an actual staging environment: image build/publish, migrations, ingress health,
TLS/CSP, authenticated browser E2E, production-like load baseline, and managed
backup/restore evidence. Record the results in `docs/RELEASE_EVIDENCE.md`.

**Local evidence complete:** `pnpm verify:release`, runtime health/readiness,
request security controls, smoke load, local browser smoke and an isolated
PostgreSQL restore/RLS drill are complete. Docker and staging infrastructure
are not available in the current workspace, so Phase 9 must not be marked
complete until those external gates are proven.

## Local application restart for UI/UX identity rollout

**Status:** COMPLETE (local verification)

Migration 020 is applied. The local API has been restarted with the current
build, returned HTTP 200 from its health endpoint, and accepted an actual
username login for the bootstrap platform administrator. Evidence is in
`docs/UI_UX_REDESIGN_EVIDENCE.md`.

## Header control alignment

**Status:** COMPLETE (local verification pending production deployment)

Organization selection and account controls are grouped together on the
left-hand side of the RTL header, with notifications remaining on the right.

## Mobile navigation contrast

**Status:** COMPLETE (local verification)

The mobile hamburger button uses white icon strokes on its purple hover and
keyboard-focus state.

## Service title

**Status:** COMPLETE (local verification, updated 2026-08-17)

The login brand, expanded product mark, and product header use
«مرکز خدمات پشتیبانی».

## Header popovers

**Status:** COMPLETE (local verification)

Notifications and global search use accessible icon triggers; their panels
stay within the viewport and dismiss on outside click or Escape.

## Login rate-limit isolation

**Status:** COMPLETE (local verification)

Login attempts are protected by their own strict rate-limit bucket, independent
of the general application-request budget; the login form now reports a 429
accurately.

## User administration password control

**Status:** COMPLETE (local verification)

Organization and platform user management forms expose an optional password
change. It requires at least 10 characters, revokes active refresh sessions,
and does not record passwords in audit metadata. API/web typechecks, 31 API
tests, the web production build, and local API health/readiness checks pass.

## Next Goal — navigation interaction polish

Correct desktop sidebar-toggle placement/direction, remove unintended mobile
drawer hover tint outside the menu, and ensure hover foregrounds are white on
filled controls.

**Progress:** Mobile drawer overlay corrected; desktop toggle placement and
remaining filled-control hover treatment are still pending in this next Goal.
