# GitHub Issues for DebateMeBro

# PAT token: REMOVED_TOKEN_FOR_SECURITY

## Setup Checklist
1. Create GitHub Project (Board layout): **Backlog | Sprint Todo | In Progress | In Review | Done**
2. Create Milestones: **Sprint 1** (due: Week 9), **Sprint 2** (due: Week 10), **Sprint 3** (Stretch)
3. Create labels: `feature`, `chore`, `bug`, `docs`, `priority: high`, `priority: medium`, `priority: low`
4. Create all issues below, assign milestones and labels
5. Move Sprint 1 issues → "Done" column
6. Move Sprint 2 issues → "Sprint Todo" column
7. Move Sprint 3 issues → "Backlog" column

## Dependency Order (build in roughly this sequence)

### Sprint 1 — Scaffolding, Frontend, & Demo ✅ COMPLETE
```
#1 Scaffolding + Docker ──→ #2 DB Schema ──→ #3 Auth
                       └──→ #4 Evidence Loader ──→ #5 LangGraph State Machine ──→ #6 Agent Prompts
                                                                                       ↓
#8 Landing Page ──→ #9 Debate View + Streaming ←── #7 SSE Endpoint ←── #6
                                                       ↓
                                                  #10 AI Judging Panel
```

### Sprint 2 — Live API Debates + Persistence
```
✅ #16 Debate Persistence + Caching
✅ #17 Demo Mode Toggle + Live API Integration
✅ #23 Frontend Debate UX Overhaul (7 sub-issues)
✅ #18 Topic Input Bug Fix (topic persists via URL param + Zustand store)
✅ #19 Public Debate Browsing + Likes (browse page + like API + frontend all implemented)
✅ #14 Human Voting System (backend + frontend wired to API)
⚠️ #15 Dashboard (partial — needs vote display, polish)
❌ #20 API Usage Cap
✅ #29 Phase gating fixed (Continue button on all user phases including research)
✅ #30 Browse page likes functional (toggle like API + optimistic UI)
⚠️ #31 Judging metrics display (ScoreBar clamped, votes wired; 0/0 explanation pending)
❌ #34 Auto-generate keywords/tags for debate filtering and search
```

### Sprint 3 — Recommended Priority Order
```
HIGH PRIORITY (core quality):
  #25 Argument Quality — values/logic first, fallacy reduction (backend prompts)
  #26 Judge Scoring Transparency — per-criterion breakdown (backend + frontend)
  #27 Persona Reveal on Every Debate Load (frontend, quick fix)

MEDIUM PRIORITY (features):
  #36 Password Recovery — Forgot Password / Reset Flow (backend + frontend)
  #28 "How It Works" Explanation Page (frontend, standalone)
  #24 Persuasion / Argument Strength Judge (backend + frontend)
  #13 Position-Swapped Judging Bias Elimination (backend)

LOWER PRIORITY (custom topics pipeline):
  #11 Topic Analysis + Prompt Gen (partial) ──→ #12 Research Upload + Custom Flow (partial)
  #21 AI Resolution Curation & Improvement
  #22 AI-Powered Research (user provides API key or pays)

STRETCH (multimedia):
  #35 Voice & Video Debate Generation (TTS + AI avatars)
```

---

## Sprint 1 Issues — ✅ ALL COMPLETE

---

### Issue #1: Set up project scaffolding and Docker Compose
**Labels:** `chore`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Jason  
**Status:** ✅ Complete

#### Acceptance Criteria
- [x] FastAPI backend runs on `localhost:8000` with `/health` returning `{"status": "ok"}`
- [x] Next.js frontend runs on `localhost:3000` with a placeholder page
- [x] Docker Compose starts PostgreSQL 16, Redis, backend, and frontend with `docker compose up`
- [x] `.env.example` includes all required env vars (ANTHROPIC_API_KEY, DATABASE_URL, REDIS_URL, JWT_SECRET)
- [x] `.agent/rules/` and `.agent/workflows/` committed with all rule and workflow files
- [x] `.gitignore` excludes .env, __pycache__, node_modules, .next
- [x] Basic GitHub Actions CI runs linting on push
- [x] README includes setup instructions

---

### Issue #2: Database schema and Pydantic models
**Labels:** `chore`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Shuai  
**Status:** ✅ Complete

#### Acceptance Criteria
- [x] SQLAlchemy ORM models for: `users`, `debates`, `debate_turns`, `votes`, `judge_scores`
- [x] Pydantic models in `models/`: `DebateState`, `DebateTurn`, `DebateConfig`, `DebatePhase`, `TopicAnalysis`, `JudgeScore`
- [x] Alembic initialized with first migration creating all tables
- [x] `database.py` provides async session factory using asyncpg
- [x] Database connection verified in Docker Compose
- [x] At least 3 unit tests verifying Pydantic model validation (invalid status rejected, etc.)

---

### Issue #3: User authentication (register + login + JWT)
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Shuai  
**Status:** ✅ Complete

#### Acceptance Criteria
- [x] `POST /auth/register` creates user with hashed password (passlib bcrypt)
- [x] `POST /auth/login` returns JWT access token on valid credentials
- [x] `get_current_user` dependency validates JWT from Authorization header
- [x] Protected routes return 401 without valid token
- [x] Passwords never stored in plaintext
- [x] Integration tests for register, login, and protected route access

---

### Issue #4: Preset topics and evidence loader
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Jason  
**Status:** ✅ Complete

#### Acceptance Criteria
- [x] `GET /topics/presets` returns 3+ preset topics with titles, descriptions, Pro/Con positions
- [x] Pre-researched evidence files in `backend/evidence/` for all preset topics
- [x] `evidence.py` parses Markdown research files, extracts arguments, and builds citation index
- [x] Evidence loader returns ALL research (Pro + Con combined) as a single `EvidenceBundle`
- [x] Evidence format identical whether from pre-loaded files or future uploaded docs
- [x] Unit tests verify evidence loading, parsing, and citation extraction

---

### Issue #5: LangGraph debate state machine
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Jason  
**Status:** ✅ Complete

#### Acceptance Criteria
- [x] `DebateState` TypedDict tracks: debate_id, topic, status, current_phase, debate_turns, evidence_bundle, personas
- [x] Graph nodes for full 10-phase pipeline
- [x] Internal phases produce strategic analysis but do NOT stream to user by default
- [x] Phase transition events sent between phases
- [x] Unit tests verify state machine transitions with mocked agents

---

### Issue #6: Dynamic persona generation + debate agent prompts
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Jason  
**Status:** ✅ Complete

#### Acceptance Criteria
- [x] `persona_generator.py` generates tailored advocate persona via Claude Haiku
- [x] System prompt includes: dynamic persona, assigned position, commitment device, steelmanning requirement
- [x] All 6 phase-specific prompts implemented per `prompts-doc.md`
- [x] All prompts use minimums (not maximums) for length and sources
- [x] Evidence passed with citation markers so agents can reference specific sources

---

### Issue #7: SSE streaming endpoint for debate
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Shuai  
**Status:** ✅ Complete

#### Acceptance Criteria
- [x] `GET /api/debates/{id}/stream` returns SSE stream (content-type: text/event-stream)
- [x] Streamed phases: argument content sent token-by-token as SSE events
- [x] Internal phases: transition event sent (type: "phase_transition", message: "Agents evaluating...")
- [x] Internal phase strategic analysis available via separate endpoint (hidden by default, viewable on request)
- [x] Stream includes metadata: current phase, speaker (pro/con), phase type (streamed vs internal)
- [x] Stream ends with completion event
- [x] Frontend SSE handler connects and processes events

