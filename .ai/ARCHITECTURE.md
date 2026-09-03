# System Architecture

MVP is an API-first TypeScript modular monolith: React/Vite SPA behind Nginx;
NestJS API and worker processes; PostgreSQL; Redis/BullMQ; and S3-compatible
object storage. REST is versioned under `/api/v1`; SSE publishes server events.

Modules are Identity & Access, Organizations, Directory, Catalog, Ticketing,
Conversation, Attachments, Assignment, AI Gateway, Notifications, Audit,
Search/Reporting, and Platform Administration. Modules communicate through
application services and internal events, not direct cross-module persistence.

Tenant data uses a shared schema with required `organization_id`, composite
relations, application scoping, and PostgreSQL RLS as defense in depth.
Transactional outbox records asynchronous work. Docker Compose is for local
development; production uses the same versioned images with managed TLS,
secrets, backups, and monitoring.

## Approved Master Upgrade extension

GOAL-031 implements the Public Accounts and Organization Applications
foundation. The wider Master Upgrade adds Tenant Provisioning/Setup, Directory
Connector Control Plane, Commercial Core,
Capability Resolution, AI Commercial Metering, Jupiter Assist, Product Help,
and controlled Platform Appearance as modules inside the same modular monolith.
They communicate through application services and internal events; no new
microservice boundary is introduced.

Canonical organization workspaces will use `/o/{slug}` after GOAL-034. The
server remains responsible for resolving that slug and verifying membership;
the client cannot select a tenant by URL alone. Platform management remains
outside tenant routes. See DEC-018 through DEC-027 and
`UPGRADE_MASTER_PLAN.md` for staged delivery constraints.

GOAL-036 implements the Directory Connector Control Plane as a Nest module in
the monolith. It owns tenant-RLS connector and pairing records plus the safe
pairing exchange; it has no AD/LDAP client, no Windows runtime and no sync
worker. The future on-premises service initiates outbound HTTPS requests, so
the platform does not need an inbound customer-network connection.

GOAL-046 adds Product Help as a platform-owned module and global versioned
publication store. It is intentionally separate from tenant knowledge tables:
Help has no organization identifier or tenant RLS policy. Repository Markdown
under `docs/help/` is an idempotent initial-publication input only; current
published database revisions are the runtime source of truth. Read APIs filter
the published revision by the caller's derived audience before returning any
article metadata or content.

GOAL-047 adds Platform Admin authoring to the same module: every edit creates
a new runtime revision; publication changes the article's current published
pointer, while restore copies a prior revision into a new draft. Platform
exports select only current published runtime revisions. The React Help Center
uses the existing shell/navigation and compact `HelpTrigger` entry point;
feature mapping is metadata-driven and never reaches tenant knowledge.

## GOAL-054 Directory Connector operations

The Directory module remains in the monolith. The Windows Connector remains
outbound-only; the worker only queues tenant-scoped commands and derives health.
Heartbeats carry lightweight telemetry and a pending command reference, while
scope/mapping policy is fetched only after a policy-version change. The scheduled
mode is `INCREMENTAL_SNAPSHOT`, not fabricated AD delta tracking; only a complete
`FULL` reconciliation evaluates absence lifecycle. Full snapshots are submitted
in bounded batches, and the cloud evaluates absence only after every announced
batch has been received.
