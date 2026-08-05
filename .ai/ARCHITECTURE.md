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