---

### Issue #8: Frontend — Landing page with preset topics
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Shuai  
**Status:** ✅ Complete

#### Acceptance Criteria
- [x] Displays app title, tagline, topic input field (dark theme, gradient title per mockup)
- [x] 3+ preset topic cards fetched from `GET /topics/presets`
- [x] Clicking a preset navigates to `/debates/[id]` and launches debate
- [x] "How it works" shows 7-phase flow
- [x] Styled with TailwindCSS matching mockup

---

### Issue #9: Frontend — Live debate view with streaming (demo mode)
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Shuai  
**Status:** ✅ Complete (demo mode)

#### Acceptance Criteria
- [x] Split-screen: Pro (left, blue) and Con (right, red) with dynamic persona names/roles
- [x] Arguments stream token-by-token with cursor animation
- [x] Phase nav bar shows all 7 phases — internal phases styled differently
- [x] Completed phases clickable to review earlier arguments
- [x] Internal phases show transition message + collapsible research modal
- [x] Citation badges show source title, click to expand with hyperlink URL for verification
- [x] Zustand store manages debate state

---

### Issue #10: AI judging panel (3 specialized judges)
**Labels:** `feature`, `priority: medium`  
**Milestone:** Sprint 1  
**Assignee:** Jason  
**Status:** ✅ Complete (backend only)

#### Acceptance Criteria
- [x] Three specialized judges: Logic (30%), Evidence (25%), Engagement (Refutation 25% + Steelmanning 20%)
- [x] Each judge has detailed system prompt with anti-bias instructions per `prompts-doc.md`
- [x] `judging/panel.py` orchestrator runs 3 judges concurrently via `asyncio.gather`
- [x] Weighted scores computed and overall winner determined
- [x] *(Sprint 2)* Judging results emitted via SSE and displayed in frontend as score bars

---

## Sprint 2 Issues — Live API Debates + Persistence

> **Goal:** Make the app run real debates using the Anthropic API, persist every debate, and add public browsing. After Sprint 2, a user can start a preset debate, watch it stream live, and every other user can replay it.

---

### Issue #16: Debate persistence and caching
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 2  
**Assignee:** Jason  
**Depends on:** #7  
**Status:** ✅ Complete (dev mode; Postgres migration deferred)

#### Description
Every completed debate is saved so it can be replayed without re-running AI calls. All debates are public and browseable. Uses file-based storage for development; migrates to PostgreSQL for production.

> **Rationale:** Each debate costs significant API tokens. We must preserve every completed debate and never re-generate one that already exists.

#### Acceptance Criteria
- [x] `debate/store.py` implements a debate store with: `save_debate()`, `load_debate()`, `list_debates()`, `debate_exists()`
- [x] Development mode: JSON file store at `backend/data/debates/{debate_id}.json`
- [x] `stream.py` checks for existing debate before invoking LLMs — if found, replays from cache via SSE
- [x] `stream.py` saves completed debate to store after all phases finish
- [x] `GET /api/debates/` lists all completed debates (public)
- [x] `GET /api/debates/{id}` returns full debate data (replay without streaming)
- [x] Frontend checks for completed debate data before connecting to SSE stream
- [x] Preset topic debates cached after first generation
- [x] Custom topic debates cached after completion
- [ ] Production mode: PostgreSQL using existing `Debate` + `Turn` models in `db/models.py`
- [x] Integration test: generate → verify saved → request same → verify replayed from cache

---

### Issue #17: Demo mode toggle + live API integration (NEW)
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 2  
**Assignee:** Jason  
**Depends on:** #16  
**Status:** ✅ Complete

#### Description
Currently the debate view defaults to demo/mock mode. We need a clear toggle so the app can run real API calls when ready, while keeping demo mode available for showcasing without burning tokens.

#### Acceptance Criteria
- [x] Environment variable `DEBATE_MODE=demo|live` controls whether debates run demo data or real LLM calls
- [x] When `DEBATE_MODE=live`, preset debates call the real LangGraph pipeline with Claude Sonnet
- [x] When `DEBATE_MODE=demo`, preset debates use the existing mock/demo stream (current behavior)
- [x] The stream endpoint accepts an optional `?mode=demo` query param to override per-request
- [x] Frontend shows a small indicator ("DEMO" badge or "LIVE" badge) so users know which mode they're in
- [x] If a debate is already cached (from a previous live run), it replays from cache regardless of mode
- [x] Configurable model names via `DEBATE_MODEL` and `PERSONA_MODEL` env vars
- [x] Anthropic prompt caching implemented to reduce ITPM on system prompts and evidence bundles

---

### Issue #18: Topic input persistence bug fix (NEW)
**Labels:** `bug`, `priority: high`  
**Milestone:** Sprint 2  
**Assignee:** Shuai  
**Depends on:** #8  
**Status:** ✅ Complete

#### Description
When a user types a custom topic in the input field on the landing page and clicks "Debate It →", the text doesn't persist through navigation. They arrive at the next page with an empty input and must retype their topic.

#### Acceptance Criteria
- [x] Custom topic text entered on landing page persists through navigation to `/debates/new`
- [x] Topic is passed via URL query param AND stored in Zustand store
- [x] The `/debates/new` page reads the topic from the query param and pre-fills the resolution field
- [x] Pressing Enter in the landing page input also preserves the text

---

### Issue #19: Public debate browsing + likes (NEW)
**Labels:** `feature`, `priority: medium`  
**Milestone:** Sprint 2  
**Assignee:** Shuai  
**Depends on:** #16  
**Status:** ✅ Complete

#### Description
All completed debates are publicly browseable. Users can "like" debates they find interesting, surfacing the best debates for the community.

#### Acceptance Criteria
- [x] Landing page or `/browse` shows all completed debates as cards (topic, resolution, winner, scores)
- [x] Cards sorted by most recent, with option to sort by most liked
- [x] Authenticated users can "like" a debate (one like per user per debate)
- [x] `POST /api/debates/{id}/like` — toggle like (auth required)
- [x] `GET /api/debates/` returns `like_count` in each debate summary
- [x] Like count displayed on debate cards and detail view
- [x] Unauthenticated users can browse but not like

---

### Issue #14: Human voting system
**Labels:** `feature`, `priority: medium`  
**Milestone:** Sprint 2  
**Assignee:** Shuai  
**Depends on:** #3, #10  
**Status:** ⚠️ Partial — backend + frontend voting works; dynamic weighting and combined winner not yet implemented

#### Description
Authenticated users vote on debate winners, displayed alongside AI judge scores with dynamic weighting.

#### Acceptance Criteria
- [x] `POST /votes` — authenticated users cast Pro or Con vote
- [x] One vote per user per debate
- [x] `GET /votes/{debate_id}` returns tallies
- [x] Vote buttons in judging results panel
- [ ] Dynamic weighting: AI-heavy (70/30) with few votes → human-heavy (40/60) at 20+ votes
- [ ] Combined winner displayed
- [ ] Integration tests (auth required, one vote per user)

---

### Issue #15: Dashboard + public debate browsing
**Labels:** `feature`, `priority: medium`  
**Milestone:** Sprint 2  
**Assignee:** Shuai  
**Depends on:** #3, #16  
**Status:** ⚠️ Partial — page exists, fetches real data, shows cards; missing vote display, quick actions polish, component tests

