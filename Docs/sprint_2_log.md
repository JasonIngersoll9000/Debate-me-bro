# Sprint 2 Log & Retrospectives

## Sprint 2 Planning

**Goal:** Make the app run REAL debates using the Anthropic API, persist every result, and enable public browsing with likes and voting.
**Duration:** Weeks 9-10.

### Key Objectives (From PRD & Issues)

- Live API debates with real Claude calls
- Debate persistence and caching (zero re-generation cost on cache hit)
- Demo/live mode toggle
- Public debate browsing + likes
- Human voting system with dynamic weighting
- Dashboard with real data
- API usage cap per user

### Issues in Scope

| Issue | Title | Branch | Assignee |
| ----- | ----- | ------ | -------- |
| #16 | Debate Persistence & Caching | `feature/16-debate-persistence-caching` | Jason |
| #17 | Demo Mode Toggle + Live API | `feature/17-demo-mode-live-api` | Jason |
| #18 | Topic Input Persistence Bug | `bugfix/18-topic-input-persistence` | Shuai |
| #19 | Public Debate Browsing + Likes | `feature/19-public-browsing-likes` | Shuai |
| #14 | Human Voting System | `feature/14-human-voting` | Shuai |
| #15 | Dashboard (real data) | `feature/15-dashboard-real-data` | Shuai |
| #20 | API Usage Cap | `feature/20-api-usage-cap` | Jason |

### Dependency Order

```
#16 Debate Persistence (required before live API calls)
  ↓
#17 Demo Mode Toggle + Live API Integration
  ↓
#18 Topic Input Bug Fix
#19 Public Debate Browsing + Likes
#14 Human Voting System
#15 Dashboard (real data)
#20 API Usage Cap
```

---

### Issue #17: Demo Mode Toggle + Live API Integration

**Status:** ✅ Complete
**Branch:** `feature/17-demo-mode-live-api`

**What Went Well:**

- Clean separation of concerns: backend controls the mode via `DEBATE_MODE` env var, frontend queries the backend and adapts.
- Cache-first pattern from #16 dovetails perfectly — cached debates replay regardless of mode, so switching between demo/live doesn't break anything.
- The `?mode=` query param override gives fine-grained control per request without changing the global config.
- Configurable model names (`DEBATE_MODEL`, `PERSONA_MODEL`) make it easy to switch between Sonnet, Opus, Haiku.
- Anthropic prompt caching on system prompts + evidence bundles significantly reduces ITPM.

**Challenges & Insights:**

- **Signaling demo mode via SSE:** Rather than duplicating mock data on the backend, the stream endpoint returns a lightweight `{"type": "mode", "mode": "demo"}` event when demo mode is active and the debate isn't cached. The frontend receives this and switches to its built-in mock engine. This avoids maintaining two separate mock systems.
- **Mode fetch timing:** The frontend now fetches `GET /api/debates/mode` before deciding how to initialize the debate. This adds a small network round-trip but ensures the frontend always reflects the server's actual configuration.
- **Badge UX:** Always showing either "Demo" (amber) or "Live" (sky blue) in the header makes the current mode immediately obvious.
- **API key loading:** `pydantic-settings` needed explicit `.env` path (repo root) and `extra="ignore"` to avoid validation errors from unrelated env vars.
- **Rate limits:** Initial Anthropic tier had 30k ITPM — required a rate limit increase request. Prompt caching helps reduce repeated token counts.
- **Frontend demo lock-in:** Preset topic navigation was hardcoding `?demo=true` in the URL, forcing demo mode even when backend was set to live. Fixed by removing the URL parameter.

**Key Changes:**

- `backend/app/config.py` — Added `debate_mode`, `debate_model`, `persona_model` settings; explicit `.env` path; `extra="ignore"`
- `backend/app/routes/debates.py` — Added `GET /api/debates/mode` endpoint and `?mode=` query param on stream endpoint
- `backend/app/debate/stream.py` — Accepts `mode` param; demo mode signals frontend instead of calling LLMs; cache replay ignores mode
- `backend/app/debate/agents.py` — Uses `settings.debate_model`; prompt caching on system message + evidence bundle
- `backend/app/debate/persona_generator.py` — Uses `settings.persona_model`
- `backend/app/judging/panel.py` — Uses `settings.debate_model`; prompt caching on system prompt + transcript
- `frontend/src/lib/api.ts` — Added `fetchDebateMode()` function
- `frontend/src/app/debates/[id]/page.tsx` — Fetches mode on mount, handles `mode` SSE event, shows DEMO/LIVE badge
- `frontend/src/app/page.tsx` — Removed hardcoded `?demo=true` from preset navigation
- `.env` — Added `DEBATE_MODE`, `DEBATE_MODEL`, `PERSONA_MODEL`

