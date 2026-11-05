# Membership visibility remediation

Main runtime role enforced RLS: unscoped authentication and ticket actor queries
returned no memberships despite existing active owner/admin roles. DEC-067 scopes
discovery to each nonarchived tenant and authenticated subject, restores context,
and scopes actor lookup to the requested tenant and token subject. No policy,
grant, role or customer membership changes. Current implementation has two DB
round trips per organization on login/refresh; scaling requires reassessment.

Main received narrow compiled overlays with backups, not a full GOAL-070 rollout.
Real affected account login/refresh returned four memberships; setup wizard200,
members200, personal tickets200 and unrelated tenant401. Synthetic test session
revoked. Setup wizard GET may initialize normal setup progress/audit; no fixture
or customer organization was deleted. Main readiness200, Arandi service active.

Isolated PostgreSQL rehearsal85 migrations and seven focused tests pass; foreign,
archived, inactive and revoked memberships tested under runtime RLS. Web64 tests,
API/Web typecheck and API build passed. An initial direct integration run was
rejected by its deliberate disposable-database guard; isolated rerun passed.
Full API suite previously had one stale mock failure, corrected; no successful
complete rerun output was retained. Work Browser unavailable: no visual acceptance
claim. No credentials or tokens included here. User-owned unrelated changes kept.
