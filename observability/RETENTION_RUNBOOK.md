# Operational retention runbook

This runbook describes GOAL-069's operational data retention, not Jupiter tenant,
ticket, commercial or security Audit deletion. It does not authorize deployment
or claim GOAL-059 Staging monitoring acceptance.

## Policy and authority

An application-wide Hub ADMIN may read/update `/operations/applications/{id}/retention-policy`.
Environment-only or tenant-only ADMIN, OPERATOR, ANALYST and VIEWER cannot change
an Application-wide policy. The Console's “نگه‌داری داده و صف” form shows explicit
day counts, reason and irreversible-deletion acknowledgement; no save is implicit.
The service also validates policy/ranges/reason and records the real principal
in immutable canonical Audit. Changes affect future batch decisions, not restore.

| Category | Default | Configurable days | Protection |
| --- | --- | --- | --- |
| Raw events | 30 days after receipt | 7–365 | Pending/running aggregation protects source |
| Aggregates | 365 days after bucket | 30–1825 | Independent from raw retention |
| Incident history | 180 days of inactivity | 30–1825 | Only RESOLVED/IGNORED/FALSE_POSITIVE, no recent activity or pending target investigation/delivery |
| Feedback | 180 days of inactivity | 30–1825 | Only RESOLVED/CLOSED, no recent reply |

Deleting a raw event removes its one event→Issue association, not its Issue,
Incident, business ticket or Audit. A retained Incident/AI finding may therefore
refer to a raw event no longer available; clients must say the source expired,
not fabricate/reconstruct source details. AI attempts/usage, findings, Issue and
human Issue activity are not deleted by this policy.

Receipts survive at least eight days AND as long as their raw event exists.
The ingestion contract rejects timestamps older than seven days: removing an
expired receipt cannot accept a still-eligible retry as new. Terminal job history
is retained at least eight days; an alert's completed delivery dedupe job remains
as long as the alert exists. No credential, principal or permission deletion is
part of this maintenance.

## Execution and atomicity

The host's existing Hub worker checks due environments every minute and enqueues
at most 100 initial jobs per sweep, keyed to UTC epoch hour/environment. Disabled
applications/environments are still subject to their declared retention; disabling
telemetry is not a permanent data-preservation/legal-hold mechanism.

Each RETENTION lease handles one Application/environment with a fixed policy
snapshot under an advisory lock shared with policy edits. At most 100 rows per
category are processed normally (service hard cap 1,000). Parent history is locked
and child records are sliced, not deleted through unbounded fanout cascades.
Every category hitting its bound schedules a uniquely keyed continuation; work
continues in later ticks rather than one unlimited transaction.

The worker uses the existing bounded lease/retry/backoff. Job scope/source/dedupe
must match the persisted RUNNING row and lease owner. Deleted rows, counts,
automation-attributed `RETENTION_BATCH_COMPLETED` Audit, continuation and job
completion share one transaction. A crash or Audit failure rolls everything back.
No fake human actor is used for automatic work.

## Troubleshooting and checks

`GET /operations/applications/{id}/maintenance?environmentId={env}` requires a
current environment-wide ADMIN grant. It returns retained pending/running/failed
job counts, oldest aggregation lag, unresolved Issues, failed alert deliveries,
last retention batch counts/time and raw retention lag. A missing completion
timestamp means no successful batch is recorded, not a healthy zero backlog.
The API explicitly reports `coverage=QUEUE_AND_RETENTION_ONLY`: this is not the
full ingestion/drop/offline-recovery/storage-growth self-monitoring requirement.

For stale completion or nonzero raw retention lag:

1. Verify the external process health/readiness and storage connectivity.
2. Verify the Hub worker is enabled independently of business workers, its logs
   show no safe `OBSERVABILITY_WORKER_UNAVAILABLE`, and RETENTION jobs are claimed.
3. Inspect scoped failed jobs/backoff and last counts. A queue backlog or pending
   aggregation may legitimately protect expired raw events; do not delete their
   dedupe/source rows manually.
4. Verify configured policy and recent terminal-history activity. Active records
   are deliberately preserved and are not retention failure.
5. Investigate storage/index/statement-timeout pressure and restore worker health.
   Never bypass RLS, disable Audit or issue broad SQL cascade deletion to unblock.
6. Run the supported worker again; idempotent batches/continuations recover.

Deletion is irreversible without a verified backup. Increasing a policy window
does not restore deleted rows. Backup/restore/external full-host probes are a
separate operations responsibility; the Hub cannot diagnose a total failure of
its own host from inside that failed host. No external monitoring installation
is claimed by this local runbook.

## Acceptance

Real PostgreSQL tests use a disposable DB and verify policy authorization/ranges,
bounded deletes, replay protection, old-vs-fresh/raw-vs-aggregate separation,
cross-Application/environment IDs, active/recent discussion preservation, child
slice continuation, forbidden Audit/AI ledger deletes, failure rollback and
parallel duplicate execution. OpenAPI parity covers policy GET/PUT and maintenance
status. Do not substitute this for full self-monitoring, performance/load or final
browser acceptance recorded separately in Goal Evidence.
