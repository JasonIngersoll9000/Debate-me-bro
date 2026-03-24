---
name: quality-fix
description: "Use after running /quality-gate and reviewing the report to implement approved fixes for identified gaps"
---

## Description
Implement fixes for gaps identified in the quality gate report.

## Prerequisites
- `Docs/quality-gate-report.md` must exist (run `/quality-gate` first)

## Steps

1. Read `Docs/quality-gate-report.md`.
   If the report is older than 7 days, suggest re-running `/quality-gate` first.

2. **STEP 1 — Config fixes** (no confirmation needed):
   - Fix linting configs, pytest.ini issues, tsconfig issues
   - Run the relevant tool immediately after each fix to verify
   - Commit: `fix(infra): quality gate config fixes`

3. **STEP 2 — Dependency fixes** (REQUIRES CONFIRMATION):
   - Run `npm audit fix` in `frontend/`
   - Show exactly what will change before touching anything
   - Wait for user approval
   - Commit: `fix(frontend): dependency security updates`

4. **STEP 3 — CI fixes** (REQUIRES CONFIRMATION):
   - Add missing stages to `.github/workflows/ci.yml`
   - Show the diff before applying
   - Wait for user approval
   - Commit: `ci: add missing pipeline stages`

5. Do NOT add test coverage here — test gaps go through `/gen-tests` + the TDD workflow.

6. Update `Docs/quality-gate-report.md` with what was fixed and what remains.

## Constraints
- Three gated steps — config first, then deps (confirm), then CI (confirm)
- Verify after EACH fix by running the relevant command immediately
- Never fix test gaps by writing tests — that's a `/gen-tests` task
