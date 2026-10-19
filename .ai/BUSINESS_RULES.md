# Business Rules

## Offline data-write failure isolation (DEC-048)

- Retry metadata and ACK/expiry/context removal failures must not reject consumer
  work merely because storage failed. Use the existing bounded memory fallback.
- Preserve envelope ID, payload, original expiry and partition. Never copy an
  old-context envelope after a generation change. Denials remain terminal.
- Memory is not durable across reload. Unavailable physical storage deletion is
  best-effort; no alternate storage channel or credential persistence is added.
- Automatic diagnostic journal failures retain DEC-044's independent policy.

## Explicit product comparison (DEC-047)

- Compare 1–10 distinct Applications with one concrete environment/optional
  tenant each; no implicit all-platform product set or overlapping target rows.
- All targets share the same captured <=31-day window and event filters. Any
  invalid/denied/revoked target rejects the response, never silently omits a row.
- Rank by error-event count; measured HTTP rate and distinct user/tenant impact
  are separate. No measured denominator means unknown rate, not zero quality.
- Names come from authorized registry reads. UI selections are temporary and
  grant no access; selection/filter changes clear/abort obsolete results.

## Scoped analytical reports (DEC-046)

- Current operational grant and explicit App/environment/tenant guard aggregates;
  filters never grant access. Maximum 31 days, 50 ranks, 750 UTC-hour buckets.
- One event cohort defines technical rankings/linked history; Feedback without
  a technical link appears only without severity/category/release filters.
- Unknown dimensions/rates/durations remain null, not fabricated zeros. Resolution
  excludes unresolved/negative intervals; lifetime reopen count is not window count.
- Observed release HTTP-rate delta is not a causal diagnosis or rule-engine verdict.
- One-App report is not a multi-product comparison. CSV remains separately
  authorized event export; it must not be labeled selected-statistics export.

## Diagnostic sampling failure isolation (DEC-045)

- One failed/locked scope must not prevent healthy later scopes from being
  sampled; subsequent bounded passes rotate past the last attempted scope.
- Hourly exact snapshots stay idempotent; timeout means unobserved, never zero.
- Sampling is not awaited by the shared job drain, cannot overlap itself and
  is awaited before pool shutdown. A 5s cooperative work budget is not a hard
  response SLO; pool/SQL deadlines and best-effort limits remain explicit.

## Queued Worker failure observation (GOAL-069)

- Queued AI, transcription and intake work keeps its existing processing order,
  retry states, metering and manual-ticket continuity. Capturing an outcome does
  not perform settlement, release or any second provider call.
- RETRY is WARNING with retryExhausted=false; FAILED and DEAD_LETTER are ERROR
  with retryExhausted=true. Only fixed safe metadata reaches monitoring.
- A diagnostics-only state lookup must not prevent subsequent work if it fails.
  Successful or skipped service results are not fabricated as failure events.

## SDK byte-bound batching (GOAL-069 QC)

- Both SDKs retain the established 50-event AND 524,288-byte request ceilings.
  Byte accounting includes UTF-8 payloads, JSON wrapper and commas. Eligible
  pending order and per-event IDs/ACK handling are unchanged; individually valid
  large events must not trigger an oversized request merely from batching.
- Empty diagnostic deltas do not scan the offline journal; already journaled
  reports still follow the same bounded replay/identity rules.

## Hub educational Help (GOAL-069)

- The eleven guides are public documentation, not an operations grant. Existing
  private guides retain their audiences. Operational authorization remains scoped.
- Explicit publication selection validates all requested slugs before writes;
  unchanged articles do not gain revisions and unrelated selected-out articles
  remain untouched. Existing full-catalog invocation stays compatible.
- Device-queued feedback is not finally registered until server tracking ACK;
  guide wording must preserve this distinction and scope/logout queue limitations.

## Automatic diagnostic transport (DEC-044)

- SDKs send fixed reports automatically, at most six/minute, retrying original
  ID/body up to twelve attempts and 48 hours. Metadata failure/expiry does not
  delete user events, charge AI units or recursively increase event-loss counts.
- Browser journal is bounded independently; context/logout/initial session must
  never replay or relabel another actor's diagnostic delta. Node reports remain
  process-level, not attributed to a request actor through async-local context.
- Expected App/environment headers are equality assertions, not authorization
  inputs. Current credential scope remains the only attribution authority.
