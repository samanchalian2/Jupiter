# Test Strategy

Unit-test domain state transitions, policies, and AI validation. Integration-
test PostgreSQL/RLS, repositories, outbox, queues, and storage adapters.
Contract-test REST/OpenAPI and provider fixtures. E2E-test text and voice draft
flows, manual fallback, assignment, conversation, closure, reopen, and rating.
Security tests must prove cross-organization denial, internal-note secrecy,
permission denial, and signed-URL authorization. Every Goal runs the smallest
relevant test set plus lint/type checks once tooling exists.

## Master Upgrade test gates

- Migration rehearsal covers legacy users, memberships, active/suspended
  organizations and existing sessions without data loss.
- Application tests cover every exact lifecycle state, verification gate,
  idempotent approval/provisioning and cross-tenant denial.
- Provisioning tests prove Platform Admin-only review, slug-conflict rollback,
  one setup tenant plus initial owner/admin membership, idempotent retry and
  no automatic owner promotion for existing organization administrators.
- Identity tests cover legacy email/username login, public accounts without a
  membership, directory users with and without email, and no AD-password path.
- Public onboarding tests cover verification delivery status before/after
  confirmation, authenticated development inbox access only, and a production
  configuration that cannot fall back to local token exposure.
- Directory tests cover organization binding, pairing expiry, device revocation,
  replay denial, preview/delta/full idempotency and scope exits.
- Commercial tests cover capability combinations, atomic reserve/release/settle,
  pack ordering, no duplicate customer unit for retries, and no billing for
  diagnostics or provider-only calls.
- Assist tests cover owner-only commercial actions, grant expiry/revocation,
  restricted-ticket denial and one unit only on Accept.
- Help tests cover audience filtering, draft/unpublished denial, revision
  restore, seed safety and export authorization.
- Affected web experiences are verified in Persian RTL at 375, 768, 1024 and
  1440px with keyboard access and no document horizontal overflow.
