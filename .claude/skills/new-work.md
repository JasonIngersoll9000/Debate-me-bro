# new-work

Scaffold a new feature branch for DebateMeBro following the project's scrum workflow.

## When to use

When starting work on a GitHub issue. Creates a properly-named branch, prints a commit message template, and generates a PR body skeleton with acceptance criteria.

## Instructions

When this skill is invoked with arguments like `/new-work #15 "implement-voting-system"` or `/new-work #15`:

1. Parse the issue number and optional slug from the arguments.

2. Fetch the issue from GitHub:
   ```bash
   gh issue view <number> --json title,body,labels
   ```

3. Derive the branch name:
   - Format: `feature/<issue>-<kebab-slug>` (use the slug from args, or kebab-case the issue title)
   - Validate it matches the pattern in `.agent/rules/scrum-workflow.md`

4. Create and switch to the branch:
   ```bash
   git checkout -b feature/<issue>-<slug>
   git push -u origin feature/<issue>-<slug>
   ```

5. Print to the user:

   **Branch created:** `feature/<issue>-<slug>`

   **Commit template** (paste when committing):
   ```
   feat(backend): <short description> (#<issue>)
   ```
   Scope options: `frontend` | `backend` | `db` | `infra` | `docs`
   Type options: `feat` | `fix` | `chore` | `test` | `docs`

   **PR body skeleton:**
   ```
   ## Summary
   Closes #<issue>

   - <bullet from acceptance criteria 1>
   - <bullet from acceptance criteria 2>

   ## Test plan
   - [ ] Unit tests added for <module>
   - [ ] Integration test covers <endpoint/flow>
   - [ ] DEBATE_MODE=demo works without API keys

   🤖 Generated with [Claude Code](https://claude.ai/code)
   ```

6. If the current branch already has uncommitted changes, warn the user before creating the branch.