- A missing source observation/initial growth is unknown, not healthy zero.
  Scoped health remains environment-wide ADMIN-only regardless of UI filters.

## Self-monitoring measurements (DEC-043)

- Server ACK counts distinguish accepted, duplicate, rejected and retryable;
  replay does not become another accepted event. Persistence failure degrades
  remaining valid entries in that batch to RETRYABLE, preserving IDs instead of
  multiplying a connection timeout by 50. Validation rejections stay separate.
- SDK retry recovery requires a valid ACCEPTED/DUPLICATE ACK after an attempt;
  online events alone are not recovery. Attempted entries later dropped/expired
  count as failed recovery; intentional sampling/logout do not count as loss.
- Metrics never consume AI/customer allowance or mutate Incidents. SDK-reported
  and server-measured totals remain visibly separate; missing observations are
  not proof of zero faults. Logical growth is not physical/shared-database space.

## Operational critical and pipeline warnings (DEC-042)

- Trusted SERVER/WORKER CRITICAL events can trigger the default one-event rule;
  Browser claims and ordinary 4xx cannot. Trusted 5xx CRITICAL stays CRITICAL.
- Terminal pipeline failures dedupe by App/env/tenant/kind/15-minute failure
  window over 24 hours; pending retries do not create warnings. Delivery failure
  of that warning is not recursively alerted. AI failure remains independent.
- Public liveness/readiness is not queue, AI or complete self-monitoring health.
  Out-of-band structured logging and external probes remain complementary.

## Owner-requested local Operations amendment (2026-10-17)

- Jupiter Hub operational AI uses the explicitly approved 100,000 combined
  input/output token monthly budget, not organization/personal commercial quota.
- All provider attempts, including retries, reserve capacity before dispatch;
  uncertain usage remains held. Exhaustion stops AI only.
- Automatic daily/weekly/periodic/critical investigations are deduplicated and
  concrete-tenant scoped; no implicit cross-Application or cross-tenant evidence.
- Workspace removal is reversible archival after suspension, exact slug, reason,
  explicit confirmation and idempotency. Personal owner identities/shared users
  are not deleted. Legacy organization archive routes remain organization-only.

## GOAL-060 Personal Service rules

- A verified public account owns at most one personal workspace. Provisioning
  is idempotent after verification and may be lazily ensured for eligible legacy
  accounts. The workspace coexists with every organization membership.
- A personal workspace is deliberately focused: personal tickets,
  conversation, attachments, notifications, Product Help and optional AI. It
  exposes no organization administration, Directory, team or SLA configuration.
- A personal ticket is supported by Jupiter. Draft creation consumes nothing;
  submit reserves monthly support capacity first and then the valid purchased
  allocation with the nearest expiry. Zero capacity preserves the draft and
  offers purchase instead of silently creating an unserviceable case.
- Agent acceptance settles exactly one support unit. Cancellation, rejection
  and pre-accept failure release the reservation. Retry or concurrent accept
  can never settle a second unit.
- A Jupiter agent is not a personal-workspace member. Access is a bounded,
  revocable, ticket-scoped grant and is removed on completion or revocation.
- The operational Personal Support request is idempotent per submitted personal
  ticket and leaves ticket status unchanged. Until GOAL-063 attaches capacity,
  request/queue/cancel consume no unit. Only an active global Jupiter agent may
  accept; concurrent acceptance produces one assigned agent and one grant.
- Platform Admin can suspend the service and configure its visible copy,
  operational SLA and bounded grant duration. Authorization, exact-ticket
  scope, tenant isolation, revocation and audit actor identity are not settings.
- Monthly defaults are 3 personal support cases and 10 AI Smart Actions per UTC
  calendar month, without rollover. Platform Admin may change future defaults
  and explicit workspace overrides; provisioned history is never overwritten.
- Current capacity consumption is deterministic: the current monthly window,
  then active purchased allocation by nearest expiry, creation time and ID.
  `RESERVED` and `SETTLED` occupy one unit; expiry/revocation blocks only new
  reservation. SUPPORT and AI pools never share units.
- A Personal Support request atomically reserves capacity before its case is
  queued. User cancellation or Platform rejection releases it; agent acceptance
  settles it exactly once. Zero capacity leaves the manual ticket unchanged and
  creates no support case.
