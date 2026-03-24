---
name: require-tests-before-stop
enabled: true
event: stop
pattern: .*
---

**Before finishing this session, confirm you've done the following:**

- [ ] Backend tests pass: `cd backend && pytest -q`
- [ ] Frontend lint clean: `cd frontend && npm run lint`
- [ ] Changes committed with correct format: `<type>(<scope>): <desc> (#<issue>)`
- [ ] Pushed to remote: `git push`
- [ ] If feature complete: PR opened targeting `develop` (not `main`)

**Quick shortcut:** Run `/end-session` to do all of this automatically.

If you're stopping mid-task and haven't committed yet, at minimum run `git stash` so work isn't lost.
