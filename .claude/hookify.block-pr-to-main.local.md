---
name: block-pr-to-main
enabled: true
event: bash
action: block
pattern: gh pr create.*--base\s+main
---

**BLOCKED: PRs targeting `main` are not allowed.**

`main` is frozen for grading. All PRs must target `develop`.

**Fix:** Add `--base develop` to your `gh pr create` command:
```
gh pr create --base develop --title "..." --body "..."
```

When grading is complete and you're ready to merge `develop` → `main`, disable this rule in `.claude/hookify.block-pr-to-main.local.md`.