- Support and AI packages are separate. New packages default to 365 days of
  validity; Platform Admin may set a bounded package-specific period. Allocation
  snapshots units, Toman price and expiry so later catalog edits do not rewrite
  purchases.
- Platform Admin may configure availability, catalog, operational SLA, package
  catalog, pricing, validity bounds, future allowance defaults and explicit
  workspace overrides. Users can only read their effective projection.
- Payment is fulfilled only after server-side provider verification. One order
  creates at most one allocation. Provider retries and duplicate callbacks are
  idempotent. A successful redirect alone is never proof of payment.
- Jupiter sends the snapshotted Toman amount to Zarinpal with currency `IRT`.
  The product issues a payment receipt, not an official tax invoice. Refund is
  manual outside the gateway and is recorded with reason and external reference.
- Tenant isolation, verified ownership, role enforcement, capacity settlement,
  payment verification, secret policy and audit actor identity are fixed and
  cannot be disabled from Platform Admin.

## GOAL-057 Appearance primary rules

The built-in Jupiter Light Theme primary is Lavender `#796E89`; warm Beige
`#D8C3A6` is a restrained supporting surface rather than ordinary text. A
Custom Primary accepts only canonical `#RRGGBB`, affects only the derived
primary token family and is validated server-side. Platform writes require
Platform Admin; Organization writes require the existing org operator policy.
Source precedence is System, then Platform, then Organization. Both Platform
and Organization «حذف رنگ سفارشی» operations clear only their local override
and preserve preset, density, radius and logo. Semantic colors are independent
from a Custom Primary change. Light/dark preference is local to the user and
does not change a tenant's saved appearance.

## GOAL-055 سازمان و راه‌اندازی

- Go-Live فقط برای سازمان `SETUP` توسط `ORG_OWNER` واقعی انجام می‌شود و نیازمند مالک فعال، نام نمایشی معتبر، timezone معتبر و حداقل یک Ticket Category است.
- SLA، Team/Department، کاربر اضافه، Directory، AI، Assist و Appearance اختیاری‌اند و فقط warning می‌سازند.
- وضعیت مراحل Wizard سروری، versioned و قابل ادامه است؛ skip فقط برای مرحلهٔ اختیاری توسط Owner ثبت می‌شود و حذف Ticket Category پس از تکمیل دوباره readiness را block می‌کند.

## GOAL-052 recurring Smart Action allowance

## GOAL-054 عملیات Directory Connector

- Connector status is derived from `last_seen_at`: under 5 minutes HEALTHY,
  5–15 minutes DEGRADED, then OFFLINE. Notifications are emitted only on a
  derived-state transition.
- The 15-minute run is `INCREMENTAL_SNAPSHOT`; Full Reconciliation is scheduled
  daily and is batch-complete before absence evaluation. AD delta tracking is
  neither claimed nor implemented.
- Selected-scope absence gets a seven-day OUT_OF_SCOPE grace. A principal absent
  from a successful Entire Directory FULL snapshot is suspended, never deleted.
- Directory mappings may manage only REQUESTER, EXPERT and SUPERVISOR grants;
  ORG_ADMIN/ORG_OWNER and all manual role grants remain untouched.
- Re-pair is an explicit ORG_ADMIN/ORG_OWNER operation for a `REVOKED`
  connector only. It preserves the Connector record, invalidates any unused
  pairing code and restores `PAIRED` only after a one-time, short-lived code
  produces a new device identity and credential.

- `AI_TICKET_REVIEW` و `AI_SMART_INTAKE` از یک استخر سازمانی مشترک استفاده می‌کنند: پیش‌فرض فعلی ۲۵ دوره‌ای و ۳ اضطراری در هر ماه تقویمی UTC؛ هر دو مقدار Platform-configurable هستند و rollover ندارند.
- ترتیب reservation قطعی است: PERIODIC، ADDON فعال، EMERGENCY، Overage فعال همان capability و سپس deny. انقضای پیش‌فرض Add-on دوازده ماه است؛ تیکت دستی از تمام denialهای AI مستقل است.

## GOAL-051 complete AI Smart Action coverage

