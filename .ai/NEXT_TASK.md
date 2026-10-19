# Next Task

## GOAL-069 — Reusable Observability Hub (IN PROGRESS)

The entire approved objective remains active. Source of truth:
`docs/GOAL_069_SPECIFICATION.md` (all sections and A–I Definition of Done),
`docs/GOAL_069_EVIDENCE.md`, current state and DEC-038 through DEC-044.
Historical GOAL-060 Personal Service is not renamed. Do not start another Goal.

### Latest implementation boundary

The independent packages/server, scoped identity/RLS, ingestion/queue,
Issue/Incident/rules/feedback/Console, Investigator/budget, alerts, retention,
OpenAPI and independent Browser/Node/Python/C# acceptance are implemented.
Automatic diagnostic reporting now has bounded Browser IndexedDB replay,
Node process-level reporting, expected-scope assertions and a Persian self-health
Console. Real lost-ACK/reload proves one persisted report; shared Console RTL
works at four widths. Late-response/context/logout handling has explicit tests.
This is not a blanket completion claim for all product workflows or the live
Jupiter shell. Section-63 Help is runtime-published with actual Jupiter operations,
Platform-panel and Feedback acceptance. The measured local performance checkpoint
and Node hot-path remediation plus full-limit Browser/batch/redaction QC bring
the full release gate to 369 tests with concurrent/product-read boundary
measurements and the performance flag enabled. Inspect
latest Evidence for gates/runtime/remote commit.

### Remaining work — preserve the full original scope

1. Finish the requirement-by-requirement audit, not just a test-count check.
   Reconcile every explicit specification requirement, A–I item and all 47
   required Evidence sections with actual authoritative execution. Identify and
   implement missing analytics/operational workflows and cross-domain scenarios.
   Do not mark broad phases complete from narrow service tests.
2. Verify real product Worker capture and the remaining authenticated Jupiter
   host/shell/role workflows. Independent reference/shared Console acceptance
   is not a substitute. Maintain tenant/App/environment/actor isolation,
   denial/manual-workflow continuity and genuine authorization.
   The concrete `apps/api/src/worker.ts` capture gap is now closed locally with
   safe automation/enumerated-tenant context, sanitized fallback and actual
   lifecycle-cycle tests. Preserve it and include its real-host behavior in the
   remaining cross-domain/final acceptance; do not substitute its focused tests
   for the full host/workflow audit.
3. Preserve the completed section-63 Help checkpoint: eleven registry-validated
   guides, RUNTIME revision 2, explicit slug-only publication and unchanged
   unrelated Help. Actual Jupiter login/Edge covers operations, Platform panel
   and Feedback at four widths with full reader bounds. Include this evidence in
   the final audit, recheck content if subsequent functionality changes, and
   retain version history. Do not put credentials in metadata/evidence/screenshots.
4. Finish full performance acceptance in specification section 64. Preserve the
   measured disposable-DB 1,000-event HTTP/aggregation/dashboard/retention/AI
   scheduling checkpoint and Node incremental-byte microbenchmark/regressions.
   Preserve real Browser default-capacity count/byte saturation, offline/reload/
   renewal and exact SQL delivery; CDP metrics are samples, not peak/retained RSS.
   Both SDK byte-bounded batches and shared email-matcher policy parity are
   covered. Preserve concurrent 200-event overlap/commit latency and actual
   TicketController read-path baseline/observed boundary measurements. These
   do not replace full AppModule/Browser/write lifecycle/automatic-flush impact.
   Review representative larger-scale bounded logical
   storage-sampling fairness/deadlines/scan cost at scale; small fixtures alone
   do not prove performance. Keep source provenance and unobserved states honest.
5. Finish security/failure-isolation acceptance (sections 55–58 and 65), full
   responsive RTL host coverage, cleanup and final requirement-level QC.
   Run complete API/Web/Hub tests, lint/typechecks/builds, migration rehearsal
   and git diff --check. Do not inflate skipped/optional tests as executed.
6. Synchronize project brain and Evidence, commit/push only Goal-owned changes
   and verify remote SHA. Mark complete only after all requirements are proven,
   then stop; no next Goal.

### Execution boundaries

- LOCAL development/acceptance only. No Preview/main-host promotion; do not touch
  the co-hosted Arandi application/database. GOAL-059 staging gates stay separate.
- Local Jupiter API is 3000 and Web is 5174; 5173 belongs to another application.
  Verify the exact owned process before any restart and check active AI attempts.
- Migrations through 072 are local (83 total, 27 Hub tables); no further SQL
  migration is required for automatic diagnostic transport/Console.
- Approved GapGPT configuration remains unchanged: gpt-6-luna, encrypted key and
  100,000 combined input/output tokens per UTC month. Do not ask for another key,
  switch provider or invent unknown usage reconciliation. This is not customer
  commercial allowance. No audio operation was added.
- Preserve unrelated user training-document edits, output/tmp and AGENTS.md.txt.
  Do not share to another chat. Use no subagents unless explicitly authorized.
- Temporary fixtures stay in disposable databases or supported test paths;
  never weaken authorization, leave temporary roles, or alter tenant business
  data to make screenshots look populated. Preserve runtime Help publication.
