# Local Object Storage Recovery Evidence

**Date:** 2026-08-22  
**Scope:** local developer runtime resilience for organization branding and attachments.

## Finding

The configured S3-compatible local endpoint was unavailable.  The branding API
can correctly create a presigned upload URL only when the backing object store
is running; without it, a browser upload cannot be completed and no logo key is
saved for the organization.

## Recovery

`pnpm dev:storage` now performs the local prerequisite before application
processes are started.  It reads the ignored local S3 settings, accepts only a
loopback endpoint, starts the local MinIO executable when its health endpoint
is unavailable, waits for readiness, and creates the configured bucket when
needed.  The root `pnpm dev` launcher runs this same prerequisite before it
builds and starts the API, web application, and worker.

The executable path and data directory are optional local settings documented
in `.env.example`; no credential is added to source control.

## Verification

- MinIO liveness at `127.0.0.1:9000/minio/health/live` returned HTTP 200.
- The configured `jupiter-attachments` bucket was present or created.
- A signed PNG-style PUT completed, its content type and byte count were read
  back through S3, and the isolated probe object was deleted.
- The organization-branding integration coverage passed with the complete API
  test suite (51 tests).
- API and web TypeScript checks passed.

An administrator must upload the organization logo once more after recovery if
the earlier browser PUT occurred while the object store was offline; failed
uploads intentionally do not change the active logo.
