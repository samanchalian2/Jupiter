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

**Status:** DONE

**Depends on:** GOAL-002 and user-provided database access when migrations are
ready.

**Scope:** authentication, memberships, RBAC/policies, tenant context/RLS,
organization, departments, locations, disciplines, and taxonomy foundations.

**Done:** migration and isolation/security tests pass against the authorized
database; no cross-tenant read/write is possible.

**Validation:** PostgreSQL 18.4 local connection and migration succeeded.
RLS was verified with two organizations: each context saw only its own
department and an unknown context saw zero records.

## GOAL-004 — Ticket lifecycle and assignment

**Status:** DONE

**Depends on:** GOAL-003. **Scope:** draft, submit, fixed lifecycle,
classification, priorities, assignment, transitions, and audit history.

**Done:** authorization and lifecycle integration tests pass.

**Validation:** Migration 002 and permission Migration 003 applied. Integration
test passed for draft creation, submission, manual assignment, and transition
to IN_PROGRESS under RLS.

## GOAL-005 — Conversation and activity history

**Depends on:** GOAL-004. **Scope:** requester/expert messages, internal notes,
activity timeline, and SSE notifications. **Done:** secrecy and realtime tests
pass.

**Status:** DONE

**Validation:** Migration 004 applied. Integration tests verified public
requester/expert messages, staff-only internal notes, requester timeline
filtering, append-only record permissions, tenant RLS isolation, and
recipient-scoped SSE event delivery.

## GOAL-006 — Secure attachments and media

**Status:** DONE

**Depends on:** GOAL-004. **Scope:** S3 adapter, signed uploads/downloads,
validation, limits, metadata. **Done:** authorization and invalid-file tests
pass.

**Validation:** Migration 005 applied. Integration tests covered allowlisted
media, filename and size limits, storage metadata mismatch rejection,
authorized downloads, and tenant isolation.

## GOAL-007 — Role portals

**Depends on:** GOAL-005/006. **Scope:** responsive RTL requester, expert,
supervisor, and organization-admin flows. **Done:** E2E primary flows pass.

**Status:** DONE

## GOAL-008 — AI gateway contract

**Status:** DONE

**Depends on:** GOAL-003/004. **Scope:** provider abstraction, protected
platform configuration, prompts, audit/usage, redaction, queue integration.

## GOAL-009 — Text AI review and initial response

**Status:** DONE

**Depends on:** GOAL-008/007. **Scope:** structured analysis, review/confirm,
AI-labelled response, fallback. **Done:** provider success/failure E2E passes.

## GOAL-010 — Voice transcription and asynchronous jobs

**Status:** DONE

**Depends on:** GOAL-006/009. **Scope:** voice transcription, retry/dead-letter
visibility and review flow. **Done:** retry and manual fallback tests pass.

## GOAL-011 — Search, rating, and basic dashboards

**Status:** DONE

**Depends on:** GOAL-007. **Scope:** tenant-scoped search/filter, ratings,
basic workloads/operational views. **Done:** role and tenant tests pass.

## GOAL-012 — MVP hardening and release readiness

**Status:** DONE

**Depends on:** GOAL-010/011. **Scope:** integration/security/performance
suite, observability, backup/restore runbook, release checks. **Done:** all
release gates documented and passing.

## GOAL-013 — Secure per-organization OpenAI-compatible configuration

**Status:** DONE

**Depends on:** GOAL-008/012. **Scope:** encrypted organization API key,
provider Base URL, independent analysis/transcription models, Platform Admin
API/UI, explicit credential removal, provider host policy, direct structured
Chat Completions adapter, audit safety, migration utility and ADR.

**Validation:** migration 022 applied; AES-GCM tamper/round-trip, masking,
audit redaction, URL policy, tenant AI gateway and provider contract tests pass;
API/web typechecks and production builds pass; authenticated browser evidence
shows a configured key without its value and successful blank-key preservation.

## GOAL-014 — Pre-ticket text and voice intake pipeline

**Status:** DONE

**Depends on:** GOAL-013/006. **Scope:** tenant-scoped intake sessions,
temporary presigned voice upload, transcription and analysis states, structured
taxonomy-validated suggestions and confidence, idempotency, final ticket/audio
attachment handoff, expiry and object cleanup.

**Validation:** migrations 023–027 applied; tenant/owner isolation, idempotency,
MIME/size/duration rejection, transcription ordering, redaction, catalog and
confidence filtering, retry/manual fallback, atomic attachment/provenance and
expiry deletion pass in integration tests. The complete release gate passes.

