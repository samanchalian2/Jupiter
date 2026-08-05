# AI Context Guide

## Purpose

This file defines how AI assistants must interact with this project's documentation system.

This file is the stable map for the Jupiter documentation system. Project facts
live in the files named below; current implementation facts live only in
`CURRENT_STATE.md`.

---

# Entry Point

This file is the first document an AI assistant must read when joining the project.

The purpose is to understand:

- How the project documentation works.
- Where information is stored.
- How to make changes safely.

---

# Documentation Structure

The `.ai` folder is the project knowledge system.

Each file has one responsibility.

Information must not be duplicated across files.

---

# Required Reading Order

Every AI session must follow this order:

1. `AGENTS.md`
2. `AI_CONTEXT.md`
3. `CURRENT_STATE.md`
4. `NEXT_TASK.md`
5. `PROJECT.md`
6. `ARCHITECTURE.md`, `AI_ARCHITECTURE.md`, `DOMAIN_MODEL.md`
7. `BUSINESS_RULES.md`, `USE_CASES.md`, `SECURITY.md`
8. `DECISIONS.md`, `MASTER_PLAN.md`, `EXECUTION_PLAN.md`
9. Other documents relevant to the Goal

---

# File Responsibilities

`PROJECT.md` owns scope and roles. `ARCHITECTURE.md` owns system boundaries.
`AI_ARCHITECTURE.md` owns AI integration. `DOMAIN_MODEL.md` owns aggregates.
`BUSINESS_RULES.md` owns testable policies. `USE_CASES.md` owns user flows.
`SECURITY.md` owns threat controls. `MASTER_PLAN.md` owns milestones;
`EXECUTION_PLAN.md` owns executable Goals. `CURRENT_STATE.md` owns facts now;
`NEXT_TASK.md` owns exactly one active Goal. `DECISIONS.md` owns ADRs.


# AI Operating Rules

AI assistants must:

- Understand before acting.
- Read relevant documentation first.
- Respect existing decisions.
- Modify only necessary files.
- Avoid unnecessary complexity.

AI assistants must not:

- Change architecture without approval.
- Add unnecessary technologies.
- Create undocumented files.
- Ignore project documentation.

---

# Development Workflow

Every development session:

1. Load project context.

2. Read the active task.

3. Explain understanding.

4. Implement the task.

5. Test the result.

6. Update documentation.

7. Commit changes.

---

# Continuity Rule

If previous conversation history is unavailable:

Use this documentation system as the source of truth.

Do not guess missing project information.

Reload understanding from the `.ai` folder.
