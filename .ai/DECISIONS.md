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