#### Description
Dashboard shows real debate data from the persistence store. All debates are public.

#### Acceptance Criteria
- [x] Dashboard page exists with auth gating at `/dashboard`
- [x] `GET /api/debates/` returns ALL public completed debates (no auth required)
- [x] Dashboard fetches real debate data from API
- [ ] Dashboard lists: topic, date, winner, scores, user's vote
- [ ] Click navigates to full debate replay view (no new API calls)
- [ ] Quick actions: link to preset debates, link to custom debate flow
- [ ] Component test for list rendering

---

### Issue #20: API usage cap per user (NEW)
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 2  
**Assignee:** Jason  
**Depends on:** #3, #16

#### Description
Protect API token spend by limiting how many new debates each user can generate. Replaying cached debates doesn't count toward the cap.

#### Acceptance Criteria
- [ ] Config setting `MAX_DEBATES_PER_USER` (default: 5)
- [ ] `stream.py` checks how many debates the current user has generated before starting a new one
- [ ] Replaying cached debates does NOT count toward the cap
- [ ] If cap reached, SSE stream returns an error event: `{"type": "error", "code": "RATE_LIMITED", "message": "..."}`
- [ ] Frontend shows the user their remaining debate quota (e.g. "3 of 5 debates used")
- [ ] Admins (configurable email list) are exempt from the cap

---

### Issue #23: Frontend debate UX overhaul (NEW)
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 2  
**Assignee:** Jason  
**Depends on:** #17  
**Status:** ✅ Complete (+ follow-up bugfix pass)

#### Description
After running the first live debates, several UX gaps became apparent: phases auto-advance too quickly, markdown doesn't render in arguments, internal phases are invisible, evidence bundle uses mock data, personas appear silently, and judging lacks transparency. This issue addresses all 7 gaps in one cohesive overhaul.

> **Follow-up bugfix pass (branch: `fix/debate-phase-gating-and-styling`):**
> After the initial #23 completion, additional issues were discovered during custom topic debates:
> - Phase gating in `content` SSE events (not just `phase_transition`) — debate still auto-advanced through rebuttal/closing
> - Manual PhaseNav clicks were overridden by incoming SSE events
> - Internal phase speaker detection broken — pro eval stuck on "computing strategy" (backend tags fix)
> - Judging panel showed mock/stale data while judges were deliberating (replaced with loading UI)
> - ScoreBar pro gradient direction was inverted, making bars not match actual scores
> - Markdown rendering in custom topic research prompt cards lacked typography hierarchy

#### Sub-issues

**23a. Pause between phases — Continue button in live mode**
- [x] Opening, rebuttal, and closing phases wait for user to click "Continue" before advancing
- [x] SSE events continue buffering in the background; only the displayed phase is gated
- [x] Internal phases (eval, research_consultation) auto-advance without user action
- [x] *(bugfix)* Content-stream phase gating: gate on `content` events too, not just `phase_transition`
- [x] *(bugfix)* Manual PhaseNav navigation preserved — SSE won't override user's tab click

**23b. Markdown rendering in argument cards**
- [x] Headings (`#`, `##`, `###`), lists (`-`), and horizontal rules (`---`) render as styled HTML
- [x] Existing citation badge and bold rendering preserved
- [x] StreamingText component updated

**23c. Evaluation phases — show agent thought process**
- [x] Backend streams internal phase LLM chunks as `internal_content` SSE events
- [x] Frontend stores internal analysis and displays in StrategicAnalysisPanel
- [x] Users can toggle-view the strategic analysis for eval_openings and eval_full_debate
- [x] *(bugfix)* Backend `call_agent` now passes `tags=[role]` so internal phase streaming events carry correct speaker identity
- [x] *(bugfix)* `stream.py` reads event tags to determine pro/con speaker instead of falling back to `get_speaker()` which always returned "system"

**23d. Evidence bundle based on actual research**
- [x] Backend sends real evidence data (pro_arguments, con_arguments, citations) in `evidence_loaded` SSE event
- [x] Frontend displays real evidence in research phase instead of hardcoded mock data
- [x] Falls back to mock data only in demo mode

**23e. Research consultation viewable via toggle**
- [x] Research consultation phase output viewable in the research phase UI
- [x] Toggle panel shows pro/con strategic analysis from the research consultation
- [x] Uses same `internal_content` SSE mechanism as evaluation phases

**23f. Persona reveal animation + "Start Debate" button**
- [x] Persona interface expanded to include expertise_areas, core_values, rhetorical_approach
- [x] Animated persona reveal UI shown after personas are generated
- [x] Full persona details displayed: name, identity, expertise, values, approach
- [x] "Start Debate →" button gates progression to the debate phases

**23g. Judging phase — transparency and per-judge breakdowns**
- [x] Backend synthesizes a summary from the 3 judges' individual reasoning
- [x] Frontend shows per-judge expandable cards with scores, reasoning, strongest/weakest moves
- [x] Uses backend `weighted_total` instead of re-computing on frontend
- [x] Score bars include per-judge contribution labels
- [x] Verdict explanation shows why the winner was chosen with supporting judge analysis
- [x] *(bugfix)* Removed MOCK_SCORES / MOCK_JUDGE_VERDICT fallback — shows "Judges Are Deliberating" loading UI until real results arrive
- [x] *(bugfix)* ScoreBar pro gradient direction fixed (`bg-gradient-to-l`) so bar length visually matches actual scores

---

## Sprint 3 Issues — AI-Powered Research + Custom Topics (Stretch)

> **Goal:** Allow users to debate any topic by having the AI generate research automatically, or by bringing their own research. Requires the user to provide their own API key or pay.

---

### Issue #11: Topic analysis and research prompt generator
**Labels:** `feature`, `priority: medium`  
**Milestone:** Sprint 3  
**Assignee:** Jason  
**Depends on:** #4  
**Status:** ⚠️ Partial — backend routes + frontend 3-step flow exist; missing edit-positions UX and unit tests

#### Description
For custom topics, Claude Haiku analyzes the resolution and generates argument dimensions. The system produces two research prompts that **users copy into Claude or ChatGPT** to run externally, then upload the results. Backend prompt logic already exists in `topics/analysis.py` and `topics/prompts.py`.

#### Acceptance Criteria
- [x] `topics/analysis.py` implements `TOPIC_ANALYSIS_PROMPT` per `prompts-doc.md §5`
- [x] `topics/prompts.py` implements `CUSTOM_RESEARCH_PROMPT_TEMPLATE` per `prompts-doc.md §4`
- [x] Research prompts require structured Markdown output with citation format
- [x] Accepts optional user-supplied argumentation lines
- [x] `POST /api/topics/analyze` route exists
- [x] Frontend `/debates/new` page exists with 3-step flow
- [x] Research prompt cards render markdown with proper typography hierarchy (`@tailwindcss/typography` prose classes)
- [ ] User can review/edit generated positions before proceeding
- [ ] Unit tests verify analysis returns valid structured output

---

### Issue #12: User research upload and custom topic flow
**Labels:** `feature`, `priority: medium`  
**Milestone:** Sprint 3  
**Assignee:** Shuai  
**Depends on:** #11  
**Status:** ⚠️ Partial — upload endpoint exists; EvidenceLoader integration + debate launch flow incomplete

#### Description
End-to-end custom topic flow: enter resolution → get research prompts → run externally → upload → debate.

