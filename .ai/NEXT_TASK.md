# Next Task

## GOAL-054 — Directory Connector Operational Completeness

GOAL-054 is the active, single implementation goal. Complete the operational
Directory Connector without changing its outbound-only architecture: derived
health, lightweight heartbeat, `INCREMENTAL_SNAPSHOT` scheduling plus Full
reconciliation, safe scope/lifecycle handling, group-role mapping, run history,
conflict visibility, Persian Help and acceptance evidence. Do not start
GOAL-055. Evidence will be `docs/GOAL_054_EVIDENCE.md`.

GOAL-053 کامل شد. Evidence: `docs/GOAL_053_EVIDENCE.md`.

GOAL-052 کامل شد. طبق محدودهٔ مصوب، Goal بعدی آغاز نمی‌شود.

GOAL-050 remediation پذیرش را گذراند. طبق محدودهٔ مصوب، Goal بعدی آغاز نمی‌شود.

## Master Upgrade complete

GOAL-030 through GOAL-048 are complete. The final local acceptance, migration
rehearsal and release-gate evidence is recorded in `docs/GOAL_048_EVIDENCE.md`.

Before a production release, execute the staging-only gates in
`docs/STAGING_RELEASE_CHECKLIST.md`; these require the deployment environment
and are not repository implementation work.
