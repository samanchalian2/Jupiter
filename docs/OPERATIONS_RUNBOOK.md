# Jupiter operator runbook

## Before a release

1. Run `pnpm verify:release` from a clean checkout.
2. Build immutable API and web images from the tagged commit. Supply all
   secrets through the deployment platform; never put them in an image, log,
   browser fixture, or repository.
3. Apply migrations once, using the release image and a least-privilege
   migration identity. Migrations must be forward-only and recorded in
   `schema_migrations`.
4. Verify `/api/v1/health` and `/api/v1/health/ready` through the staging
   ingress. The latter must return HTTP 200 with `status: ready`.
5. Run `pnpm load:smoke` against the staging API and complete the checklist in
   `STAGING_RELEASE_CHECKLIST.md`.

## Monitoring and incidents

Every API response carries `X-Request-Id`; request logs are structured JSON
with that ID, method, path and duration. Search that ID across edge and API
logs when investigating a request. Do not add tokens, passwords, attachment
contents, redacted AI input, or transcript content to incident notes.

Alert when readiness fails, HTTP 5xx grows unexpectedly, or request latency
changes materially from the deployment baseline. Treat tenant-isolation,
authorization, attachment-access, and AI data disclosure reports as security
incidents: preserve request IDs, restrict access, and rotate affected secrets
through the secret manager where applicable.

## Rollback

Only roll back an application image after verifying that migrations are
backward-compatible. Never delete migration records or production data as a
rollback step. If a data repair is necessary, create and review a forward
migration. After rollback, check readiness and execute a small authenticated
ticket flow in staging.

## Backup and restore

Use the dated steps in `RESTORE_DRILL.md`. A production backup must be
encrypted, access-controlled, and stored outside the application host. Record
the restore duration, result, schema version and two-tenant RLS check.
