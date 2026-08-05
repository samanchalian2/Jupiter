# Domain Model

`Organization` is the tenant boundary. `User` is global; `Membership` grants
a user organization-scoped roles and permissions. `Department`, `Location`,
`Discipline`, `Category`, and `Subcategory` form organization-scoped routing
metadata.

`Ticket` owns requester, lifecycle, classification, and priority. `Assignment`
and `StatusTransition` are immutable history. `TicketMessage`, `InternalNote`,
`Attachment`, `Activity`, and `Rating` attach to a ticket. `AIRequest`,
`AIResult`, and `AIFeedback` provide traceability. `Notification` is delivery
state; `KnowledgeCandidate` is reserved for future scope.

Ticket states are fixed semantic codes: `DRAFT`, `OPEN`, `IN_PROGRESS`,
`WAITING_FOR_REQUESTER`, `RESOLVED`, and `CLOSED`. Organizations may configure
display labels and closure policy, not arbitrary workflow transitions.
