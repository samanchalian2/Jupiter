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

## Approved Master Upgrade scope

The Master Upgrade supersedes the listed post-MVP exclusions only for the
approved staged program: public organization application and manual approval,
tenant setup lifecycle, manual/CSV/Active Directory provisioning, minimal
commercial entitlement and usage controls, Jupiter Assist, controlled platform
appearance, and Persian product Help. It still excludes microservices, full
SCIM or SSO, AD password synchronization, broad identity-provider integrations,
payment-gateway implementation, arbitrary theming, autonomous ticket
resolution, and a general AI help chatbot.

## Actors

Platform Admin manages tenants and global AI provider settings. Organization
Admin manages tenant configuration. Supervisors manage queues and assignments.
Experts work permitted department queues and assigned tickets. Requesters only
work their authorized tickets.
