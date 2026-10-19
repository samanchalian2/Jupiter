# GOAL-069 — Working requirement audit (IN PROGRESS)

This is a requirement-to-source audit, not a completion certificate or replacement
specification. `GOAL_069_SPECIFICATION.md` including its approved preamble remains
authoritative. The existing 47-section Evidence index locates execution records;
its existence and the 423-test baseline do not prove every required feature.
No requirement is waived because an existing suite does not assert it.

## 2026-10-19 targeted findings

| ID / source requirement | Inspected authoritative source | Result and required work | Why previous green evidence is insufficient |
| --- | --- | --- | --- |
| A01 — section 8 Application Registry: manageable name/description, enabled status, ingestion and sampling policies | `observability/server/src/registry.ts`: createApplication/configureApplication; `server/src/http-api.ts`: registry routes; `console/src/index.tsx`: applications section; migration 063 applications | **INCOMPLETE.** Create stores name/slug/description/origins, but configuration only edits origins; UI only lists Apps and creates name/slug. Enabled and bounded policy JSON exist in SQL but no supported management command/UI edits them. Retention, AI, rules and grants have separate real APIs; they do not supply the missing registry controls. Implement authorized/audited compatible management and real UI acceptance, not direct SQL editing. | SQL can manually disable an App and credential validation denies disabled Apps; this proves enforcement, NOT a usable management workflow. A column or interface label is not implementation. |
| A02 — section 14 configurable Browser retention | BrowserSdkConfiguration/constructor/capture/submitFeedback; DEC-049; SDK tests; reference retention.html + offline-browser-acceptance.ts | **IMPLEMENTED AND VERIFIED.** Optional bounded retentionMs events/feedback, copied/validated at construction, defaults 48h/24h, minimum 1000ms, no extension past previous limits. Immutable enqueue-time expiry survives retry/reload; new configuration applies to new envelopes. Four regressions pass (SDK 41). Native IndexedDB real-time expiry/default-policy reload removes both rows before SDK auth/transport, zero SQL rows. Full LOCAL 428-test gate, both fault scripts and cleanup pass. | Earlier fixed-default expiry tests did not prove configuration. This evidence covers enqueue-time Browser TTL, not server retention or physical deletion while storage is unavailable. |
| A03 — section 19 retry on successful API connectivity probe / next authenticated activity | Browser SDK start/listeners/flush, JupiterObservability authenticated fetch/session hooks | **NOT YET PROVEN.** Startup/online/visibility/timer and explicit flush are implemented and executed. Identify a supported explicit successful-connectivity/authenticated-activity trigger and demonstrate it with backoff/context guards; if absent, implement without per-event synchronous dispatch or false online claims. | Successful periodic recovery is not proof that those named triggers exist. Do not count optional Background Sync as mandatory. |
| A04 — section 34 configurable bounded rule-evaluation interval | `apps/api/src/observability/hub-binding.service.ts`: lastRules and hardcoded 60000/2000 drain; `server/src/rules.ts` | **INCOMPLETE HOST CONFIGURATION.** Rule thresholds/windows/cooldowns and Investigator cadence are configurable, but the host evaluation scheduler uses fixed constants. Provide bounded explicit host configuration and scheduling tests; no new queue or service is required. | Configurable rule windows/AI cadence do not configure scheduler frequency. |
| A05 — section 39 complete Overview | `server/src/operations.ts`: overview; `console/src/index.tsx`: overview render | **INCOMPLETE.** Real active counts, impact totals, operation error rate and hourly trend exist. The required critical-issue count, application-health projection, recent releases, high-impact problems and latest AI findings are not all returned/rendered as Overview sections. Add truthful bounded scoped projections, UI and filters/role tests; preserve unknown values and separate current state from event-window metrics. | Separate Analytics/Issues/AI pages do not satisfy the explicit main Overview requirement. Prior tests assert the implemented subset. |
| A06 — DEC-044/DEC-048 diagnostic-only storage failure must not switch the data queue | Browser SDK checkpointMetrics; five data-write regressions and diagnostic tests | **DEFECT REPRODUCED AND REMEDIATED; full 424-test LOCAL gate and both fault scripts passed.** A METRICS-only put failure called degrade(), closed the data store and changed active queue status from DURABLE/1 to MEMORY/0, overwriting the data failure state. One new red test proves it. Checkpoint now leaves metric snapshot unacknowledged and reports its own fixed failure without degrading data storage. Recovery sends the original Event ID and same diagnostic report, with no recursive loss. | Existing metrics network retry tests did not inject checkpoint journal write failure; earlier data-write tests deliberately disabled metrics. Previous ADR text was stronger than actual code. |

## Scope/decision controls for remediation

- A06 restores an existing approved invariant; no API/schema/module/provider or
  secret-policy change is made. It does not disable legitimate MemoryQueue
  fallback when the actual DATA store becomes unavailable.
- A01/A02/A04 need recorded implementation decisions before altering public
  contracts/configuration under the repository agreement. Keep additive API
  compatibility, generic principals, current-grant revalidation, whole-App versus
  environment scope, tenant RLS and immutable audit attribution. Reuse existing
  App fields/policy where adequate; do not pre-create an entity/schema speculatively.
- Do not disable/reconfigure the active local Jupiter Application to populate
  screenshots. Use authorized disposable Apps/environments and restore fixtures.
- A05 must not invent health/impact values or expose another tenant's evidence.
  An absent observation remains unknown; an AI failure must not fail Overview.
- No new architecture/service, staging prerequisite, production SLO or requirement
  for ten fully loaded products is added. LOCAL-only acceptance and GOAL-059's
  separate BLOCKED status remain the approved boundary.

## Audit work not finished

The source sections 1–73 and DoD have been reread. The rows above record concrete
findings, not final disposition of every bullet. Continue reconciling the other
explicit Console/detail/correlation, security, performance, integration,
versioning, Help and final-report requirements with current code and executed
evidence. Expand each remaining claim at the requirement's actual scope; do not
replace this work with one PASS per section or a search result.

Before final completion, every explicit numbered requirement, named artifact,
command/gate, A–I phase and DoD item needs an inspected implementation/execution
record or an explicit unresolved gap. Current verdict remains IN PROGRESS.
