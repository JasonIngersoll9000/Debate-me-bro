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

**Status:** ✅ Complete
**Branch:** `feature/23-frontend-ux-overhaul`

**Context:** After running the first live debates with real Claude API calls, 7 UX gaps were identified and all 7 were resolved.

**What Went Well:**

- **Phase gating (23a):** Continue button pauses between phases in both live and demo mode. SSE events buffer in the background while the displayed phase is gated. Internal phases auto-advance without user action.
- **Markdown rendering (23b):** `StreamingText` component now renders headings, bold, lists, numbered lists, horizontal rules, and citation badges. `StrategicAnalysisPanel` also rewritten with full markdown parsing.
- **Evaluation phases (23c):** Backend streams `internal_content` SSE events with LLM chunks from eval phases. Frontend stores in `internalAnalysis` Zustand state and renders in standalone eval phase views.
- **Evidence bundle (23d):** Backend sends real evidence data in `evidence_loaded` SSE event. Frontend displays real evidence in research phase, falls back to mock data only in demo mode.
- **Research consultation (23e):** Research consultation phase output viewable in the research phase UI via toggle panels, using the same `internal_content` SSE mechanism.
- **Persona reveal (23f):** Persona interface expanded with `expertise_areas`, `core_values`, `rhetorical_approach`. Animated overlay with "Start Debate →" button gates progression. Header persona cards are now expandable dropdowns with full detail.
- **Judging transparency (23g):** Per-judge expandable `JudgeCard` components with scores, winner explanation, strongest/weakest moves, and full reasoning. Winner banner, score overview with weighted totals, verdict summary.

**Challenges & Insights:**

- **Eval content duplication:** Initial implementation embedded eval panels inline at the bottom of argument phases AND in the standalone eval phase view, causing content to appear twice. Fixed by keeping eval content only in the standalone eval phase view.
- **Cached debate replay:** `loadCachedDebate()` originally jumped straight to the judging phase. Changed to start at research phase so users can navigate through all phases via PhaseNav.
- **Persona card centering:** The `⚡` lightning bolt between persona cards was off-center due to CSS grid `auto` column sizing. Switched to flex layout with fixed-width divider for proper centering.

**Key Changes:**

- `frontend/src/lib/store.ts` — Added `Persona` (full details), `EvidenceBundle`, expanded `JudgingResults` with flexible judge records
- `frontend/src/app/debates/[id]/page.tsx` — Complete rewrite of persona cards (expandable), JudgeCard (richer detail), phase gating, SSE handler (all event types), `loadCachedDebate` (starts at research)
- `frontend/src/components/debate/StrategicAnalysisPanel.tsx` — Rewritten with full markdown parsing (headings, bold, lists, HRs)
- `frontend/src/components/debate/StreamingText.tsx` — Markdown rendering for headings, lists, HRs, bold, citations
- `frontend/src/app/globals.css` — Added `fadeIn` and `slideUp` keyframe animations
- `frontend/src/lib/mockDebateData.ts` — Added `weighted_total` to mock scores
- `backend/app/routes/topics.py` — Trimmed presets to healthcare only for focused demo

---

### Issue #23 Follow-up: Debate Phase Gating & Styling Bugfixes

**Status:** ✅ Complete
**Branch:** `fix/debate-phase-gating-and-styling`

**Context:** After running custom topic debates (not just preset Healthcare), 6 additional bugs were discovered in the #23 overhaul. All fixed in one branch.

**What Was Fixed:**

1. **Markdown typography in research prompts** — Installed `@tailwindcss/typography` plugin and upgraded prose classes on custom topic research prompt cards (`/debates/new`). Headers, lists, and text hierarchy now render properly.

2. **Phase auto-advance on content events** — The original gating only triggered on `phase_transition` SSE events. But content events for new phases (rebuttal, closing) arrived without a preceding transition, bypassing the gate. Added `lastContentPhase` tracking in the SSE `content` handler to detect phase changes and gate them with a Continue button.

3. **PhaseNav manual navigation override** — Added `userNavigatedRef` to track when the user manually clicks a phase tab. SSE content events no longer override the displayed phase when this flag is set. Cleared on `handleContinue()` and on non-gated phase transitions (judging, eval).

4. **Internal phase speaker detection** — Pro eval was stuck on "computing strategy" because `get_speaker()` returned `"system"` for all internal phases. Fixed by adding `config={"tags": [role]}` to `llm.ainvoke()` in `agents.py`, and reading `event.tags` in `stream.py` to determine the correct pro/con speaker for concurrent internal phase chunks.

5. **Judging loading UI** — Removed `MOCK_SCORES` and `MOCK_JUDGE_VERDICT` fallbacks. Added `judgingReady` flag. When judges haven't returned results yet, shows a "Judges Are Deliberating" loading state with spinner instead of stale/mock data.

6. **ScoreBar gradient direction** — Pro bar gradient was `bg-gradient-to-r` (bright end at the wrong side). Changed to `bg-gradient-to-l` so both bars have their bright end at the center tip, making visual bar length match actual scores.

**Key Changes:**

- `frontend/package.json` — Added `@tailwindcss/typography`
- `frontend/src/app/globals.css` — Added `@plugin "@tailwindcss/typography"`
- `frontend/src/app/debates/new/page.tsx` — Upgraded prose classes in research prompt cards
- `frontend/src/app/debates/[id]/page.tsx` — Content-stream phase gating, `userNavigatedRef`, `judgingReady` loading UI, ScoreBar gradient fix, removed mock score fallbacks
- `frontend/src/components/debate/PhaseNav.tsx` — Added `onManualNav` callback prop
- `backend/app/debate/agents.py` — Added `config={"tags": [role]}` to `ainvoke()`
- `backend/app/debate/stream.py` — Read event tags for internal phase speaker detection

---

## Sprint 2 — Current Status Summary

| Issue | Title | Status |
|-------|-------|--------|
| #16 | Debate Persistence & Caching | ✅ Complete |
| #17 | Demo Mode Toggle + Live API | ✅ Complete |
| #23 | Frontend UX Overhaul (7 sub-issues) | ✅ Complete (+ bugfix pass) |
| #15 | Dashboard (real data) | ⚠️ Partial — page + API + cards done; needs vote display, polish |
| #18 | Topic Input Bug Fix | ❌ Not started |
| #19 | Public Debate Browsing + Likes | ❌ Not started |
| #14 | Human Voting System | ❌ Not started |
| #20 | API Usage Cap | ❌ Not started |

**Completed:** 3 of 8 issues (including the massive 7-sub-issue #23 overhaul + follow-up bugfix pass)
**Remaining:** 5 issues — #15 needs polish, #18/#19/#14/#20 not started

---
