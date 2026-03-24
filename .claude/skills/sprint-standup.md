---
name: sprint-standup
description: "Use when generating a sprint standup report showing completed, in-progress, and blocked issues with sprint health metrics"
---

## Description
Generate a sprint standup summary — what's done, in progress, and blocked.

## Steps

1. Get current sprint issues:
   ```bash
   gh issue list --state open --label "sprint" 2>/dev/null || gh issue list --state open --milestone "Sprint 1" 2>/dev/null || gh issue list --state open
   gh issue list --state closed --limit 20
   ```

2. Check recent commits:
   ```bash
   git log --oneline --since="2 days ago"
   ```

3. Check open PRs:
   ```bash
   gh pr list --state open
   ```

4. Generate the standup report:

   ### Done (since last standup)
   - Closed issues with PR links
   - Merged PRs

   ### In Progress
   - Open issues with recent commit activity
   - Open PRs awaiting review

   ### Blocked
   - Open issues with no commits in 2+ days
   - PRs with requested changes not yet addressed

   ### Sprint Health
   - Issues closed vs total open
   - PRs merged vs open
   - Any CI failures on `develop`

## Constraints
- Concise — this is a standup, not a report
- Flag any issue or PR with no activity in 2+ days
- Remind: `main` is frozen for grading — all work should be on `develop` or feature branches
