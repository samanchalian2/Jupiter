# Observability Reference Client (independent Browser + backend)

This is a small, executable integration consumer, not a Jupiter feature module.
It imports the generic Browser/Node SDKs, React adapter and Operations Console;
there are no imports of Jupiter users, tenant tables, tickets, settings or sessions.
It is acceptance/demo code, not a public account system or production deployment.

`backend.ts` accepts the consuming product's verified-session port. Its
`current`, `switchTenant` and `logout` implementations must authenticate the
session, enforce membership on every switch and revoke the actor's previous
browser credentials on logout. Do not forward user-supplied actor/Application/
tenant fields to credential minting. The sample only sends the trusted resolved
scope. Commands require a matching Origin/Host and have a small body bound.
Permanent server credentials stay exclusively in the backend configuration.

The frontend obtains public scope/endpoint through `/reference/session` and
short-lived credentials through its authenticated backend. It uses native fetch
and the real IndexedDB Browser SDK, with no custom in-memory queue or fake ACK.
Buttons generate sanitized technical errors, a controlled backend failure,
React boundary recovery, own Feedback, tenant switch, tenant-free context and
logout. Backend and Browser failures share W3C trace/request IDs. Browser queues
store no credentials. The generic Console demonstrates cross-Application
selection and maintenance; its authenticated transport is supplied by the host.

## Build and real-browser acceptance

```sh
pnpm install --frozen-lockfile
pnpm prepare:observability
pnpm --filter @observability/reference-browser build
```

For executable browser acceptance, configure the same isolated-PostgreSQL test
connection as `observability/server`, set
`OBSERVABILITY_BROWSER_ACCEPTANCE=true` and select an already installed browser
with `OBSERVABILITY_BROWSER_CHANNEL=msedge` (or `chrome`). Alternatively install
Playwright's supported browser through its official tooling and leave channel
unset. No signed-in user browser, persistent profile or remote-debugging session
is used. Run:

```sh
pnpm --filter @observability/server test
```

Optional `OBSERVABILITY_BROWSER_ARTIFACT_DIR` saves local 375/1440 maintenance
screenshots. They contain only controlled fixture data; do not place the output
directory under Git tracking. The complete release gate can combine this flag
with the Python/C# acceptance flag documented in the parent examples README.
If the flag is absent the browser case is explicitly skipped, not reported as
executed. The rest of the suite still requires real PostgreSQL.

The harness provisions two independent Applications/environments/principals and
explicit grants in a temporary `obs069_*` database. The host verifies a random
HttpOnly fixture-session cookie, has authorized tenant choices and proxies the
Console with an independent scoped operational identity. This is a fixture auth
adapter, not a shipped login bypass; the production consumer must implement its
own real login/identity provider. Browser credential mint rejects any supplied
scope body; unapproved tenant switches fail. No real credential/provider data
or Jupiter identity is imported into the fixture.

Actual acceptance covers:

- Frontend/default-native-fetch, backend, React error-boundary and own Feedback
  ingestion into real PostgreSQL; shared trace/request correlation.
- Full network disconnection via the browser context, a sanitized IndexedDB
  envelope, then reload with ingestion held offline to prove the persisted event
  still exists after reopening the page, then actual reconnect/delivery.
- A transport interceptor discards an ACK AFTER the real server commits. Retry
  keeps the event ID/payload and leaves exactly one persisted event.
- Real Issue aggregation in the independent Application, Console Application
  selection and denial of cross-Application/environment combinations.
- Application B Investigator execution with persisted evidence and validated
  findings. This scenario uses a controlled provider port with known usage,
  not GapGPT or any external provider/budget. Real GapGPT acceptance remains
  separately recorded for the explicitly configured local Jupiter Application.
- Authenticated maintenance UI in the shared independent Console at
  375/768/1024/1440, RTL/no document horizontal overflow, unconfirmed-save denial,
  and explicit same-policy save in the disposable fixture only.
- Offline tenant-switch queue removal, tenant-free Feedback, logout queue
  clearing/credential revocation and another authenticated actor reusing the
  same browser storage without receiving/replaying the previous actor's data.
- Real browser IndexedDB open denial followed by visible MEMORY degradation,
  with capture/manual UI still usable. No guaranteed offline storage is claimed.

Listeners, browser contexts/process and temporary database are closed/removed in
finally cleanup. The UI is mounted only on a random loopback port. Neither live
Jupiter tenant data nor Preview/main host is changed. The fixture is intentionally
not a full deployment, production SDK release, total-host monitoring installation
or blanket acceptance of every Jupiter screen.
## Automatic diagnostics acceptance

The sample has a controlled 20-item event queue and “آزمون افت صف” action that
creates an actual overflow, not a fabricated counter POST. Browser diagnostics
are automatically journaled/sent by the SDK. The Edge test discards a committed
metric ACK, reloads real IndexedDB and renews credentials, then proves one row
for the same UUID/body. The shared self-health Console is checked at 375/768/
1024/1440 RTL with unknown-source labels, no list pagination/CSV and Viewer
denial after App switch. Native backend SDK replay is independently tested over
real HTTP/PostgreSQL. No real customer tenant or external AI key is used here.

## Full-limit offline performance

The separate development-only `performance.html` fixture uses normal 500-event/
2MiB caps rather than this sample UI's small 20-event demonstration queue. With
both Browser/performance acceptance flags enabled, real Edge exercises small and
large UTF-8 event queues, actual offline flush, page reload/credential renewal,
all outgoing batch sizes and exact SQL delivery. CDP heap/task samples and actual
capture/replay times have explicit non-peak/non-production limitations. See
`../../PERFORMANCE.md`; this fixture is not a new Jupiter product page or a
production-distribution build entry.