- Ticket Review is one billable `AI_TICKET_REVIEW` action; a complete Smart Intake analysis is one billable `AI_SMART_INTAKE` action, including its voice and structured-output stages.
- Only a valid, persisted and user-presentable outcome settles a unit. Provider failures, validation failures, cancellation, retry, fallback, diagnostics and internal calls release or retain the same reservation and do not create an additional settlement.
- Manual ticket creation and submission remain available whenever AI capability, subscription, quota or overage denies an action.

## GOAL-050 commercial subscription lifecycle

- گذارهای اشتراک فقط از سرویس Platform و مطابق گراف رسمی انجام می‌شوند؛ لغو دلیل لازم دارد و لغو‌شده دوباره فعال نمی‌شود.
- در `PAST_DUE` تا پایان مهلت، قابلیت تجاری برقرار است؛ پس از انقضا یا تعلیق/لغو، Smart Action و پذیرش جدید Assist متوقف می‌شود اما تیکت دستی و پروندهٔ Assist پذیرفته‌شده ادامه دارد. پذیرش Assist فقط با capability `JUPITER_ASSIST` مؤثر است؛ اشتراک محصول نامرتبط کافی نیست.
- Owner فقط برای اشتراک tenant-bound با وضعیت `ACTIVE`، `PAST_DUE` یا `EXPIRED` می‌تواند درخواست تمدید دهد؛ `CANCELLED` تا تصمیم صریح بازیابی قابل تمدید نیست.

## GOAL-049 commercial remediation

- Smart Action reservation order is periodic, add-on, emergency, enabled capped overage, then deny; failed or undelivered work releases the reservation and manual ticketing remains available.
- Only ORG_OWNER may configure overage or create commercial requests. A renewal must reference an ACTIVE or EXPIRED subscription of the same organization.

- A requester must review or edit AI suggestions before final submission.
- AI identifiers must validate against the active organization's catalog.
- Organization isolation and authorization are enforced by the backend.
- Experts see authorized department queues plus directly assigned tickets.
- Internal notes are never returned to requester endpoints.
- Assignment and status changes are immutable auditable events.
- `RESOLVED` and `CLOSED` are distinct. Closure is organization-configurable:
  requester confirmation, automatic expiration, or authorized staff only.
- Reopen obeys the organization window; otherwise a related new ticket is made.
- One requester rating is accepted only after resolution or closure.
- AI, transcription, and file failures cannot block manual ticket submission.
- AI intake never submits a ticket; final creation always requires the user's
  explicit draft request.
- The typed description is retained verbatim. Voice transcription is appended
  and never silently replaces it.
- Intake suggestions below 0.75 confidence or outside the active tenant
  taxonomy/custom-field catalog are rejected rather than applied.
- Only active tenant title and tag vocabulary is supplied to AI. New title/tag
  candidates are recorded only after explicit final ticket submission and stay
  pending until Organization Admin approval.
- Intake voice is limited to 60 seconds and 10 MB, must pass post-upload
  metadata verification, and expires with an unconsumed session after 24 hours.
- An intake may contain up to five requester text or voice messages. Raw
  requester text and voice transcripts are immutable source evidence; AI
  interpretation is separate and never replaces them.
- An AI clarification is optional and must not block final ticket creation.
  A secondary issue only becomes another ticket after explicit requester action.

## Master Upgrade rules

- Only Platform Admin may archive an organization. The organization must be an
  organization workspace already in `SUSPENDED`; personal workspaces, `SETUP`
  and `ACTIVE` tenants cannot be archived.
- Archive and restore require the exact organization slug, a 10–500 character
  reason and an idempotency key. The archive UI additionally requires explicit
  acknowledgement of member-access loss.
- `ARCHIVED` denies tenant membership context and ticket APIs without deleting
  tickets, memberships, commercial history or audit evidence. Restore returns
  only to `SUSPENDED`; activation is a separate explicit action.

- Organization applications use only the statuses in DEC-020. Applicant
  submission requires verified email. Platform review follows `SUBMITTED` →
  `UNDER_REVIEW` → `NEEDS_INFORMATION`/`REJECTED`/`APPROVED`; information and
  rejection require an applicant-visible note. Approval provisions exactly one
  `setup` tenant and initial applicant owner/admin membership atomically.
- Existing organizations remain operational without an `ORG_OWNER`; owner-only
  commercial actions require explicit Platform Admin assignment.
