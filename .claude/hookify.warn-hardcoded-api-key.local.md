---
name: warn-hardcoded-api-key
enabled: true
event: file
action: block
conditions:
  - field: new_text
    operator: regex_match
    pattern: sk-ant-[a-zA-Z0-9\-_]{20,}|ANTHROPIC_API_KEY\s*=\s*["\']?sk-
---

**BLOCKED: Anthropic API key detected in file content.**

You are about to write what looks like a real Anthropic API key into a file.

**This is a critical security issue:**
- Keys committed to git are exposed permanently (even if later deleted)
- GitHub scans for exposed keys and Anthropic will rotate them automatically
- Anyone with repo access can run up your API bill

**What to do instead:**
1. Store the key in your local `.env` file (never committed)
2. Reference it as `os.environ["ANTHROPIC_API_KEY"]` in code
3. Add a placeholder in `.env.example`: `ANTHROPIC_API_KEY=your-key-here`