## GOAL-015 — Smart ticket composer and acceptance E2E

**Status:** DONE

**Depends on:** GOAL-014/007. **Scope:** description-first composer, AI and
microphone toolbar, one-minute recorder, processing/retry states, AI provenance
badges, low-confidence guidance, responsive behavior and 375/768/1440 browser
acceptance coverage.

**Validation:** the full release gate passes with 41 API and 9 Web tests.
Authenticated REQUESTER acceptance confirms initial description focus, secure
AI success/failure behavior, manual editability, low-confidence guidance,
microphone permission state and zero overflow at 375, 768 and 1440 px. The
deterministic loopback provider was removed from active configuration after the
test. Evidence is recorded in `docs/GOAL_015_EVIDENCE.md`.

## GOAL-016 — Saved AI settings connection diagnosis

**Status:** DONE

**Depends on:** GOAL-013. **Scope:** a Platform Admin-only test of the saved
organization credential, Base URL and analysis model; safe diagnostic outcomes,
audit trail, platform UI feedback and automated coverage. No requester ticket,
intake session, configuration value or raw provider message may be exposed or
changed by the test.

**Validation:** successful, invalid-key, billing/quota and unauthorized paths
are unit-tested. The local saved Jupiter Demo Organization configuration was
verified through the in-product endpoint against the GapGPT OpenAI-compatible
service, followed by a direct `ticket-intake.v1` structured-analysis request
that returned a valid title and NORMAL priority. API/web typechecks and the
production build pass.

## GOAL-017 — Catalog governance and IT/service starter template

**Status:** DONE

**Scope:** an Organization Admin-approved, idempotent IT and organizational
support catalog template; catalog readiness; a tenant-RLS pending suggestion
queue and auditable review paths. The template must not invent organization
departments or locations.

**Validation:** migration 028 applied; the API integration test verifies
administrator-only access, repeatable installation, ready category/subcategory
counts and cross-tenant suggestion isolation. API typecheck, all API tests,
Web tests and production Web build pass.

## GOAL-018 — Tenant title library and typed ticket-tag vocabulary

**Status:** DONE

**Depends on:** GOAL-017/014. **Scope:** approved title reuse, pending title
and typed tag candidates, safe legacy-tag migration, `ticket-intake.v2`, and
server validation/provenance. An ADR is required before the contract change.

**Validation:** migration 029 applied; API integration coverage verifies active
tenant vocabulary input, title reuse, pending new-tag creation only at final
draft creation and admin review. All 50 API tests, API typecheck, Web tests and
production Web build pass.

## GOAL-019 — Smart composer, vocabulary management, search and reporting

**Status:** DONE

**Depends on:** GOAL-018/015. **Scope:** requester tag control and provenance,
Organization Admin vocabulary review UI, tag-aware queue/search/reporting and
responsive end-to-end acceptance.

**Validation:** API typecheck, 51 API tests (including typed tag
draft/search/filter integration), Web typecheck, 9 Web tests, and API/Web
production builds pass. An authenticated browser walkthrough at 375/768/1440
px confirmed no horizontal overflow, responsive controls and a real provider's
concise non-copy title. The empty demo organization correctly withheld category
and tag suggestions; its approved starter-template installation remains a
tenant configuration action. See `docs/GOAL_019_EVIDENCE.md`.

## GOAL-020 — Multimodal guided ticket-intake conversation

**Status:** DONE

**Scope:** ordered text and voice intake messages, immutable raw source text,
separate AI interpretation/primary issue/secondary issue, non-blocking
clarification, optional secondary-ticket proposal, multiple secure voice
attachments, v3 provider contract and responsive requester conversation UI.

**Acceptance:** text and voice share one guided conversation; ambiguity can
produce a concise optional question; only explicit user action creates a second
ticket; raw input and AI interpretation remain separate; all message and
attachment paths preserve tenant/owner isolation.

**Validation:** migration 030 applied locally. API integration coverage verifies
raw text/voice separation, a voice transcript, separate interpretation, primary
and secondary issue, optional clarification and final voice attachment handoff.
All 52 API tests, 11 Web tests, API/Web typechecks and production builds pass.

## GOAL-021 — Confirmed AI secondary-ticket batches

**Status:** DONE

**Scope:** v4 proposals, server-owned identifiers, requester confirmation,
atomic primary-plus-secondary submission, link auditing and source isolation.
