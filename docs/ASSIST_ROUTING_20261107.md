# Organization-authorized direct Assist — implementation evidence

Status: ACCEPTED. Preview and main published; runtime Help revised on both.

## Approved behavior

Organization admin/owner enables user choice; default organization team, visible
disabled Jupiter choice and readable reason. Explicit new permission queues
directly, independent commercial gates and one settlement at ACCEPT. Existing
null permission preserves legacy request policies. No retroactive consent.
Case-specific nonrestricted 24h delegation, explicit renewal/revocation, termination
at completion. No internal notes, broad access, autoactivation or package purchase.

## Implementation

DEC-071; migration075 adds consent, delegation link/composite FK and tenant
submission receipt. New POST /tickets/requests with required Idempotency-Key
atomically creates/submits and optionally queues Assist. Existing draft/submit
routes remain, additive supportTeam input. Batch final submit accepts same choice
and optional replay key. GET /platform/assist/availability and POST organization-setting
use normal authenticated membership resolver. Support ticket/public-message APIs
require current assigned active case and live grant. TicketActorModule separates
unchanged actor discovery from ticket commands to avoid DI cycles.

## Intermediate gates (not final acceptance)

- Migration rehearsal86, isolated database cleanup/shared roles unchanged: PASS.
- Initial routing integration5: PASS, expanded actual compiled HTTP routing6 PASS.
- Routing + organization + existing onboarding HTTP51: PASS.
- Web76: PASS; production Web build PASS before final UI adjustments.
- Earlier full gate exposed stale migration counts and legacy fixture assumptions;
  fixed fixture package allocation, retry expectation and per-case counts. The first
  compiled process gate exposed Notification module cycle; actor-only import fixed
  and actual compiled HTTP tests subsequently passed.

## Final gates

- Full API:49 files,214 passed,2 optional skipped (performance/full auxiliary
  browser branches); no failures. Includes actual compiled HTTP/AppModule and
  worker fault/recovery tests, not just mocks. Final targeted Assist/legacy45 pass.
- Web:16 files,77 passed; API/Web typecheck and production builds PASS.
- Migration rehearsal86, disposable cleanup/shared role comparison PASS.
- Eight routing integration tests cover denial rollback, direct queue, concurrent
  submit/ACCEPT, request hash mismatch, zero preaccept charge, exact-once settlement,
  restricted denial, grant expiry/revocation, public-only projection, completion
  Audit/revocation, package suspension, batch routing/replay/rollback and receipt RLS.
- Manual route keeps organization autoassignment; new Jupiter submissions skip
  organization autoassignment. Existing internal visibility/permissions unchanged.
- git diff --check PASS. Unrelated gateway/training edits and output/tmp excluded
  from commits/releases. No new production credential or customer role/policy set.

## Authenticated local Browser acceptance

Disposable runner database goal070_tests_8c7ac5b20efa4a96b88f0ef55fce56eb;
normal hashed-password login, real membership roles and compiled AppModule HTTP.
Temporary organization assist-2835bcc4-d5c5-4cce-a70d-4b11e156419b. Requester
selected Jupiter, submitted ticket8, registered support agent accepted/replied;
requester reloaded and read that reply. Owner/admin switched consent off; Jupiter
option remained visible/disabled with inline reason. Accepted case still completed.
No production-like organization, credential or role was changed.

Composer/disabled choice, organization settings and support reply workspace checked
at375/768/1024/1440: RTL, document scroll widths360/753/1009/1425 respectively,
no document-level overflow. Native radio selection and keyboard Tab exercised.
Screenshots output/assist-requester-response-20261107.jpg and
output/assist-disabled-mobile-20261107.jpg (local artifacts, not Git).

Found/fixed in Browser: collapsed commercial configuration hid operational reply
form. It now excludes .assist-reply-form. Queue gains ticket number and policy
display reflects explicit organization permission. Those final projection refinements
require final compiled release smoke verification; initial Browser process used
the previous metadata projection, so ticket numbers were blank during that session.

All temporary Browser tabs closed, viewport reset, fixture API and local Vite
stopped. Runner confirms disposable database removed and cluster roles unchanged;
all synthetic accounts/memberships/tickets/grants/sessions removed with that DB.

## Deployment and restoration

Base source adfd01f archive SHA256
a96193f6eb222a9e9516a358837117e9f43241e0db073fb2725e21c76b797d5e;
2473a4e refinement (explicit grant-ending Audit/personal UI preservation) and
cc2c727 HTTP-safe Composer UUID wiring applied with scoped source/runtime backups.
Jupiter source, not dirty gateway/training edits, compiled on Linux. Dependencies
reused from the previously installed Jupiter releases; no package/service changes
to Arandi. Build warning remains the existing >500kB Web bundle advisory.

- Preview current: /opt/jupiter/releases/assist-routing-20261107.
  Backup /opt/jupiter/backups/assist-routing-20261106T215402Z.
- Main current: /srv/jupiter/releases/assist-routing-20261107.
  Backup /srv/jupiter/backups/assist-routing-20261106T215619Z.
- Each backup contains Jupiter-only pg_dump, previous release and readiness/
  migration/restore evidence. Each was restored to a narrowly named temporary
  database, migration075 rehearsed to86, then rehearsal database dropped before
  live application. Previous release rollback retains additive compatible schema.
- Additional assist-final-refinement-before.tar and assist-http-before.tar under
  each Jupiter backups directory preserve the scoped runtime/static refinements.
- Both hosts:86 migrations,0 non-null self_service_enabled rows after publication;
  no customer consent silently enabled. API/worker/Arandi active. Arandi start time
  and restart count unchanged through initial switch and final API refinement.
  PostgreSQL service and non-Jupiter databases never restarted/modified.
- Runtime publication: jupiter-assist0 created/1 revised/0 unchanged on each host,
  using existing active local Platform Admin through supported publisher. No other
  Help article changed. CRLF env-file sourcing failed before publication; corrected
  to Node's --env-file parser without editing/exposing either environment file.
- Public main index/assets/readiness200; new availability endpoint denies anonymous
  access401 as expected. Final Web JS index-BiQWTbsf.js SHA256
  28c1616d7efcdb62479f56efbd0a1a8342f311ed22e1add8dc0596d7fc1b6e4a
  matches local/public; CSS index-CPTCbt79.css also matched.
  Final Assist module SHA256
  1ee895304a4010f44aabdaa5934c4a935f18f02d8e0e481d62051a69bd49cd42
  matches tested local module on Preview/main.

## Boundaries

Four-width authenticated business acceptance was LOCAL/disposable, not a mutation
of a hosted customer tenant. Hosted acceptance is compiled artifact/readiness/schema/
Help smoke evidence, not a real paid customer support case. No external support
operator SLA or instant notification delivery claim. Notifications are durable in
the existing tenant inbox; browser reload demonstrated delivery. Existing Platform
console is used for registered support operators; no new broad support role or
navigation created. Both hosts retain old release/backups for recovery. Preview's
Arandi backup/readiness units were already failed on initial inventory; they were
not changed or mistaken for Jupiter deployment failures. GOAL-059 staging and
self-service organization registration remain outside this execution.
