# Next Task

## Commercial transformation — Phase 6

**Status:** IN PROGRESS

Implement SLA and automation: business calendars, SLA policies and timers,
warnings, escalation, assignment rules, and notification preferences. Preserve
tenant isolation and prove calculation and escalation under two tenants.

**Prerequisites verified:** Ticket SLA clock and policy schema exists. The
ticket workspace and complete collaboration experience are implemented and
validated. Migration 013, admin policy/calendar UI, and tenant-safe periodic
warning/breach monitor are implemented and locally browser-tested. Due times
now use each organization's timezone/workday calendar; deterministic calendar
and two-tenant escalation integration tests pass. Assignment-rule and
notification-preference tables now exist, and a matching active rule assigns
new tickets automatically. Remaining: administrator/user API and UI for those
two settings, plus an end-to-end assignment test.
