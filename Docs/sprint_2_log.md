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
