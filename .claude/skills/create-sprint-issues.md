---
name: create-sprint-issues
description: "Use when batch-creating GitHub issues for a sprint from Docs/github-issues.md"
---

## Description
Batch-create GitHub issues from the project's scrum documentation.

## Steps

1. Read `Docs/github-issues.md` to get the full issue definitions.

2. Ask the user which sprint or feature area to create issues for, unless specified in the arguments.

3. For each issue to create, check it doesn't already exist:
   ```bash
   gh issue list --search "TITLE" --state all
   ```

4. Create each new issue:
   ```bash
   gh issue create \
     --title "feat: <title> (#<issue-number>)" \
     --body "<acceptance criteria from docs>" \
     --label "<labels>" \
     --assignee "@me"
   ```

5. Use these standard labels (create if missing):
   - `frontend`, `backend`, `db`, `infra`, `docs`
   - `sprint` (or `sprint-1`, `sprint-2`, etc.)
   - `bug`, `enhancement`

6. Report all created issue numbers and URLs.

## Constraints
- Check for duplicates before creating — never create duplicate issues
- Acceptance criteria from `Docs/github-issues.md` should be copied verbatim into the issue body
- Branch naming reminder: `feature/<issue-number>-<kebab-desc>` — print this for each created issue
