# Jupiter

Jupiter is a centralized multi-tenant SaaS for organizational and personal
support tickets. Organization members work in organization workspaces, while a
verified person may also use a private personal workspace backed by the same
tenant-isolation boundary. Commercial AI assists, but never replaces, the
human workflow.

## MVP scope

Tenant-aware identity and roles; organization directories; ticket lifecycle;
conversation, internal notes and audit history; attachments and voice
transcription; AI-assisted draft review; basic role portals, search, filters,
ratings, tests, and Docker Compose local deployment.

## Explicit non-scope

Native mobile applications, RAG/knowledge base, configurable workflow engine,
advanced SLA/assignment/analytics, billing, public organization sign-up,
microservices, and broad external integrations.

## Approved Master Upgrade scope

The Master Upgrade supersedes the listed post-MVP exclusions only for the
approved staged program: public organization application and manual approval,
tenant setup lifecycle, manual/CSV/Active Directory provisioning, minimal
commercial entitlement and usage controls, Jupiter Assist, controlled platform
appearance, and Persian product Help. It still excludes microservices, full
SCIM or SSO, AD password synchronization, broad identity-provider integrations,
payment-gateway implementation, arbitrary theming, autonomous ticket
resolution, and a general AI help chatbot.

## Approved Personal Service extension

The post-upgrade Personal Service program adds one private personal workspace
per verified public account, Jupiter-operated personal support, separate
monthly/purchased support and AI capacity, and adapter-based online payment.
It preserves organization workspaces and memberships, uses the existing
tenant boundary and does not turn a personal user into an organization admin.
Platform Admin owns the personal catalog, monthly defaults, per-workspace
overrides, package validity, pricing, service availability and operational SLA.
Authorization, tenant isolation, settlement idempotency and payment
verification are fixed security invariants and are not configurable.

## Actors

Platform Admin manages tenants and global AI provider settings. Organization
Admin manages tenant configuration. Supervisors manage queues and assignments.
Experts work permitted department queues and assigned tickets. Requesters only
work their authorized tickets. Personal Users use their own private workspace,
may retain organization memberships at the same time, and may later submit an
organization application.