**Action Items for Next Issues:**

- To run a real live debate, set `DEBATE_MODE=live` in `.env` and restart the backend.
- Issue #20 (API Usage Cap) will add rate limiting on top of live mode.
- Issue #23 (Frontend UX Overhaul) addresses all UX gaps discovered during first live debates.

---

## Issue Retrospectives

### Issue #16: Debate Persistence and Caching
**Status:** Completed
**Branch:** `feature/16-debate-persistence-caching`

**What Went Well:**
- Backend persistence layer (`store.py`) was already solid from Sprint 1 bonus work — save/load/list/exists all functional with JSON file store.
- Backend `stream.py` already had cache-check and replay logic working correctly.
- The replay SSE flow (evidence_loaded → personas → turns → judging → complete) was well-structured for consumption.

**Challenges & Insights:**
- **Frontend SSE handler was incomplete:** The `connectSSE()` function in the debate view only handled `phase_transition`, `content`, `complete`, and `error` events. It completely ignored `evidence_loaded`, `personas`, and `judging_results` events from the backend. This meant live mode couldn't display real topic metadata, persona names, or judging scores.
- **Judging UI was entirely hardcoded:** The judging results section used `MOCK_SCORES` and `MOCK_JUDGE_VERDICT` constants regardless of mode. Required adding `judgingResults` to the Zustand store and wiring dynamic score computation.
- **Frontend cache-first pattern:** Added `fetchDebate()` API call that checks `GET /api/debates/{id}` before opening an SSE connection. If the debate is already completed, it loads all data directly into the store without streaming — much faster UX for replays.

**Key Changes:**
- `frontend/src/lib/store.ts` — Added `JudgingResults`, `TopicMeta`, `isFromCache` to Zustand store
- `frontend/src/lib/api.ts` — Added `fetchDebate()` and `DebateData` interface
- `frontend/src/app/debates/[id]/page.tsx` — Wired all SSE event types, added `loadCachedDebate()` for direct cache loading, replaced hardcoded mock scores with dynamic `judgingResults` from store
- `backend/tests/integration/test_persistence.py` — 9 tests covering store round-trip, API endpoints, and SSE cache replay

**Action Items for Next Issues:**
- Issue #17 will add `DEBATE_MODE` env var to control whether debates run live Claude calls or demo mock data.
- The one remaining unchecked AC (PostgreSQL production mode) is deferred — file-based JSON store is sufficient for development.

---

### Issue #23: Frontend Debate UX Overhaul

**Status:** 🔄 In Progress
**Branch:** `feature/23-frontend-ux-overhaul`

**Context:** After running the first live debates with real Claude API calls, 7 UX gaps were identified:

1. Phases auto-advance without giving users time to read arguments
2. Markdown headings/lists render as raw text in argument cards
3. Evaluation phases are invisible — show "Computing strategy..." forever
4. Evidence bundle shows hardcoded mock data instead of real research
5. Research consultation output is hidden
6. Personas appear silently with no reveal or detail
7. Judging lacks transparency — no per-judge breakdown, summary can contradict scores

**Implementation Plan:**

| Step | Sub-issue | Scope |
|------|-----------|-------|
| 1 | 23c+23e | Backend: stream internal phase content (eval + research consultation) |
| 2 | 23d | Backend: send real evidence data in SSE |
| 3 | 23g | Backend: add judging summary synthesis |
| 4 | 23b | Frontend: markdown rendering in StreamingText |
| 5 | 23f | Frontend: persona reveal + expanded Persona type |
| 6 | 23a | Frontend: phase gate with Continue button in live mode |
| 7 | 23c+23e | Frontend: show internal phases (eval + research consultation) |
| 8 | 23d | Frontend: use real evidence data in research UI |
| 9 | 23g | Frontend: judging UI redesign with per-judge cards |

---
