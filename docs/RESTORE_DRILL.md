# Jupiter restore drill

## Preconditions

- Run from a protected operator environment with PostgreSQL client tools.
- Use an isolated target database; do not restore over a live environment.
- Keep credentials in the shell/session secret store, never in this document
  or captured terminal output.

## Procedure

1. Record the source schema migration list and create a timestamped custom
   backup with `pg_dump --format=custom`.
2. Create an isolated empty target database and restore with `pg_restore`.
3. Run `SELECT name FROM schema_migrations ORDER BY name` on source and target
   and compare the results.
4. Run the API migration command against the isolated target; it must report
   no destructive change and leave the migration set unchanged.
5. Verify two tenant contexts: each can read its own directory/tickets and
   cannot read the other's records under the `jupiter_app` role.
6. Record elapsed time, backup identifier, operator, outcome, and any
   corrective action in the deployment record. Destroy the isolated target
   using the platform's approved retention process.

## Acceptance

A drill passes only if the restored database has the expected schema, the
application readiness probe succeeds against it, and the two-tenant RLS check
passes. A backup file existing by itself is not restore evidence.
