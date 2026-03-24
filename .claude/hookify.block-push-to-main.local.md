---
name: block-push-to-main
enabled: true
event: bash
action: block
pattern: git push.*\bmain\b
---

**BLOCKED: Pushing directly to `main` is not allowed.**

`main` is frozen for grading. All work must go to `develop` or a feature branch.

**Instead:**
- Push to your current branch: `git push -u origin <branch>`
- Or push to develop: `git push origin develop`

If you truly need to push to main (grading is done), disable this rule in `.claude/hookify.block-push-to-main.local.md`.
