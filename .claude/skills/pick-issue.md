---
name: pick-issue
description: "Use when selecting a GitHub issue to work on end-to-end: branch creation, implementation, tests, and PR"
---

## Description
Pick up a GitHub issue and work it end-to-end: branch → implement → test → PR.

## Steps

1. Show open issues:
   ```bash
   gh issue list --assignee @me --state open
   ```
   If none assigned: `gh issue list --state open --limit 20`

2. Display the list. Ask which issue to work on (or use the number from the arguments).

3. Read the full issue:
   ```bash
   gh issue view <NUMBER>
   ```

4. Create a feature branch using `/new-work`:
   ```
   /new-work #<NUMBER> <short-slug>
   ```

5. Determine the scope of work:
   - **Backend only** → write failing tests first (`/gen-tests #<NUMBER>`), then implement
   - **Frontend only** → use `frontend-design:frontend-design` skill for UI work
   - **Full-stack** → backend first (API + tests), then frontend

6. Work through each acceptance criterion, checking them off as you go.

7. Before PR, run the full test suite:
   ```bash
   cd backend && pytest -q
   cd frontend && npm test -- --watchAll=false && npm run lint
   ```

8. Verify `DEBATE_MODE=demo` still works (no API keys required).

9. Create the PR:
   ```bash
   gh pr create \
     --title "feat(<scope>): <description> (#<NUMBER>)" \
     --body "Closes #<NUMBER>" \
     --base develop
   ```
   (Base branch is `develop`, NOT `main`)

10. Link the PR back to the issue.

## Constraints
- All PRs target `develop` — never `main` (main is frozen for grading)
- All acceptance criteria must be met before opening the PR
- Tests must pass before pushing
- One issue per session for focus
