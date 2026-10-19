# Scoped self-metrics — implementation in progress

DEC-043 defines this diagnostic channel. It never consumes customer allowance,
feeds Incident rules or sends provider credentials, event text, actor identities,
URLs or arbitrary labels. It is not an Audit ledger.

## Contracts and units

`POST {base}/sdk-metrics` uses an existing `events:write` credential and Browser
Origin/actor policy. The body contains only `reportId`, ISO UTC `observedAt` and
`counters: { dropped, retryDelivered, retryDropped }`. Each count is 0–1,000,000,
at least one is positive, and observation is within 48 hours past/five minutes
future. Six calls/credential/minute; same ID/body is replay-safe, changed scope,
actor or counts conflicts. Refreshing a credential for the same verified actor
does not relabel or duplicate the report. No global authentication policy changes.

`GET {base}/operations/applications/{id}/self-health?environmentId={id}` requires
current environment-wide ADMIN authority. Tenant-bound ADMIN is insufficient.
No report ID/hash, actor, raw payload or provider cost is returned. It has a fixed
rolling one-hour observation window and separate sources:

- `SERVER_MEASURED`: received event attempts, accepted, duplicate, rejected,
  retryable and failed batches measured from actual ingestion execution. Only
  accepted events / 3,600 is the ingestion rate; replay is not another acceptance.
  Requests rejected before credential resolution cannot be safely attributed
  to an Application and are outside this scoped counter; external ingress logs
  remain necessary. One persistence exception short-circuits remaining valid
  entries to RETRYABLE rather than multiplying connect timeouts by batch size.
- `CLIENT_REPORTED`: Browser SDK deltas under verified scope. They are diagnostic
  claims, not proof sufficient for a Critical Incident or commercial accounting.
- `SERVER_SDK_REPORTED`: corresponding process-level backend SDK deltas; they are
  reported separately, not automatically server-side ingestion measurements.

Drop means telemetry rejected, expired, queue-full or retry-exhausted, not
intentional sampling, context logout or discarded prior-actor data. A retry
counts recovered only after a valid ACCEPTED/DUPLICATE ACK; an attempted event
later dropped/expired counts failed recovery. Feedback and metrics themselves
do not inflate event-drop counters. The ratio is recovered / (recovered + failed
recovery), null with no observations. Delayed SDK deltas are grouped by report
observation time, not an invented exact history of offline activity. Never sum
different provenance sources into one loss total: that would double-count rejects.

Queue depth includes pending/running jobs; aggregation lag is oldest active
aggregation age, zero when none. Alert/AI failures count terminal failures in the
last hour, not normal retries. Unresolved Issues exclude RESOLVED/IGNORED. Raw
retention lag is lateness beyond policy expiry; protected pending data can explain
a nonzero lag. Storage snapshots are hourly logical row bytes of an explicit
allowlist of environment-scoped Hub tables. They are **not physical disk, indexes,
global registry, canonical Audit or another database**. Growth is nullable until
two snapshots and includes an actual measured interval; it can be negative.

## Reliability and limitations

Health reports are immutable with composite scope FKs/RLS. Runtime cannot insert
or update counters. The worker retains reports eight days (longer than 48-hour
SDK replay eligibility) and snapshots for the aggregate policy window, in bounded
audited retention batches. Canonical Audit/AI accounting are not deleted here.

The server's out-of-band buffer has at most 200 scope reports and bounded numbers.
Storage failure keeps the same retry UUID/hash, logs fixed diagnostic codes and
backs off. Buffer overflow/saturation emits `METRICS_BUFFER_FULL`; storage failure
emits `METRICS_STORAGE_UNAVAILABLE`. Metric failure never changes an event ACK.
Unpersisted metrics can be lost if the process dies; external logs/probes are
complementary. A null last-report timestamp means unobserved, not healthy zero.

Browser/Node report automatically by default (`reportMetrics:false` is an explicit
consumer opt-out). Browser journals at most ten fixed reports/16 KiB as METRICS
envelopes in the existing IndexedDB store, separate from the event count/byte
budget. Report ID/body survives a lost ACK, credential refresh and reload; no
credential is persisted. New deltas use another report ID. At most six reports
per minute, twelve attempts and 48-hour expiry; metadata failures do not remove
user events, create new event loss, or recursively report their own failure.
Counter increments before journaling, queue saturation and memory fallback are
best effort: this is not an exactly-once record of every possible diagnostic loss.

Initial Browser context synchronization removes foreign partitions. Context/
logout cancels report requests, clears old counters/rows and serializes retry
writes with purges. Generation is checked after body parsing too, so late event,
feedback or metric responses cannot update the next actor. Node reports are
process/App/environment level; the diagnostic credential callback runs outside
the last request's actor/tenant context. Its memory report is not restart-durable.
`getMetricReport()` / `acknowledgeMetricReport(id)` remain available as ports;
automatic transport owns the journal once a report is persisted.

SDKs assert expected App/environment in `x-observability-application-id` and
`x-observability-environment-id`. The server compares, never adopts, these claims;
a wrong opaque credential cannot silently place SDK metrics in another App.
Manual clients omitting both assertions remain credential-bound. Old servers
returning 404 are tolerated without changing telemetry/customer workflows.

The Persian Console exposes “سلامت مرکز پایش”, only with environment-wide ADMIN
authority, source-separated counts, unobserved/null values, logical storage basis
and refresh. It has no unrelated list pagination/export. Coverage now says
`SCOPED_DIAGNOSTIC_METRICS`; the old in-progress enum remains contract-compatible.
This descriptor is not overall host health, complete Goal acceptance or a claim
that an unobserved/opted-out SDK is healthy. Real Browser acceptance covers queue
overflow, commit-then-lost metric ACK, IndexedDB/reload/credential renewal with one
stored report, and four-width RTL Console. Actual backend SDK HTTP retry is
separately exercised. Whole-platform Help/performance/host breadth audit remains.

See [external monitoring](EXTERNAL_MONITORING_RUNBOOK.md) for independent host/
storage failure detection. Neither this foundation nor local probes install or
complete GOAL-059 Staging monitoring.
