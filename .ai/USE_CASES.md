# MVP Use Cases

1. Requester creates a text draft, reviews AI suggestions, and submits it.
2. Requester uploads voice; transcription and analysis update the draft without
   blocking manual completion.
3. Supervisor views a department queue and assigns or reassigns an expert.
4. Requester and expert exchange messages; experts add private internal notes.
5. Expert resolves a ticket; policy closes it or requester confirms/reopens it.
6. Requester rates a resolved or closed ticket.
7. Organization Admin manages members and organization-scoped catalogs.
8. Platform Admin configures each organization's AI credential, models and
   entitlement without exposing stored keys.

## Master Upgrade use cases

9. A public account can create a draft, verify its email, submit or cancel its
   own organization application; a Platform Admin reviews it, may request
   information or reject with an applicant-visible note, or provisions one
   setup tenant with an initial owner.
10. An owner resumes setup through the assigned organization URL and prepares
    users manually, by CSV, or later through directory provisioning.
11. An Organization Admin previews a directory sync, confirms mapping and
    monitors an outbound-only on-premises connector without exposing secrets.
12. An owner views active services, shared AI allowance, packs, expiry and
    permitted overage; a Platform Admin manages agreements and adjustments.
13. A requester asks for help from Jupiter under organization policy; access
    is approved, scoped and auditable before a Jupiter agent can view data.
14. A user or administrator reads only audience-permitted Persian product help
    and opens contextual help from an approved feature mapping.

## Personal Service use cases (approved by GOAL-060)

15. A public user verifies email and receives exactly one private personal
    workspace, without losing any organization membership.
16. A personal user creates a draft, attaches files, optionally uses AI and
    submits a support request to Jupiter when capacity is available.
17. A Jupiter agent accepts a personal support case through a time-bound,
    ticket-scoped grant; exactly one reserved support unit settles.
18. A personal user buys a support or AI package, returns through a verified
    payment callback and receives one idempotent allocation and receipt.
19. A Platform Admin configures personal service availability, catalog/SLA,
    monthly defaults, workspace overrides and separate package catalogs.
20. The same account uses `/personal`, belongs to one or more organizations and
    may submit an organization application without merging tenant data.
