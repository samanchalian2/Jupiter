# Execution Plan

## GOAL-001 — Project control plane and executable MVP roadmap

**Status:** DONE

**Purpose:** establish the versioned source of truth needed to deliver the
ticketing MVP safely in small, testable Goals.

**Scope:** root agent instructions; architecture, domain, security, AI,
testing, risks, master plan, execution plan, current state, next task, and
handoff documentation.

**Out of scope:** application source, dependencies, database schema/migration,
network services, and production secrets.

**Acceptance:** documents define approved architecture, roles, boundaries,
ticket lifecycle, tenant control, AI behavior, risks, and a dependency-ordered
Goal sequence; exactly one next Goal is prepared.

**Validation:** repository file/readability audit and Git diff review.

**Next Goal:** GOAL-002.

## GOAL-002 — Foundation and local development runtime

**Status:** DONE

**Purpose:** make a reproducible local TypeScript workspace capable of running
an API health endpoint and RTL web shell.

**Scope:** NestJS/React workspace, shared tooling, Docker Compose development
services, health endpoint, lint/type/test scripts, environment templates, and
CI baseline.

**Out of scope:** authentication, migrations, tenant data, ticket features,
AI calls, and real external credentials.

**Prerequisites:** Node.js LTS, npm/pnpm, and Docker must be available.

**Acceptance:** documented commands run API, web shell, and local services;
health check and baseline tests pass; no secret is tracked.

**Risks:** host toolchain unavailable; resolve before implementation.

**Validation:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`
passed on 2026-08-05. The built API returned `jupiter-api/ok` from
`GET /api/v1/health`. Docker Compose was not run because Docker is not
available on PATH.

## GOAL-003 — Tenant-aware identity, access, and organization directory

**Status:** PLANNED

**Depends on:** GOAL-002 and user-provided database access when migrations are
ready.

**Scope:** authentication, memberships, RBAC/policies, tenant context/RLS,
organization, departments, locations, disciplines, and taxonomy foundations.

**Done:** migration and isolation/security tests pass against the authorized
database; no cross-tenant read/write is possible.

## GOAL-004 — Ticket lifecycle and assignment

**Status:** PLANNED

**Depends on:** GOAL-003. **Scope:** draft, submit, fixed lifecycle,
classification, priorities, assignment, transitions, and audit history.

**Done:** authorization and lifecycle integration tests pass.

## GOAL-005 — Conversation and activity history

**Status:** PLANNED

**Depends on:** GOAL-004. **Scope:** requester/expert messages, internal notes,
activity timeline, and SSE notifications. **Done:** secrecy and realtime tests
pass.

## GOAL-006 — Secure attachments and media

**Status:** PLANNED

**Depends on:** GOAL-004. **Scope:** S3 adapter, signed uploads/downloads,
validation, limits, metadata. **Done:** authorization and invalid-file tests
pass.

## GOAL-007 — Role portals

**Status:** PLANNED

**Depends on:** GOAL-005/006. **Scope:** responsive RTL requester, expert,
supervisor, and organization-admin flows. **Done:** E2E primary flows pass.

## GOAL-008 — AI gateway contract

**Status:** PLANNED

**Depends on:** GOAL-003/004. **Scope:** provider abstraction, protected
platform configuration, prompts, audit/usage, redaction, queue integration.

## GOAL-009 — Text AI review and initial response

**Status:** PLANNED

**Depends on:** GOAL-008/007. **Scope:** structured analysis, review/confirm,
AI-labelled response, fallback. **Done:** provider success/failure E2E passes.

## GOAL-010 — Voice transcription and asynchronous jobs

**Status:** PLANNED

**Depends on:** GOAL-006/009. **Scope:** voice transcription, retry/dead-letter
visibility and review flow. **Done:** retry and manual fallback tests pass.

## GOAL-011 — Search, rating, and basic dashboards

**Status:** PLANNED

**Depends on:** GOAL-007. **Scope:** tenant-scoped search/filter, ratings,
basic workloads/operational views. **Done:** role and tenant tests pass.

## GOAL-012 — MVP hardening and release readiness

**Status:** PLANNED

**Depends on:** GOAL-010/011. **Scope:** integration/security/performance
suite, observability, backup/restore runbook, release checks. **Done:** all
release gates documented and passing.