#### Acceptance Criteria
- [x] `POST /api/research/upload` accepts Markdown files
- [ ] Uploaded Markdown parsed by `EvidenceLoader` — same `EvidenceBundle` format
- [ ] Citation index built from uploaded documents
- [ ] Both agents receive ALL uploaded research (shared pool)
- [ ] Debate launches after both research docs uploaded
- [ ] Completed custom debate saved to persistence store
- [ ] Integration test verifies upload → parse → debate flow

---

### Issue #13: Position-swapped bias elimination for judges
**Labels:** `feature`, `priority: medium`  
**Milestone:** Sprint 3  
**Assignee:** Jason  
**Depends on:** #10

#### Description
Extend the existing 3-judge panel with position-swapped bias elimination.

#### Acceptance Criteria
- [x] Three judges with specialized system prompts already exist (`judging/prompts/`)
- [ ] Each judgment runs twice: original order + reversed order (position swap)
- [ ] Consistent results counted; inconsistent flagged
- [ ] Scores from both orderings averaged for final result
- [ ] Frontend: per-judge breakdown with expandable reasoning, consistency indicator

---

### Issue #21: AI-assisted resolution curation and improvement (NEW)
**Labels:** `feature`, `priority: low`  
**Milestone:** Sprint 3  
**Assignee:** Jason  

#### Description
When a user enters a custom debate topic, the system should help them refine it. Suggest better-framed resolutions, highlight ambiguities, and offer additional context that would make the debate more productive.

#### Acceptance Criteria
- [ ] After user enters a resolution, AI suggests 2-3 improved versions with explanations
- [ ] Suggestions cover: clearer framing, more debatable phrasing, added specificity
- [ ] User can accept a suggestion, edit it, or keep their original
- [ ] AI can suggest additional context or background that would improve the debate
- [ ] Optional: suggest related but distinct debate angles the user might not have considered

---

### Issue #24: Persuasion / Argument Strength Judge (NEW)

**Labels:** `feature`, `priority: medium`
**Milestone:** Sprint 3
**Assignee:** Jason

#### Description

The current judging panel (Logic, Evidence, Engagement) evaluates **debating technique** — logical validity, source quality, refutation skill. None of the judges ask the fundamental question: **"Who actually made the more convincing case?"**

Add a fourth judge — the **Persuasion Judge** — that reads both sides' complete arguments with no prior context or bias on the topic, and determines which side was more convincing based purely on the substance of their arguments.

This judge differs from the existing three:
- **Logic Judge** → formal validity and soundness of reasoning
- **Evidence Judge** → source quality and citation practices
- **Engagement Judge** → refutation strength and steelmanning technique
- **Persuasion Judge (new)** → which side would convince a neutral, informed person

#### Acceptance Criteria

- [ ] New `persuasion_judge.py` prompt in `backend/app/judging/prompts/`
- [ ] Judge receives the full debate transcript with NO topic background or pre-existing bias
- [ ] Evaluates: strength of core thesis, persuasiveness of supporting arguments, how well each side addressed the other's points substantively (not technically)
- [ ] Outputs structured JSON matching existing judge format (pro_score, con_score, winner, reasoning, strongest/weakest moves)
- [ ] Position-swapped verification like existing judges (run twice with sides flipped, check consistency)
- [ ] Integrated into `run_judging_panel` with appropriate weight (suggested: 20-25%, reducing others proportionally)
- [ ] Frontend `JudgeCard` displays this judge alongside the existing three
- [ ] Weighted total recalculated with 4-judge weights
- [ ] Unit tests for the new judge prompt and scoring integration

---

### Issue #22: AI-powered autonomous research (NEW)
**Labels:** `feature`, `priority: low`  
**Milestone:** Sprint 3  
**Assignee:** Jason  

#### Description
Instead of requiring users to manually copy research prompts and run them in external tools, the system generates the research itself. This feature should only be available if the user provides their own API key or pays, since it significantly increases API costs.

#### Acceptance Criteria
- [ ] User can choose between: (a) manual research (copy prompts, upload results), or (b) AI-powered research
- [ ] AI-powered research is gated behind: user-provided API key OR payment/subscription
- [ ] If user provides their own Anthropic/OpenAI key, research calls use THEIR key (not ours)
- [ ] Research generation uses the same structured prompts from `topics/prompts.py`
- [ ] Generated research goes through the same `EvidenceLoader` pipeline
- [ ] Clear UX showing research generation progress and estimated API cost

---

### Issue #25: Argument Quality — Values & Logic First, Statistics Second

**Labels:** `enhancement`, `priority: high`, `backend`
**Milestone:** Sprint 3
**Assignee:** Jason

#### Description

The current debate agents over-rely on statistics, citations, and appeals to institutional authority at the expense of first-principles reasoning. A compelling argument should **lead with values and logic** — establishing *why* something matters from foundational principles — and then use real-world data to **support** those logical claims with evidence. Currently the agents do the opposite: they lead with statistics and name-drop institutions without establishing the underlying reasoning.

**Concrete example from the healthcare debate (Pro side):**

> "Healthcare satisfies every philosophical, legal, and religious criterion for recognition as a fundamental right. The UN Universal Declaration of Human Rights, the WHO Constitution, and the International Covenant on Economic, Social and Cultural Rights all recognize healthcare as a basic human right. The United States stands alone among industrialized nations in rejecting this moral consensus."

This is an **appeal to authority fallacy** — it claims healthcare is a right *because institutions say so*, rather than building a logical argument for *why* it should be a right from first principles (e.g., bodily autonomy, social contract theory, diminishing marginal utility of wealth vs. health). A skilled debater would first establish the moral/logical framework and then cite institutional recognition as corroborating evidence, not as the argument itself.

**Other observed fallacy patterns:**
- **Appeal to authority:** Citing organizations, declarations, or expert consensus as proof rather than as supporting evidence for an independently established argument
- **Appeal to popularity:** "Every other industrialized nation does X" — popularity does not establish correctness
- **Hasty generalization:** Drawing broad conclusions from narrow statistical examples without establishing causal mechanisms
- **Statistics without context:** Presenting numbers without explaining *why* they matter or *how* they connect to the logical argument

**What needs to change:**

1. **Agent system prompts** (`backend/app/debate/agents.py`) must instruct agents to structure arguments as: **(a) establish the value/principle → (b) build the logical chain → (c) support with evidence/statistics**
2. **Persona prompts** (`backend/app/debate/persona_generator.py`) should emphasize that each persona's `rhetorical_approach` prioritizes logical reasoning and values-based argumentation
3. **Debate phase prompts** (opening, rebuttal, closing) should explicitly instruct: "Do NOT lead with statistics or institutional citations. Lead with your core value proposition and logical reasoning. Use data to support your argument, not to substitute for one."
4. **Fallacy awareness:** Add explicit instructions to agent prompts to avoid common logical fallacies (appeal to authority, appeal to popularity, hasty generalization, false dichotomy, strawman). Agents should be aware that judges will penalize fallacious reasoning.
5. **Judge prompts** (especially the Logic Judge) should be updated to actively identify and penalize logical fallacies, with specific deductions for appeals to authority, circular reasoning, etc.

#### Acceptance Criteria

