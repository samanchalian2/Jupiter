# Jupiter release runbook

## Release gates

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. Apply migrations with `pnpm --filter @jupiter/api migrate`. Verify `/api/v1/health` and `/api/v1/health/ready`; readiness must include PostgreSQL connectivity.

Review that `.env` is ignored, secrets are injected only by the deployment environment, TLS is enabled at the edge, and S3 credentials use least privilege.

## Backup and restore

Before deployment, create a timestamped logical PostgreSQL backup using the managed service backup or `pg_dump` from a protected operator environment. Store it encrypted outside the application host and retain it under the organization policy.

For restore, stop write traffic, restore into an isolated database, run schema verification, and test tenant RLS using two organizations before directing production traffic to it. Record the restore time and outcome; never place credentials or backup contents in Git or application logs.

## Rollback

Roll back the application image only after confirming migrations are backward compatible. Do not delete migrations or database records. If data repair is required, create a reviewed forward migration.
