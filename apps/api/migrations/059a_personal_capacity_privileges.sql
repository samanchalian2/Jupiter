-- GOAL-063 hardening: Platform-owned overrides and purchased allocations are read-only to tenant role.
REVOKE INSERT,UPDATE,DELETE ON personal_allowance_overrides FROM jupiter_app;
REVOKE INSERT,UPDATE,DELETE ON personal_package_allocations FROM jupiter_app;
