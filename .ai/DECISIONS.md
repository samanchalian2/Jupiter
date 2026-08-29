# Architecture Decisions

## DEC-001 — TypeScript modular monolith

Approved plan: NestJS backend and React/Vite frontend. This keeps one primary
language while retaining explicit modules; FastAPI and microservices are not
chosen for MVP.

## DEC-002 — Central shared-schema SaaS tenancy

Use `organization_id`, server-side scoping, composite constraints, and RLS.
Schema-per-tenant and database-per-tenant add unnecessary MVP operations cost.

## DEC-003 — AI gateway and platform-controlled credentials

AI is asynchronous, replaceable, validated, and controlled by Platform Admin;
ticketing never calls a provider directly.

## DEC-004 — REST plus SSE

REST handles commands and reads; SSE supplies realtime notifications. WebSocket
is deferred because bidirectional persistent transport is not required in MVP.

## DEC-005 — Fixed ticket semantics

Organizations configure labels and closure policy but not arbitrary workflow.
This preserves reporting and authorization invariants.

## DEC-006 — Compile before running the NestJS development server

The API development command runs the TypeScript build and then Node on the
compiled output. This preserves NestJS decorator metadata required for
dependency injection; direct `tsx` execution was rejected after it produced
a runtime 500 response from the health controller.

## DEC-007 — Per-organization OpenAI-compatible credentials

Each organization owns one credential plus independent analysis and transcription
model identifiers. Platform Admin is the only role allowed to change this
configuration. Credentials are encrypted with AES-256-GCM using the deployment
secret `AI_CREDENTIAL_ENCRYPTION_KEY`; the database stores ciphertext, a unique
96-bit IV, and authentication tag, while API responses expose only `hasApiKey`.

The provider base URL is HTTPS-only in production and restricted by
`AI_PROVIDER_ALLOWED_HOSTS`. Loopback HTTP is accepted only outside production
to support deterministic provider fakes. `OPENAI_API_KEY` is a one-time local
migration source and is never read by the request path. Credential replacement
and removal are explicit audited actions, but audit metadata contains only
boolean change indicators and never credential material.

## DEC-008 — Pre-ticket intake session as a temporary aggregate

Text/voice AI runs against a tenant- and owner-scoped `TicketIntakeSession`
before a ticket exists. This preserves the fixed ticket lifecycle and prevents
provider latency or failure from creating incomplete ticket records. The
session owns temporary voice metadata, transcript, versioned suggestions,
per-field confidence, retry state, a five-minute processing lease, and a
24-hour expiry. The original typed description is immutable; a transcript is
appended to a separate combined description.

Only metadata-verified objects (MIME, size and signed duration metadata) can be
transcribed or attached. Valid suggestions require tenant catalog membership
and confidence of at least 0.75. Final draft creation, intake provenance,
attachment conversion and session consumption share one PostgreSQL transaction;
the already tenant-scoped object becomes persistent without copying. Unconsumed
expired objects are deleted by the worker. The additive REST contract is
documented in `docs/TICKET_INTAKE_API.md`.

## DEC-009 — Platform-admin AI connection diagnosis

Platform administrators may run a short, organization-scoped connection test
after saving AI settings. It uses the encrypted stored credential and the
configured analysis model to call Chat Completions with a fixed non-sensitive
prompt. The response exposes only a safe diagnostic category and Persian
operator guidance; credentials, provider response bodies and request content
are never returned, logged or audited. Each test is audited using only its
success flag and category. This endpoint is diagnostic only and cannot create
or modify a ticket, intake session or provider configuration.

## DEC-010 — Governed title and typed-tag intake contract

`ticket-intake.v2` extends pre-ticket analysis with a tenant title library and
typed ticket tags. The provider receives only active tenant values. It may
reuse their IDs or propose concise new values, but cannot activate vocabulary.
Only final explicit draft submission records a new candidate; Organization
Admin approval is required before reuse. Existing flat tags remain active
`OTHER` tags for compatibility. The lifecycle, original description and 0.75
confidence threshold are unchanged.

## DEC-011 — Multimodal guided ticket-intake conversation

