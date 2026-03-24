---
name: quality-gate
description: "Use when auditing project quality across tests, types, linting, security, and CI/CD — produces read-only report"
---

## Description
Full quality audit across all dimensions. Read-only — reports gaps but does NOT fix them.

## Steps

1. **Backend tests:**
   ```bash
   cd backend && pytest --cov --cov-report=term-missing -q
   ```
   Report: total tests, pass rate, coverage %, files with zero coverage.

2. **Backend linting:**
   ```bash
   cd backend && pip show flake8 ruff 2>/dev/null && ruff check . || flake8 .
   ```
   Count errors vs warnings.

3. **Frontend tests:**
   ```bash
   cd frontend && npm test -- --coverage --watchAll=false
   ```
   Report: pass rate, coverage %.

4. **Frontend linting:**
   ```bash
   cd frontend && npm run lint
   ```
   Count errors vs warnings.

5. **Frontend type checking:**
   ```bash
   cd frontend && npx tsc --noEmit
   ```
   Count type errors. Flag any `any` casts.

6. **Security:**
   ```bash
   cd frontend && npm audit --audit-level=moderate
   ```
   Count vulnerabilities by severity.
   Check `.env.example` — verify no real secrets committed.

7. **CI/CD:** Read `.github/workflows/ci.yml`. Verify it runs: lint, tests, and build. Flag missing stages.

8. **DEBATE_MODE=demo smoke test:** Verify the app can run without API keys (demo mode must work).

9. Write report to `Docs/quality-gate-report.md`:
   - Date and `git rev-parse --short HEAD`
   - Score per dimension (pass / warning / fail)
   - Specific gaps with file paths
   - Prioritized action items

## Constraints
- READ-ONLY: do NOT fix anything. Only report.
- Be specific: "backend/tests/unit/test_store.py has 0 coverage for delete_debate" not "testing is incomplete"
- Run `/quality-fix` after reviewing the report to implement approved fixes
