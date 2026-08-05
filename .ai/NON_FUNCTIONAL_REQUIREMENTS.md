# Non-functional Requirements

The user interface is Persian RTL, responsive, and accessible. Standard API
operations target p95 below 500ms excluding uploads and provider calls. AI and
media jobs are observable, retryable, and non-blocking. All APIs are versioned,
validated, paginated where needed, and correlated by request ID. Backups,
restore verification, health checks, metrics, and structured logs are required
before production release.
