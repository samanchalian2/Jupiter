# Jupiter Working Agreement

Before every Goal, read `.ai/AI_CONTEXT.md`, `.ai/CURRENT_STATE.md`,
`.ai/NEXT_TASK.md`, and documents relevant to the Goal. The repository, not
chat history, is the source of truth.

One execution implements one Goal only. Verify its prerequisites, keep changes
within scope, test them, update `.ai`, prepare the next Goal, and stop.

Do not change approved architecture, module boundaries, tenant isolation,
ticket lifecycle, API contracts, AI provider contract, or secret/file policy
without an ADR. Do not commit secrets or perform destructive/external actions
without explicit authorization.

The existing `AGENTS.md.txt` is a user-owned legacy draft; preserve it until
the owner explicitly approves its removal.
