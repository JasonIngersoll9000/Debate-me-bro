---
name: warn-no-verify
enabled: true
event: bash
action: block
pattern: git commit.*--no-verify
---

**BLOCKED: `--no-verify` skips pre-commit hooks.**

Bypassing hooks hides real problems. The CI pipeline will catch them anyway and fail.

**Instead:**
- Fix the underlying lint or test failure
- Run `cd backend && pytest -q` to see what's failing
- Run `cd frontend && npm run lint` to check frontend issues

If a hook is misconfigured (not a real failure), fix the hook config — don't skip it.