- [ ] Updated agent system prompts in `backend/app/debate/agents.py` to prioritize values-first, logic-first argument structure
- [ ] Updated persona generation prompts to emphasize logical reasoning in `rhetorical_approach`
- [ ] Updated debate phase prompts (opening, rebuttal, closing) with explicit instruction to lead with principles, follow with evidence
- [ ] Added fallacy-awareness instructions to all agent prompts (list of common fallacies to avoid)
- [ ] Updated Logic Judge prompt to actively identify and penalize logical fallacies with specific deductions
- [ ] Updated Evidence Judge prompt to distinguish between "evidence supporting a logical argument" vs "evidence substituting for an argument"
- [ ] Tested with healthcare preset: Pro side should argue *why* healthcare is a right from first principles, not just cite institutions
- [ ] Tested with healthcare preset: Con side should argue from principles of market efficiency, individual liberty, innovation incentives — not just cite cost statistics
- [ ] Arguments should follow clear structure: value claim → logical reasoning → supporting evidence
- [ ] No argument should rely solely on "X organization says so" or "Y country does it" without independent logical justification

---

### Issue #26: Judge Scoring Transparency — Detailed Methodology & Point Traceability

**Labels:** `enhancement`, `priority: high`, `frontend`, `backend`
**Milestone:** Sprint 3
**Assignee:** Jason

#### Description

The current judging system lacks transparency. When a judge awards "Pro: 4, Con: 2," there is no clear explanation of **how** those numbers were calculated, **what specific criteria** contributed to each point, or **why** one side scored higher. The scores feel arbitrary to the user.

**Current problems (see screenshot of Judge Analysis UI):**
- Each judge shows only a single aggregate score per side (e.g., "4 vs 2") with no breakdown
- The one-line description ("Evaluates logical validity, soundness of reasoning, and identification of fallacies") doesn't explain the scoring methodology
- When expanded, the "Winner Explanation" and "Strongest/Weakest Moves" are helpful but disconnected from the numerical scores
- There is no way to trace a specific point value back to a specific argument or criterion
- The Engagement Judge sometimes shows "0 vs 0" with no explanation of why

**What needs to change:**

1. **Backend judge prompts** must require judges to output a **per-criterion score breakdown**, not just a single aggregate. For example, the Logic Judge should score:
   - Logical validity (0-5)
   - Soundness of premises (0-5)
   - Fallacy avoidance (0-5)
   - Argumentative structure (0-5)
   - → Weighted aggregate = final score

2. **Each criterion score must include a one-sentence justification** explaining why that score was given, referencing specific moments in the debate.

3. **Frontend JudgeCard** must display:
   - The per-criterion breakdown with individual scores
   - The justification for each criterion score
   - How the criteria are weighted to produce the final aggregate
   - Clear visual indication of which criteria drove the winner determination

4. **Scoring methodology section** — either in-card or as an info tooltip — explaining how each judge works, what criteria they evaluate, the weight of each criterion, and the score scale.

#### Acceptance Criteria

- [ ] Each judge prompt outputs per-criterion scores (not just aggregate pro_score/con_score)
- [ ] Each criterion score includes a one-sentence justification referencing specific debate content
- [ ] Judge JSON output schema updated: `criteria: [{ name, pro_score, con_score, pro_justification, con_justification, weight }]`
- [ ] Frontend `JudgeCard` expanded view shows per-criterion breakdown with scores and justifications
- [ ] Each criterion row shows: criterion name, pro score, con score, and justification text
- [ ] Aggregate score shown as weighted sum of criteria with formula visible
- [ ] Scoring methodology tooltip or info section explains what each criterion means and how it's weighted
- [ ] No judge should produce 0/0 scores without an explicit explanation (if a criterion is N/A, explain why)
- [ ] All three existing judges (Logic, Evidence, Engagement) updated with per-criterion output
- [ ] Unit tests for new judge output schema validation

---

### Issue #27: Persona Reveal Animation on Every Debate Load

**Labels:** `bug`, `priority: medium`, `frontend`
**Milestone:** Sprint 3
**Assignee:** Jason

#### Description

The persona reveal overlay animation (the "Meet Your Debaters" modal with Start Debate button) should display **every time** a user opens a debate, regardless of whether it is a live debate, cached/replayed debate, or a preset topic like Healthcare. Currently, the persona reveal only appears in specific conditions (live mode, non-cached), which means users who open a cached debate or a preset topic never see the persona introduction.

The persona reveal is an important part of the user experience — it sets the stage, introduces the AI advocates, and gives the user context before diving into arguments. Skipping it makes the experience feel abrupt.

#### Acceptance Criteria

- [ ] Persona reveal overlay appears on **every** debate load where personas are available (live, cached, demo)
- [ ] For cached debates: personas load instantly from cache, overlay appears immediately with "Start Debate →" button
- [ ] For live debates: overlay appears once personas SSE event arrives (existing behavior, already works)
- [ ] For demo mode: overlay appears with mock personas before mock debate starts
- [ ] After user clicks "Start Debate →", the debate content is shown starting from the research phase
- [ ] The `personaRevealed` gate should not be bypassed by `isFromCache` or `isDemoMode` conditions
- [ ] Overlay uses the existing `fadeIn` / `slideUp` animations from `globals.css`

---

### Issue #28: "How It Works" Explanation Page

**Labels:** `feature`, `priority: medium`, `frontend`
**Milestone:** Sprint 3
**Assignee:** Jason

#### Description

Create a dedicated, in-depth explanation page (accessible from the landing page and navigation) that functions as a "blog post" or "deep dive" explaining **exactly what DebateMeBro does, why it matters, and how it works at every stage**. The goal is to clearly communicate the value proposition so that a new visitor can understand why this is superior to typical human debates or other AI debate tools.

**The page should cover:**

1. **The Problem:** Why most online debates are unproductive — echo chambers, bad-faith arguments, no structured evaluation, no accountability for logical fallacies.

2. **The DebateMeBro Approach:** How structured AI debate solves these problems — both sides receive the same research, personas are generated to be genuine advocates (not strawmen), arguments follow a formal structure (opening → rebuttal → closing), and an independent AI judging panel evaluates based on explicit criteria.

3. **Stage-by-Stage Walkthrough:**
   - **Topic Analysis & Research:** How the system analyzes a debate topic, generates balanced research for both sides, and ensures both agents start with the same factual foundation.
   - **Persona Generation:** How AI personas are created with specific expertise, values, and rhetorical approaches — not generic "Pro Bot / Con Bot" but nuanced advocates.
   - **Structured Debate Phases:** Opening arguments → strategic evaluation → rebuttals → final evaluation → closing statements. Explain why each phase exists and what it accomplishes.
   - **Internal Strategy Phases:** How agents privately analyze each other's arguments between rounds, planning their responses — mimicking real debate preparation.
   - **AI Judging Panel:** How three (or four) independent judges evaluate the debate on different dimensions (logic, evidence, engagement, persuasion), each with transparent scoring criteria.
   - **Human Voting:** How user votes are combined with AI judge scores for a final determination.

4. **Why This Matters:** The educational value — users learn to recognize strong vs weak arguments, identify logical fallacies, understand how evidence should support reasoning, and see both sides of complex issues presented at their best.

5. **Technical Differentiators:** What makes this different from ChatGPT debates, Reddit arguments, or other AI tools — the structured pipeline, position-swapped judge verification, evidence-grounded arguments, transparent scoring.

#### Acceptance Criteria

- [ ] New page at `/how-it-works` (or `/about`) accessible from landing page navigation
- [ ] Page uses the same dark theme and styling as the rest of the app
- [ ] Content covers all 5 sections described above with clear headings and visual hierarchy
- [ ] Includes diagrams or visual flow showing the debate pipeline stages
- [ ] Includes example screenshots or mockups of each phase (research, personas, arguments, judging)
- [ ] Mobile-responsive layout
- [ ] Link from landing page (prominent CTA or nav link)
- [ ] Content is written in engaging, accessible prose — not dry technical documentation
- [ ] SEO-friendly: proper meta tags, headings, and page title

