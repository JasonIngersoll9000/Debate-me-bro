---
name: end-session
description: "Use when ending a Claude Code session to run tests, commit changes, and push to remote"
---

## Description
Run at the end of every session to save state cleanly.

## Steps

1. Run backend tests — fix failures before proceeding:
   ```bash
   cd backend && pytest -q
   ```

2. Run frontend lint — fix errors before proceeding:
   ```bash
   cd frontend && npm run lint
   ```

3. Check what's staged/unstaged:
   ```bash
   git status && git diff --stat
   ```

4. Stage and commit using the project's conventional commit format:
   - Format: `<type>(<scope>): <description> (#<issue>)`
   - Types: `feat` | `fix` | `chore` | `test` | `docs`
   - Scopes: `frontend` | `backend` | `db` | `infra` | `docs`
   - Use the `commit-commands:commit` skill for the actual commit

5. Push to remote:
   ```bash
   git push
   ```

6. Print a brief session summary:
   - What was completed
   - What's in progress / partially done
   - Any blockers or known issues
   - Suggested starting point for next session

## Constraints
- Never push with failing tests
- Never commit secrets or `.env` files
- If on a feature branch, remind the user to open a PR when the issue is complete
