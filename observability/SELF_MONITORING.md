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

Browser/Node currently expose `getMetricReport()` / `acknowledgeMetricReport(id)`
over a fixed idempotent delta buffer. Browser clears it on tenant/actor switch and
logout; Node deltas are process/App/environment level, not attributed to whichever
async request happens to execute last. **Automatic authenticated SDK reporting,
report persistence/reload semantics, Console and real source acceptance are not
yet complete.** The API explicitly returns `SOURCE_COLLECTION_IN_PROGRESS`.
Do not interpret manual report fixtures as completed automatic collection.

See [external monitoring](EXTERNAL_MONITORING_RUNBOOK.md) for independent host/
storage failure detection. Neither this foundation nor local probes install or
complete GOAL-059 Staging monitoring.