---

### Issue #29: Phase Gating Incomplete — Continue Button Missing on Most Phases

**Labels:** `bug`, `priority: high`, `frontend`
**Milestone:** Sprint 3
**Assignee:** Jason
**Status:** ✅ Fixed

#### Description

The phase gating system (Continue button between phases) currently only gates correctly on evaluation phases. The research, opening statement, and rebuttal phases still auto-advance before the user has time to read them. Every phase transition should present a Continue button so the user controls the pacing of the debate.

#### Acceptance Criteria

- [x] Continue button appears after **every** phase completes (research, opening_pro, opening_con, rebuttal_pro, rebuttal_con, closing_pro, closing_con)
- [x] Internal phases (eval_openings, eval_full_debate, research_consultation) auto-advance without a Continue button
- [x] SSE content continues buffering in background while user reads current phase
- [x] Phase gating works consistently for both live and cached debate replay
- [x] No phase content is lost or skipped when the user clicks Continue

---

### Issue #30: Browse Debates Page — Likes Not Functional

**Labels:** `bug`, `priority: medium`, `frontend`, `backend`
**Milestone:** Sprint 3
**Assignee:** Shuai
**Status:** ✅ Fixed — was actually already implemented; verified during audit

#### Description

The `/browse` page exists and displays completed debate cards, but the like functionality does not work. Like buttons are present in the UI but clicking them has no effect — the backend `POST /api/debates/{id}/like` endpoint is not implemented, and the frontend click handler is not wired to any API call.

#### Acceptance Criteria

- [x] `POST /api/debates/{id}/like` endpoint implemented (auth required, toggles like)
- [x] `GET /api/debates/` returns `like_count` for each debate
- [x] Frontend like button calls the API and updates the count optimistically
- [x] Unauthenticated users see like counts but cannot click to like (button disabled or prompts login)
- [x] Like state persists across page refreshes
- [x] Duplicate likes by the same user are prevented (toggle behavior)

---

### Issue #31: Judging Metrics Display Issues

**Labels:** `bug`, `priority: medium`, `frontend`
**Milestone:** Sprint 3
**Assignee:** Jason
**Status:** ⚠️ Partially fixed — ScoreBar width clamped, vote buttons wired to API; 0/0 explanation still pending

#### Description

The judging results panel has several visual and data display issues that reduce the clarity and trustworthiness of the AI judging output. Score bars sometimes don't align with actual scores, per-judge breakdowns can show inconsistent data, and the overall presentation needs polish to match the quality of the rest of the debate UI.

#### Acceptance Criteria

- [x] Score bars accurately reflect weighted_total values for both pro and con
- [x] Per-judge expandable cards show consistent scores that sum to the displayed totals
- [ ] No 0/0 scores displayed without explanation
- [x] Winner banner correctly reflects the actual score comparison
- [x] Verdict summary text is coherent and references the actual judge reasoning
- [x] Loading state ("Judges Are Deliberating") works reliably until all judge data arrives
- [x] Score bar gradients, widths, and labels are visually correct on all screen sizes

---

### Issue #32: Spacebar doesn't work in custom topic input on landing page

**Labels:** `bug`, `priority: high`, `frontend`
**Milestone:** Sprint 3
**Assignee:** Jason
**Status:** ✅ Fixed

#### Description

On the landing page, typing a space in the "Enter any debate topic or statement" input field is silently eaten. The user cannot type multi-word topics. Clicking "Debate It" and editing on the next page works, but the initial input swallows spaces.

**Root cause:** The `onChange` handler calls `router.replace(buildHomeUrlWithTopic(next))` on every keystroke. `buildHomeUrlWithTopic` was trimming the value before setting it in the URL query param, then a `useEffect` synced the (trimmed) URL value back to local state — overwriting the trailing space before the next character could be typed.

**Fix:** (1) Stop trimming the value in `buildHomeUrlWithTopic` when syncing to URL, (2) add an `isTypingRef` guard so the URL→state `useEffect` skips while the user is actively typing.

#### Acceptance Criteria

- [x] Users can type spaces in the custom topic input on the landing page
- [x] Multi-word topics like "Should pineapple go on pizza?" work on first type
- [x] URL still syncs the topic for bookmarkability
- [x] Existing tests still pass

---

### Issue #33: Debates not persisting on Render — browse page empty, presets re-run every time

**Labels:** `bug`, `priority: high`, `backend`, `infrastructure`
**Milestone:** Sprint 3
**Assignee:** Jason
**Status:** ✅ Complete
**Branch:** `feature/db-debate-persistence`

#### Description

On the deployed Render backend, completed debates are not appearing on the Browse All page, and preset debates (e.g., healthcare) re-run from scratch every time — consuming API tokens on each view.

**Root cause:** The debate cache uses JSON files stored at `backend/data/debates/`. Render's free tier has an **ephemeral filesystem** — all files not in the Git repo are wiped on every deploy, restart, or spin-down. Since cached debate JSON files are generated at runtime and not committed to the repo, they are lost.

**Solution implemented:** Migrated debate persistence from JSON files to PostgreSQL using the existing Render-provisioned database.

**Changes made:**
1. Added `CachedDebate` and `DebateLike` SQLAlchemy models to `db/models.py` — stores full debate JSON in a JSONB column
2. Rewrote `store.py` — all functions (`save_debate`, `load_debate`, `list_debates`, `debate_exists`, `get_likes`, `get_like_count`, `like_debate`, `delete_debate`) are now async and use PostgreSQL via SQLAlchemy
3. Added graceful fallback: all store functions catch DB connection errors and return safe defaults (empty list, None, 0) so the app doesn't crash when PostgreSQL is unreachable locally
4. Updated `stream.py` and `routes/debates.py` callers to `await` the now-async store functions
5. Added debate seeding in `main.py` lifespan: on startup, seeds the DB from any local `backend/data/debates/*.json` files (one-time migration of existing cached debates)
6. Updated all test files to use in-memory mock DB store fixtures instead of temp file directories, patching at all import sites (store, stream, routes modules)

#### Acceptance Criteria

- [x] Completed debates persist across Render restarts/deploys
- [x] Browse page shows all previously completed debates
- [x] Preset debates (healthcare, remote work, AI copyright) load from cache without re-running
- [x] Custom debates are also cached and browseable
- [x] Like counts persist alongside debate data
- [x] All 105 tests pass (57 store/integration tests + 48 others; 4 pre-existing DB-connection-required tests excluded)
- [x] Graceful degradation when DB is unreachable (local dev without PostgreSQL still works)

---

### Issue #34: Auto-generate keywords/tags for debates to enable filtering and search

**Labels:** `feature`, `priority: medium`, `backend`, `frontend`
**Milestone:** Sprint 3
**Assignee:** Jason
**Depends on:** #33

#### Description

As the number of completed debates grows into the hundreds, users need a way to filter and discover debates by topic area. Currently, the browse page shows a flat chronological list with no categorization — users must scroll through everything or rely on the topic title alone.

The system should automatically generate a set of descriptive keywords/tags for each debate when it is saved, based on the topic, resolution, and argument content. These keywords enable filtering on the browse page (e.g., "healthcare", "economics", "ethics", "technology", "education") so users can quickly find debates in areas they care about.

#### Keyword Generation

