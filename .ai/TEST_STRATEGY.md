# Test Strategy

Unit-test domain state transitions, policies, and AI validation. Integration-
test PostgreSQL/RLS, repositories, outbox, queues, and storage adapters.
Contract-test REST/OpenAPI and provider fixtures. E2E-test text and voice draft
flows, manual fallback, assignment, conversation, closure, reopen, and rating.
Security tests must prove cross-organization denial, internal-note secrecy,
permission denial, and signed-URL authorization. Every Goal runs the smallest
relevant test set plus lint/type checks once tooling exists.
