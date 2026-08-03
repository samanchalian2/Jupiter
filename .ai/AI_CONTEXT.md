# AI Context Guide

## Purpose

This file defines how AI assistants must interact with this project's documentation system.

This file is project-independent.

It does not contain:

- Project information
- Business goals
- Technical details
- Current status
- Active tasks

Project-specific information exists in other documentation files.

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

1. AI_CONTEXT.md

2. CURRENT_STATE.md

3. NEXT_TASK.md

4. PROJECT.md

5. ARCHITECTURE.md

6. DESIGN_SYSTEM.md

7. DECISIONS.md

8. MASTER_PLAN.md

9. CHANGELOG.md

10. SESSION_LOG.md

11. PROMPTS.md

---

# File Responsibilities

## PROJECT.md

Contains:

- Project identity
- Goals
- Scope
- Business context


## ARCHITECTURE.md

Contains:

- Technical architecture
- Technology decisions
- System structure


## CURRENT_STATE.md

Contains:

- Current project condition
- Completed work
- Current phase


## NEXT_TASK.md

Contains:

- The single active task
- Immediate next action


## DESIGN_SYSTEM.md

Contains:

- Visual rules
- UI principles
- Design decisions


## DECISIONS.md

Contains:

- Important decisions
- Reasons behind decisions


## MASTER_PLAN.md

Contains:

- Long-term roadmap
- Project phases


## CHANGELOG.md

Contains:

- Important historical changes


## SESSION_LOG.md

Contains:

- Development session summaries


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