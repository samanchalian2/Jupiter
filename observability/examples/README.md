# Independent HTTP integration examples

These backend-only programs use the public Hub JSON API, not Jupiter modules,
cookies, user tables or business services. They send a controlled technical
event, not raw exceptions, request bodies or user content. They are executable
examples, not production SDKs: their in-memory pending batches do not survive a
process crash. A production backend needs a durable outbox and its own redaction.

## Contract and authentication

Download `GET /api/v1/observability/openapi.json` from your Hub host. The canonical
document is exported as `openApiDocument` by `@observability/server`; the HTTP
route and tests use that exact object. It documents the currently executable
HTTP operations only. Scoped grant and integration-key management, including
rotation/revocation, now have documented ADMIN HTTP/Console workflows; trusted
bootstrap/global-authority ports remain deployment-owned, not public endpoints.
OpenAPI 3.0.3 is used for broad generator
compatibility: [official specification](https://spec.openapis.org/oas/v3.0.3.html).

An authorized Hub administrator creates an Application and its environment, then
issues a scoped server credential through the documented API. Read the credential
from your backend secret store into its process environment; never put it in
source, shell history, URLs, browser code, stdout or evidence.

Both programs read these environment variables:

| Variable | Meaning |
| --- | --- |
| `OBSERVABILITY_ENDPOINT` | Hub base URL, e.g. `https://hub.example.test/api/v1/observability` |
| `OBSERVABILITY_APPLICATION_ID` | Issued Application UUID |
| `OBSERVABILITY_ENVIRONMENT_ID` | Environment UUID belonging to that Application |
| `OBSERVABILITY_SERVER_CREDENTIAL` | Revocable backend-only credential from secret store |
| `OBSERVABILITY_VERIFY_REPLAY=1` | Optional example: replay the same event ID and payload |

HTTPS verification is enabled; redirects are refused to avoid forwarding bearer
credentials. `OBSERVABILITY_ALLOW_LOCAL_HTTP=1` permits HTTP **only** for explicit
loopback testing, never for a remote IP/hostname. No cookie is needed.

```sh
python observability/examples/python/ingest.py
dotnet run --project observability/examples/csharp/ObservabilityClient.csproj -c Release
```

Python uses only its standard library (3.10+). The C# project uses .NET 10 (the
installed acceptance SDK), `HttpClient` and `System.Text.Json`, with no NuGet
dependencies. It is a plain console project and has no reference to Jupiter.
The example prints only terminal ACK counts. Exit code 1 means a safe generic
configuration/transport/rejection failure; server bodies and credentials are not
printed. An example successful replay prints `first.ACCEPTED=1` and
`replay.DUPLICATE=1`. If an ACK was lost after commit, the first visible outcome
may already be DUPLICATE; that is terminal success, not a second persisted event.

## Error handling and retries

HTTP 200 is not blanket acceptance. Inspect every event ACK:

- ACCEPTED and DUPLICATE: remove that event from the pending batch.
- REJECTED: terminal; inspect the safe reason through a separately controlled
  operational workflow, not raw provider/server bodies. Do not retry unchanged.
- RETRYABLE or missing ACK: retain original ID/payload for retry.

Both examples validate ACK identity/status/duplicates before applying any ACK.
Transient transport/5xx/429 responses use at most five attempts with exponential
delay, jitter and bounded Retry-After. 401/403/invalid requests and redirects fail
without an unchanged retry loop. HTTP/socket timeout is ten seconds; response and
batch/event byte bounds are enforced. Python's socket timeout is not a hard
whole-operation wall-clock deadline; production hosts should add overall request
cancellation/supervision. Do not mint a fresh event ID or timestamp
for an automatic retry. No exactly-once network delivery or guaranteed offline
recovery is claimed. A backend may attribute actor/tenant only after verifying
its own application identity; never trust arbitrary user-supplied IDs.

Browsers use a different flow: their trusted backend checks authenticated actor
and membership and calls `/credentials/browser` with the server credential. Only
the returned short-lived identity-scoped credential reaches the Browser SDK.
Allowed Origin is an extra check, not authentication. The examples here are not
a public anonymous browser credential-minting service.

## Reproduce local external-client acceptance

First build the project and Hub workspace dependencies. With an isolated-test
PostgreSQL administrator configuration available, set
`OBSERVABILITY_REFERENCE_CLIENTS=true` and `OBSERVABILITY_PYTHON` to your actual
Python executable path, then run:

```sh
dotnet build observability/examples/csharp/ObservabilityClient.csproj -c Release --nologo
pnpm prepare:observability
pnpm --filter @observability/server test
```

The real HTTP/PostgreSQL contract test launches both executables against a newly
provisioned independent Application in a disposable database. A loopback proxy
loses the first ACK **after the database commit** and returns 503. Both programs
retry the same event, receive DUPLICATE, and explicitly replay it again. The DB
still contains exactly one Python and one C# event. Further runs verify invalid
credentials fail and redirect targets receive zero requests. The child
processes receive only their scoped fixture credential and basic runtime paths,
not the parent's database or provider secrets. Test database/listeners are removed
afterwards. Without the explicit external-client flag the normal suite still
exercises all documented HTTP operations, but does not claim C#/Python execution.

This acceptance does not replace the separate mandatory Browser reference app,
IndexedDB offline/reconnect/logout/tenant-switch acceptance or target-host TLS
acceptance. Those remain tracked in the Goal Evidence.
