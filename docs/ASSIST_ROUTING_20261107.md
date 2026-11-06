# Organization-authorized direct Assist — implementation evidence

Status: IN PROGRESS. No Preview/main publication yet.

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

## Remaining

Complete final API/Web checks, expiry/revocation/batch/isolation coverage, responsive
authenticated browser acceptance, Preview/main deployment with scoped backups,
runtime Help publication, commit/push and final evidence. No completion claim yet.

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
