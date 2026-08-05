# Jupiter

Jupiter is a centralized multi-tenant SaaS for organizational support tickets.
Requesters submit text, voice, image, and file requests; experts resolve them
in-ticket. Commercial AI assists, but never replaces, the human workflow.

## MVP scope

Tenant-aware identity and roles; organization directories; ticket lifecycle;
conversation, internal notes and audit history; attachments and voice
transcription; AI-assisted draft review; basic role portals, search, filters,
ratings, tests, and Docker Compose local deployment.

## Explicit non-scope

Native mobile applications, RAG/knowledge base, configurable workflow engine,
advanced SLA/assignment/analytics, billing, public organization sign-up,
microservices, and broad external integrations.

## Actors

Platform Admin manages tenants and global AI provider settings. Organization
Admin manages tenant configuration. Supervisors manage queues and assignments.
Experts work permitted department queues and assigned tickets. Requesters only
work their authorized tickets.
