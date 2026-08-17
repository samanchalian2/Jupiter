# Ticket experience v2 evidence

**Date:** 2026-08-15  
**Scope:** ticket intake, request history, operational queue, ticket detail,
responsive behavior, and role separation.

## Delivered

- Requesters now land on one coherent page: a quick request form first and
  their ticket history immediately below it.
- The initial form asks only for title, description, and category. Priority,
  organization catalogs, custom fields, and attachment are progressively
  disclosed under “more details”.
- Staff retain an operational queue with bulk actions and saved views; the
  requester history remains personal and omits staff controls.
- Queue rows show ticket number, resilient title, status, priority, assignee
  when applicable, and the latest role-safe activity time. Default ordering is
  most recent activity.
- A direct route (`/tickets/:id`) loads one ticket independently of the queue.
  Conversation, details, and activity are separate URL-backed tabs. Reloading
  a tab preserves it.
- Public messages and internal notes remain visually distinct for staff.
  Requesters never load or render internal notes.
- The conversation composer stays close to the discussion. Ticket description,
  metadata, attachments, assignment, tags, AI assistance, and ratings live in
  their appropriate detail areas rather than interrupting the conversation.
- Filter controls use an accessible modal sheet with initial focus and Escape
  dismissal. Ticket tabs support arrow, Home, and End keyboard navigation.
- Mobile list and detail are separate route states. Entering a detail resets
  scroll to the top; returning restores the ticket landing rather than stacking
  list and detail.

## API and authorization

- `GET /tickets/:id` applies the existing manager, assigned-expert, and owning-
  requester access rules.
- Queue and page responses include `updated_at` and a role-safe
  `last_activity_at`. Requester results do not reveal the timing of internal
  notes.
- Comma-separated status filters support the user-facing active and completed
  groups without changing canonical ticket statuses.
- Activity entries include an actor display name while preserving requester
  visibility rules.

## Verification

| Check | Result |
| --- | --- |
| API health | `GET /api/v1/health` returned 200 |
| Release gate | `pnpm verify:release` passed |
| API tests | 16 files, 30 tests passed |
| Typecheck/lint | API and web passed |
| Production build | API and web passed |
| Administrator browser journey | queue, filter dialog, direct detail, all tabs, and internal-note control passed |
| Requester browser journey | restricted navigation, combined intake/history, direct detail, and absence of internal notes passed |
| Real request submission | created ticket #373, redirected to its conversation, and returned it as the first recent-history row |
| Responsive audit | 375, 768, 1024, and 1440 CSS-pixel widths passed without horizontal document overflow |
| 200% reflow proxy | 720 CSS-pixel viewport passed without horizontal document overflow |
| Mobile navigation state | list-only and detail-only routes passed; detail opened at scroll position 0 |

The redesign follows the local product architecture and uses guidance from the
UI/UX Pro Max reference for B2B hierarchy, progressive disclosure, touch target
sizing, visible focus, reduced motion, semantic status treatments, and
responsive testing. No lifecycle, tenant-isolation, secret, or provider
contract was changed.
