# Next Task

## Commercial transformation — Phase 9

**Status:** IN PROGRESS — staging gates required

Run the staged deployment gates in `docs/STAGING_RELEASE_CHECKLIST.md` against
an actual staging environment: image build/publish, migrations, ingress health,
TLS/CSP, authenticated browser E2E, production-like load baseline, and managed
backup/restore evidence. Record the results in `docs/RELEASE_EVIDENCE.md`.

**Local evidence complete:** `pnpm verify:release`, runtime health/readiness,
request security controls, smoke load, local browser smoke and an isolated
PostgreSQL restore/RLS drill are complete. Docker and staging infrastructure
are not available in the current workspace, so Phase 9 must not be marked
complete until those external gates are proven.