- A `SETUP` organization becomes `ACTIVE` only through the canonical Go-Live
  evaluator. Its legacy tenant-setup completion endpoint is a compatibility
  delegate, never a second readiness path. Re-evaluate readiness at activation:
  removal of a required Ticket Category before Go-Live blocks activation again.
  The general Platform status endpoint cannot activate a `SETUP` organization.
- Directory synchronization will provision users and memberships only. It never
  receives, stores or validates AD passwords, and can map only REQUESTER,
  EXPERT and SUPERVISOR roles.
- Directory connector pairing is organization-bound and owner/admin controlled.
  A pairing code is single-use for 15 minutes; revoking a connector invalidates
  its device credential and unused pairing material. GOAL-036 has no directory
  synchronization behavior.
- A directory sync produces a preview before apply. It may create, update,
  suspend, mark out-of-scope or leave a principal unchanged. Disabled accounts
  suspend immediately; full-sync scope exit has a seven-day grace. Directory
  synchronization never assigns or changes ORG_ADMIN or ORG_OWNER.
- Effective commercial capability will require entitlement, organization setting
  and platform availability. Server-side checks are mandatory.
- A provider call is not customer-billable. One allowance unit settles only on
  a unique, successfully delivered Commercial Smart Action; the delivered AI
  ticket review is the first implementation of this rule.
- Jupiter Assist use will settle only when a Jupiter agent accepts a permitted
  case. A request, routing, reassignment or reopen does not consume a unit.
- Restricted tickets will require a matching active support grant even when broad
  Jupiter support is otherwise enabled.
- A Jupiter support agent is never a tenant member. Its access comes only from
  an active, unrevoked and unexpired support grant; a restricted ticket needs a
  matching explicit routed-ticket grant even when full support exists.
- Product Help is platform-owned, not tenant knowledge. Only an article's
  current revision with both article and revision publication state `PUBLISHED`
  may be returned, and only where its audience intersects the caller's exact
  active role/platform audience (or `ALL`). Missing, draft, unpublished and
  unauthorized slugs share the same non-disclosing result.
- Repository Help content may create an initial published revision only. A
  later seed run must not alter an existing article or runtime revision.
- Only Platform Admin can create, draft, preview, publish, unpublish, restore
  or export Product Help. Every edit appends a revision; restore copies a
  selected prior revision into a new draft rather than changing history.
- Publishing makes one selected revision current and unpublishes a preceding
  published revision. Exports return only current published runtime content and
  may be scoped to one slug, one category or all Help.
- Product Help metadata uses the approved contextual feature and route registry.
  Repository seeds and Platform authoring reject unknown mappings. Public Help
  search is intentionally lightweight: title, summary, category and tags are
  searched, with title and exact-tag matches ranked before broader matches.
- Only Platform Admin may change platform appearance. It accepts only approved
  brand, density and radius presets plus an internal managed logo path;
  organization branding cannot alter semantic colors, density, radius or
  security-sensitive UI.
# GOAL-053 — Jupiter Assist capacity

Assist request, approval, queueing and assignment attempts do not consume commercial capacity. Exactly one unit is settled only when a permitted Jupiter agent accepts a queued case. New acceptance needs both an effective `JUPITER_ASSIST` commercial capability and valid package capacity; accepted cases remain operable after later capacity expiry or suspension. Capacity order is valid included package, promotional/manual/legacy credit, then purchased package, each by nearest expiry and stable creation/id tie-breakers. No Assist emergency or overage exists.
Existing organizations may remain ownerless. Only Platform Admin may explicitly assign or revoke `ORG_OWNER`; both actions are audited and revocation never changes the member's other organization roles.

## GOAL-065 personal experience

- A personal workspace consumes Ticket Review and Smart Intake only from its
  `AI` personal-capacity pool. One delivered logical action settles one unit;
  retry, failure or cancellation releases the reservation. Organization Smart
  Action commercial policy is unchanged.
- Platform Admin owns personal AI enablement and provider configuration. A
  personal user can view capacity and buy active packages but cannot change
  allowance policy, package definition, provider settings or settlement.
- A personal payment callback returns only a safe result/order reference to the
  Web route. Provider authority and raw provider failures never appear in the
  browser URL. A receipt is not a tax invoice.
- Personal Support request and cancellation do not change ticket lifecycle.
  Cancellation is available only while queued and releases reserved capacity.
