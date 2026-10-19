# External monitoring contract

Run probes outside the Hub's server/process and database failure domain. The Hub
cannot deliver an in-app warning while its database or whole host is down.
This is an integration contract and executable reference, **not GOAL-059 Staging
monitoring installation/acceptance**.

For the generic server, the base is its public `/api/v1/observability` mount;
consumers may mount it elsewhere. No secret or session is required:

- `GET {base}/health`: HTTP 200, JSON `service=observability-hub`, `status=ok`.
  This proves HTTP liveness only, not worker/storage/AI health.
- `GET {base}/ready`: HTTP 200 with `status=ready` only after storage/registry
  access; HTTP 503 with a safe reason when unavailable. It does not promise that
  all queues are drained, external AI works, or all business services are ready.

Reference command (substitute your approved HTTPS host):

```sh
node observability/examples/health-probe.mjs https://hub.example.test/api/v1/observability
```

Exit 0 means both checks passed; exit 1 means unhealthy/invalid/timeout. The probe
uses five-second request deadlines, no redirects, at most 4 KiB per response,
fixed structured output and no credential/raw failure details. HTTP is allowed
only for loopback local acceptance, never for a network deployment.

Configure an independent scheduler every 30–60 seconds, alert after three
consecutive failures and acknowledge recovery after two successes. Use separate
channels from the Hub inbox. Also monitor host disk, PostgreSQL availability,
service restart/crash loops, ingress 5xx rate and probe latency in the external
tool; do not add another ingestion request to test a broken ingestion pipeline.

The host adapter emits bounded JSON `observability.diagnostic` warnings with
fixed `HUB_NOT_READY` / `WORKER_DRAIN_FAILED` codes even when Hub persistence is
unavailable. Capture stdout/stderr in the deployment's log collector; each code
is emitted at most once per minute per process. No exception text, provider key,
request payload, ticket text or credential is attached. A broken logging sink
cannot become a customer-facing exception.

For terminal durable pipeline failures, the Hub's repair sweep creates scoped
deduplicated inbox alerts in 15-minute failure windows over the latest 24 hours.
Ordinary retry is not terminal. Failed delivery of the pipeline warning itself
does not recursively create new warnings. Watch failed jobs/logs externally
when this last channel is broken. AI job failures are separate from pipeline
availability; provider failure must not disable human workflows.

Authenticated scoped self-metrics now include measured ingestion/rejections,
reported SDK drop/recovery and logical storage growth; see `SELF_MONITORING.md`.
The ADMIN `/operations/applications/{id}/self-health?environmentId={id}` projection
is a source for a separately authorized external metrics integration, not a public
probe. Use a host-verified operational identity with explicit environment-wide
ADMIN grants, never a public Browser ingestion credential or a bearer in a URL.
The one-hour server event-attempt failure ratio can use retryable/received counts
when received is positive; alert on failed batches separately and preserve null/
unobserved labels. SDK-reported losses are a different provenance, not additions
to those measured attempts. Auth/provider configuration and actual deployment
remain host responsibilities. Public readiness/queue-only status cannot replace
the full scoped projection. Never expose tenant metrics through public probes.
