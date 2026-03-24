---
name: warn-env-file-edit
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: (^|/)\.env$
---

**Warning: You are editing a `.env` file.**

`.env` files contain secrets (API keys, DB passwords). Make sure:

- [ ] `.env` is in `.gitignore` (check: `cat .gitignore | grep .env`)
- [ ] You are NOT adding real API keys — use `.env.example` for templates
- [ ] You are NOT about to commit this file (`git status` before staging)

**Project secrets:**
- `ANTHROPIC_API_KEY` — never commit real values
- `SECRET_KEY` — JWT signing key, keep private
- `DATABASE_URL` — contains DB credentials

If you meant to edit `.env.example` (safe to commit), use that file instead.