- When a debate is saved (in `store.py` or as a post-save hook), use Claude Haiku to generate 3–6 descriptive keyword tags from the debate's topic, resolution, and optionally the first few turns
- Keywords should be short, lowercase, single-word or hyphenated terms (e.g., `healthcare`, `ai-ethics`, `economics`, `free-speech`, `climate`, `education`)
- Use a controlled vocabulary approach: maintain a canonical list of known tags and prefer existing tags over inventing new ones, to avoid fragmentation (e.g., don't create both "health" and "healthcare")
- Store keywords in the `CachedDebate` model (e.g., a new `keywords` column as a PostgreSQL ARRAY or JSON list)
- Backfill keywords for all existing cached debates (migration script or one-time seeding pass)

#### Frontend Filtering

- Browse page displays keyword tags as clickable filter chips above the debate list
- Clicking a tag filters the list to only debates with that keyword
- Multiple tags can be selected (AND or OR logic — start with OR for broader results)
- Each debate card shows its keyword tags as small badges
- Optional: search bar that filters by keyword match in addition to topic text

#### API Changes

- `GET /api/debates/` should accept an optional `?tags=healthcare,economics` query param to filter server-side
- `GET /api/debates/tags` returns the list of all known tags with debate counts (for the filter chip UI)
- Each debate summary in the list response includes a `keywords` field

#### Acceptance Criteria

- [ ] New `keywords` column added to `CachedDebate` model
- [ ] Keywords auto-generated via Claude Haiku when a debate is saved
- [ ] 3–6 descriptive tags per debate, drawn from a controlled vocabulary when possible
- [ ] `GET /api/debates/` supports `?tags=` query param for server-side filtering
- [ ] `GET /api/debates/tags` returns all known tags with counts
- [ ] Browse page shows keyword filter chips
- [ ] Clicking a chip filters the debate list
- [ ] Each debate card displays its keyword tags
- [ ] Existing debates backfilled with keywords
- [ ] Unit tests for keyword generation and filtering logic

---

### Issue #35: Voice & Video Debate Generation — Dynamic Audio/Video Output

**Labels:** `feature`, `priority: low`, `backend`, `frontend`, `stretch`
**Milestone:** Sprint 3 (Stretch)
**Assignee:** Jason
**Depends on:** #16, #33

#### Description

Currently, debates are presented as text streams in a split-screen layout. While effective for reading, the experience could be dramatically more engaging if users could **listen to** or **watch** the debate as if it were a real spoken exchange between two advocates. This feature adds AI-generated voice (and optionally video) output to accompany the text debate, turning DebateMeBro into a multimedia debate platform.

**Why this matters:**
- Voice brings personality and emotion that text alone cannot convey — tone, emphasis, pacing, and rhetorical delivery become part of the experience
- Video avatars make the AI personas feel tangible — users see the debaters they were introduced to in the persona reveal
- Audio/video debates are shareable, embeddable, and more accessible to users who prefer listening over reading
- This differentiates DebateMeBro from every other AI debate tool, which are all text-only

#### Phase 1: Voice Generation (TTS)

Generate spoken audio for each debate turn using a text-to-speech API, with distinct voices for the Pro and Con personas.

**Technical approach:**
- Use a TTS provider with high-quality, expressive voices (e.g., ElevenLabs, OpenAI TTS, Google Cloud TTS, or Amazon Polly Neural)
- Assign a distinct voice to each persona — voice selection could be influenced by the persona's identity (e.g., gender, age, tone described in the persona profile)
- Generate audio per-turn (not the entire debate at once) to support progressive playback and streaming
- Store generated audio clips alongside the debate in object storage (S3, Cloudflare R2, or similar) — audio files are too large for PostgreSQL
- Audio generation can be async/post-hoc: generate after the text debate completes, not during live streaming (to avoid blocking the debate flow)

**Playback UX:**
- "Listen" button on each debate card and in the debate view header
- Audio player synced with the text: as audio plays, the corresponding text turn is highlighted/scrolled to
- Play/pause, skip forward/back by turn, playback speed controls (1x, 1.25x, 1.5x, 2x)
- Auto-advance through turns: when one turn's audio finishes, the next starts after a brief pause
- Visual indicator showing which turn is currently being spoken

#### Phase 2: Video Avatars (Stretch)

Generate animated video avatars that lip-sync to the audio, creating a visual debate experience.

**Technical approach:**
- Use an AI avatar/video generation service (e.g., HeyGen, D-ID, Synthesia, or Hedra) to generate talking-head videos from the audio clips
- Avatar appearance could be derived from the persona description (expertise area, identity traits)
- Generate one video per turn, or composite a split-screen video of the full debate
- Video stored in object storage with adaptive streaming (HLS or DASH) for smooth playback
- This is significantly more expensive and slower to generate than audio alone — consider making it opt-in or premium-only

**Video UX:**
- "Watch" button alongside the "Listen" button
- Split-screen video view: Pro avatar on the left, Con avatar on the right (matching the text layout)
- Active speaker's video is highlighted/enlarged; inactive speaker shows a static or listening pose
- Full-screen mode for video debates
- Fallback to audio-only if video generation fails or is unavailable

#### API & Infrastructure

- `POST /api/debates/{id}/generate-audio` — triggers async audio generation for a completed debate (returns a job ID)
- `GET /api/debates/{id}/audio-status` — check generation progress (per-turn status)
- `GET /api/debates/{id}/audio/{turn_index}` — returns audio file URL for a specific turn
- `POST /api/debates/{id}/generate-video` — triggers async video generation (stretch)
- Audio/video files stored in external object storage (not the database)
- Background worker (Celery, ARQ, or similar) for async generation jobs — TTS and especially video generation are too slow for request/response
- Cost tracking: voice and video generation have per-character/per-minute costs that must be tracked and potentially gated (tie into #20 usage caps)

#### Voice/Persona Mapping

- Each generated persona should have a consistent voice ID assigned when the persona is created
- Voice selection criteria: match the persona's described characteristics (formal vs. casual, authoritative vs. empathetic)
- The same persona should always use the same voice across replays and re-generations
- Store voice ID in the debate data alongside persona metadata

#### Cost Considerations

- **TTS costs:** ElevenLabs ~$0.30/1K chars, OpenAI TTS ~$0.015/1K chars — a full debate (~10K chars) costs $0.15–$3.00 per debate in audio
- **Video costs:** HeyGen/D-ID ~$0.10–$0.50 per minute of video — a 10-minute debate video costs $1–$5
- Audio generation should be opt-in (user clicks "Generate Audio") rather than automatic
- Video generation should be gated behind user-provided API keys or a premium tier
- Cache aggressively: once audio/video is generated for a debate, never regenerate

#### Phase 3: YouTube Distribution Pipeline

Automatically publish generated debate videos to YouTube, driving traffic back to the DebateMeBro website and offsetting generation costs through ad revenue.

**Automated upload pipeline:**
- After video generation completes, optionally auto-publish to a configured YouTube channel via the YouTube Data API v3
- Auto-generate title: "AI Debate: [Topic] — Who Wins?" (SEO-optimized, clickable)
- Auto-generate description including:
  - Debate summary (topic, resolution, winner, key arguments)
  - Link back to the full interactive debate on DebateMeBro website (e.g., `https://debatemebro.com/debates/{id}`)
  - CTA: "Watch the full debate with transparent AI judging scores at [website URL]"
  - Timestamps for each phase (opening, rebuttal, closing, judging)
  - Tags/keywords from Issue #34 for YouTube SEO
- Auto-generate thumbnail: split-screen with Pro/Con persona names, topic text overlay, winner badge
- Set YouTube tags from the debate's auto-generated keywords (#34)
- Schedule uploads for optimal posting times (configurable)

**Website cross-promotion:**
- YouTube video description always links to the interactive web version where users can:
  - Read the full text with citations and evidence
  - See transparent per-judge scoring breakdowns
  - Vote on who they think won
  - Like and share the debate
  - Start their own debate on a related topic
- End-screen card on YouTube video: "Disagree with the judges? Vote now at debatemebro.com"
- Pinned comment with website link and invitation to debate the same topic

**YouTube Shorts pipeline:**
- Auto-extract the strongest 60-second argument from each side as YouTube Shorts
- Shorts title: "AI argues [position] in 60 seconds #debate #[topic]"
- Shorts description links to the full debate video and website
- Shorts drive discovery → full video views → website visits

**Revenue & cost offset:**
- YouTube ad CPM on educational/intellectual content: ~$5–$12 per 1K views
- Break-even per video: ~1,000–2,000 views at $5 CPM for a $5–$10 generation cost
- Batch generation: 20–50 debates/month on trending and evergreen topics
- Revenue reinvested into API costs, enabling more debates and higher-quality TTS/video

**Compliance:**
- All videos labeled as AI-generated per YouTube's disclosure requirements
- Debate methodology explained in channel About page
- No misleading claims — clearly framed as AI-generated structured debate, not human discourse

#### Acceptance Criteria

**Phase 1 — Voice (MVP):**
- [ ] TTS provider integrated (ElevenLabs or OpenAI TTS recommended)
- [ ] Distinct voices assigned to Pro and Con personas
- [ ] Audio generated per-turn for completed debates
- [ ] Audio files stored in object storage (not DB)
- [ ] "Listen" button on debate view triggers audio playback
- [ ] Audio playback synced with text — current turn highlighted as it plays
- [ ] Play/pause, skip turn, and playback speed controls
- [ ] Audio generation is async (background job, not blocking)
- [ ] Generated audio cached — never regenerated for the same debate
- [ ] Cost tracking for audio generation

**Phase 2 — Video (Stretch):**
- [ ] AI avatar service integrated (HeyGen, D-ID, or similar)
- [ ] Talking-head video generated per-turn with lip-sync to audio
- [ ] Split-screen video player in debate view
- [ ] Active speaker visually emphasized
- [ ] Video generation gated behind premium/user API key
- [ ] Full-screen video mode
- [ ] Fallback to audio-only if video unavailable

**Phase 3 — YouTube Distribution:**
- [ ] YouTube Data API v3 integrated for automated uploads
- [ ] Auto-generated SEO titles, descriptions with website links, and tags from #34 keywords
- [ ] Video description includes link back to interactive debate on DebateMeBro website
- [ ] Auto-generated thumbnails (split-screen Pro/Con with topic overlay)
- [ ] YouTube Shorts auto-extracted from strongest 60-second arguments
- [ ] Shorts description links to full video and website
- [ ] End-screen cards and pinned comments driving traffic to website
- [ ] Configurable upload scheduling
- [ ] AI-generated content disclosure per YouTube ToS
- [ ] Revenue tracking dashboard (views, CPM, cost offset per debate)

---

### Issue #36: Password Recovery — Forgot Password / Reset Flow

**Labels:** `feature`, `priority: high`, `backend`, `frontend`
**Milestone:** Sprint 3
**Assignee:** Jason
**Depends on:** #3

#### Description

The current auth system (Issue #3) supports registration and login but has no way for users to recover their account if they forget their password. This is a critical gap — any production-facing app with password-based auth needs a password reset flow. Without it, users who forget their credentials are permanently locked out.

#### Backend: Password Reset API

**Token-based reset flow (industry standard):**

1. **`POST /api/auth/forgot-password`** — accepts `{ email }`, generates a time-limited reset token
   - Look up user by email; if not found, still return 200 (prevent email enumeration)
   - Generate a cryptographically secure token (e.g., `secrets.token_urlsafe(32)`)
   - Store the token hash + expiration (e.g., 1 hour) in a new `password_reset_tokens` table or a column on the `users` table
   - Send a reset email with a link: `https://debatemebro.com/reset-password?token=<token>`
   - Rate-limit: max 3 reset requests per email per hour

2. **`POST /api/auth/reset-password`** — accepts `{ token, new_password }`
   - Validate the token: exists, not expired, not already used
   - Hash the new password with passlib bcrypt (same as registration)
   - Update the user's password in the DB
   - Invalidate the token (single-use)
   - Optionally invalidate all existing JWT sessions for that user (force re-login)

**Email delivery:**
- Use a transactional email provider (SendGrid, Resend, AWS SES, or Mailgun)
- Email contains: reset link, expiration warning ("This link expires in 1 hour"), and a note that if they didn't request the reset, they can ignore it
- Environment variable: `SMTP_URL` or provider-specific API key (e.g., `SENDGRID_API_KEY`)
- For local dev: log the reset link to console instead of sending an email

**Database changes:**
- New `password_reset_tokens` table: `id`, `user_id`, `token_hash`, `expires_at`, `used_at`, `created_at`
- Or alternatively: `reset_token_hash` and `reset_token_expires` columns on the existing `users` table (simpler but less flexible)

#### Frontend: Reset Password Pages

**Forgot password page (`/forgot-password`):**
- Email input field + "Send Reset Link" button
- On success: "If an account with that email exists, we've sent a reset link. Check your inbox."
- Same dark theme styling as login/register pages

**Reset password page (`/reset-password?token=...`):**
- New password + confirm password fields
- Password strength requirements displayed (min 8 chars, etc.)
- On success: "Password reset! You can now log in." with link to login page
- On invalid/expired token: "This reset link is invalid or has expired. Request a new one." with link to forgot-password page

**Login page integration:**
- Add "Forgot password?" link below the login form, linking to `/forgot-password`

#### Security Considerations

- **Never reveal whether an email exists** in the forgot-password response (prevents email enumeration attacks)
- **Hash the reset token** before storing in DB (same principle as passwords — if DB is compromised, tokens are useless)
- **Single-use tokens** — mark as used immediately after successful reset
- **Short expiration** — 1 hour max; 15–30 minutes preferred
- **Rate limiting** — prevent brute-force token guessing and spam email sending
- **HTTPS only** — reset links must use HTTPS in production
- **Password validation** — enforce same strength requirements as registration

#### Acceptance Criteria

- [ ] `POST /api/auth/forgot-password` generates a reset token and sends email (or logs link in dev)
- [ ] `POST /api/auth/reset-password` validates token and updates password
- [ ] Reset tokens are hashed before storage, single-use, and expire after 1 hour
- [ ] Same 200 response whether email exists or not (no enumeration)
- [ ] Rate-limited: max 3 requests per email per hour
- [ ] `/forgot-password` page with email input and success message
- [ ] `/reset-password` page with new password fields and token validation
- [ ] "Forgot password?" link on login page
- [ ] Transactional email provider integrated (SendGrid/Resend/SES)
- [ ] Dev mode: reset link logged to console instead of emailed
- [ ] Password strength validation on reset (same rules as registration)
- [ ] Invalid/expired token shows clear error with link to retry
- [ ] Integration tests for full forgot → reset flow
- [ ] Security tests: expired token rejected, used token rejected, rate limiting enforced
