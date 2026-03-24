---
name: start-session
description: "Use when starting a new Claude Code session to restore project context and verify build health before beginning work"
---

## Description
Run at the start of every Claude Code session to get oriented and verify nothing is broken.

## Steps

1. Confirm working directory and current branch:
   ```bash
   pwd && git branch --show-current
   ```

2. Review recent history:
   ```bash
   git log --oneline -15
   git status
   ```

3. Check open PRs and assigned issues:
   ```bash
   gh pr list --state open
   gh issue list --assignee @me --state open
   ```

4. Verify backend is healthy:
   ```bash
   cd backend && pytest -q --tb=no 2>&1 | tail -5
   ```

5. Verify frontend is healthy:
   ```bash
   cd frontend && npm run lint --silent 2>&1 | tail -5
   ```

6. If tests fail — **fix before starting new work**.

7. Summarize:
   - Current branch and what it's for
   - Last thing committed
   - Any open PRs needing attention
   - Suggested next action based on open issues

## Constraints
- Never skip the test check — broken tests mean broken baseline
- If on `main`, remind the user that main is frozen for grading and they should switch to `develop` or a feature branch