`ticket-intake.v3` retains each requester text or voice contribution as an
ordered, tenant- and owner-scoped intake message. Voice transcripts and raw
typed text are immutable source evidence; neither the model nor the UI silently
rewrites them. The model returns a separate structured interpretation, primary
issue, optional secondary issues and one optional concise clarification question.
It may only ask when ambiguity materially affects classification. A requester
can always submit the primary ticket without answering; secondary-ticket
creation is a non-blocking explicit action and never occurs by default. All
verified voice messages transfer to the final ticket as attachments. This
extends DEC-008 without changing ticket lifecycle, credential policy, tenant
isolation, the 0.75 assignment gate or the 24-hour intake expiry.

## DEC-012 — Confirmed secondary-ticket batch creation

`ticket-intake.v4` may return up to two server-validated, privacy-preserving
secondary ticket proposals. They are never created by AI or selected by
default. A requester explicitly selects proposals and confirms a single batch
submission with the primary ticket. The tenant- and owner-scoped intake is
locked and consumed in the same transaction as every ticket; proposal IDs are
server-generated and client payloads cannot alter their ticket content. Voice,
files, raw messages and transcripts remain attached only to the primary ticket.

## DEC-013 — Reviewable low-confidence secondary proposals

`ticket-intake.v5` preserves the `0.75` confidence threshold for automatically
applying primary ticket fields, but separates it from a requester's explicit
choice to create a secondary ticket. A secondary proposal is selectable when
the server has independently validated its title, standalone description,
priority and any supplied tenant taxonomy values. A lower confidence score
marks it as requiring review; it never silently creates a ticket and is
repeated in the final confirmation. Incomplete or taxonomy-invalid proposals
remain unavailable. The API accepts only the server-issued proposal ID, locks
the owner-scoped intake and creates all selected tickets atomically.

When a requester needs to clarify a proposal, the client records a new text or
voice message rather than editing historical source evidence, then re-runs the
same conversation analysis. This invalidates prior proposal selections because
their server IDs and interpretation are no longer current.

## DEC-014 — Preserve the established primary issue during clarification

`ticket-intake.v6` carries the prior server-generated primary issue back into a
follow-up analysis. The first distinct requester issue remains primary while a
later clarification enriches a secondary proposal; only an explicit requester
correction or replacement can change it. Adding a message clears stale
secondary suggestions but preserves this anchor until the next analysis writes
the refreshed interpretation.

## DEC-015 — Organization-controlled Smart Intake policy

Provider credentials, Base URL and model selection remain Platform Admin-only
configuration. `smart_intake_enabled` is a distinct tenant-scoped policy that
an Organization Admin may toggle only when platform AI is enabled and has an
encrypted API key plus a valid analysis model. The requester-visible capability
contains only the effective boolean; it never exposes credentials or provider
configuration. Smart Intake gates only pre-ticket transcription and analysis:
manual text, file and verified voice attachment flows remain usable, and the
legacy ticket AI gateway remains governed by the platform AI setting.

## DEC-016 — Requester cancellation destroys an unsubmitted intake

A requester may explicitly cancel only their own unconsumed `TicketIntakeSession`.
The cancellation command locks the tenant- and owner-scoped session, removes all
temporary session and conversation voice objects, marks pending processing
outbox events complete, deletes the session and its cascading raw messages and
AI result, then writes an audit record containing only counts and no request
content. It cannot cancel or alter a ticket after final submission: a consumed
session is rejected. Keeping the cancellation destructive avoids retaining a
temporary conversation as an accidental ticket-history record.

## DEC-017 — Organization administration uses a route-addressable workspace

Organization Administration is organized as a presentational workspace with
grouped section navigation and one route per existing management capability:
members, catalog, vocabulary, teams, SLA/assignment, request/appearance
settings, and custom fields/email. This replaces the local in-page tab state
so deep links and browser back/forward preserve the selected section.

The change is frontend-only: the same panels, API requests, permissions,
tenant context and business rules remain in place. Desktop uses grouped
vertical navigation; mobile uses a compact labelled selector rather than a
horizontal tab strip. Future commercial or directory features have no
placeholder entry until a separately approved capability exists.
