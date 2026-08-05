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
