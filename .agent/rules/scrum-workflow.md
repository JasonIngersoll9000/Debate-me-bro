---
trigger: always_on
glob: "**/*"
description: Scrum workflow, branching, commits, PR rules for DebateMeBro.
---

## Scrum & Workflow Instructions

This file defines **how work should flow** from GitHub Issues → branches → commits → PRs → Project Board. Assistants must follow these conventions whenever they propose Git operations or structure work across multiple changes.

### 1. Source of Truth for Work Items

- **Issues Spec**
  - Path: `Docs/Github_Issues.md`.
  - Each issue has:
    - Title, labels, milestone (Sprint 1 or Sprint 2).
    - Owner (Jason / Shuai).
    - Detailed acceptance criteria.
  - Treat these issue descriptions as the **contract** for what "done" means.

- **Project Board**
  - Columns: **Backlog | Sprint Todo | In Progress | In Review | Done**.
  - Sprint 1: Issues #1–#10.
  - Sprint 2: Issues #11–#15.
  - When describing workflow in PRs or documentation, assume this board layout.

### 2. Branch Naming Convention

Branches should encode **type**, **issue number**, and a short, kebab-case description:

- Format:  
  `feature/<issue-number>-<short-description>`  
  `chore/<issue-number>-<short-description>`  
  `bugfix/<issue-number>-<short-description>`

- Examples:
  - `chore/1-scaffolding-and-docker-compose`
  - `feature/8-frontend-landing-page`
  - `feature/9-live-debate-streaming-view`
  - `feature/14-human-voting-system`

Guidelines for assistants:

- **One main issue per branch**:
  - Try to keep each branch focused on a single primary issue from `Docs/Github_Issues.md`.
- If a change touches multiple issues, choose the **dominant** one for the branch name and reference additional issues in the PR body.

### 3. Commit Message Format

Use a **conventional commit–style** format:

`<type>(<scope>): <short description> (#<issue-number>)`

- `type`:
  - `feat` – new user-facing feature.
  - `chore` – tooling, setup, refactors with no functional change.
  - `fix` – bug fix.
  - `docs` – documentation only.
  - `test` – tests only.
- `scope`:
  - Broad area: `frontend`, `backend`, `db`, `docs`, `infra`, etc.

Examples:

- `feat(frontend): implement landing page preset topics (#8)`
- `feat(backend): add /debates SSE streaming endpoint (#7)`
- `chore(infra): add docker-compose services for redis and postgres (#1)`
- `test(backend): add unit tests for debate state machine (#5)`

Notes for assistants:

- Always include the **issue number** in parentheses at the end (`(#8)`).
- Use **present tense**, imperative mood (“add”, “fix”, “implement”).
- Prefer **small, focused commits** tied to logical steps (e.g., models, routes, tests).

### 4. Pull Request Workflow

When describing or planning PRs, assume the following workflow:

1. **Start from `main`**:
   - Create a new branch using the naming convention above.
2. **Implement changes + tests**:
   - Keep the branch focused on the acceptance criteria of one primary issue.
   - Ensure unit / integration / component / e2e tests relevant to the issue are added or updated.
3. **Open a PR**:
   - Title format (include issue):
     - `feat: Frontend landing page with preset topics (#8)`
   - PR body should:
     - Reference the relevant issue(s) with `Closes #<issue>` / `Fixes #<issue>` when appropriate.
     - Summarize what changed and **why** (tie back to PRD section + issue acceptance criteria).
     - List tests added/updated and how to run them.
4. **Review & CI**:
   - PR should not be merged until:
     - CI (lint + tests) passes.
     - At least one review is collected (in a team setting).
5. **Merge Strategy**:
   - Prefer regular merge commits or squash merges.
   - Avoid force-pushing over `main`.

Assistants should **not** perform git operations themselves in this environment, but when they generate instructions, they must respect this workflow.

### 5. Referencing GitHub Issues in Code and Commits

- **Commits / PRs**
  - Always reference the primary issue:
    - Commit messages: `... (#8)`
    - PR description: `Closes #8` (or `Refs #8` if it is a partial step).

- **Code comments**
  - Avoid embedding issue numbers directly in code comments **except** for:
    - Temporary workarounds that are explicitly tracked by an issue.
    - TODOs that directly correspond to an issue.
  - When necessary, use:
    - `// TODO(#NN): <short description>` rather than vague TODOs.

### 6. Tying Work Back to PRD and Acceptance Criteria

For every significant change, assistants should:

1. Identify the relevant **user story** in `Docs/debatemebro-prd.md` (e.g., US-1, US-2, US-6).
2. Identify the corresponding **issue** in `Docs/Github_Issues.md` (e.g., #8, #9, #10).
3. Use the issue’s **Acceptance Criteria** as the checklist for:
   - What code paths to implement or update.
   - What tests to add.
4. In the PR description, explicitly mention which acceptance criteria are satisfied.

This ensures a clear chain from PRD → Issue → Branch → Commits → PR → Tests.
