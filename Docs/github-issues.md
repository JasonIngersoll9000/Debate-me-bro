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
#16 Debate Persistence + Caching (required before live API calls)
      ↓
#17 Demo Mode Toggle + Live API Integration
      ↓
#18 Topic Input Bug Fix
#19 Public Debate Browsing + Likes
#14 Human Voting System
#15 Dashboard (real data)
#20 API Usage Cap
```

### Sprint 3 — AI-Powered Research + Custom Topics (Stretch)
```
#11 Topic Analysis + Prompt Gen ──→ #12 Research Upload + Custom Flow
#13 Position-Swapped Judging
#21 AI Resolution Curation & Improvement
#22 AI-Powered Research (user provides API key or pays)
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
- [ ] *(Sprint 2)* Judging results emitted via SSE and displayed in frontend as score bars

---

## Sprint 2 Issues — Live API Debates + Persistence

> **Goal:** Make the app run real debates using the Anthropic API, persist every debate, and add public browsing. After Sprint 2, a user can start a preset debate, watch it stream live, and every other user can replay it.

---

### Issue #16: Debate persistence and caching
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 2  
**Assignee:** Jason  
**Depends on:** #7

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

#### Description
When a user types a custom topic in the input field on the landing page and clicks "Debate It →", the text doesn't persist through navigation. They arrive at the next page with an empty input and must retype their topic.

#### Acceptance Criteria
- [ ] Custom topic text entered on landing page persists through navigation to `/debates/new`
- [ ] Topic is passed via URL query param AND stored in Zustand store
- [ ] The `/debates/new` page reads the topic from the query param and pre-fills the resolution field
- [ ] Pressing Enter in the landing page input also preserves the text

---

### Issue #19: Public debate browsing + likes (NEW)
**Labels:** `feature`, `priority: medium`  
**Milestone:** Sprint 2  
**Assignee:** Shuai  
**Depends on:** #16

#### Description
All completed debates are publicly browseable. Users can "like" debates they find interesting, surfacing the best debates for the community.

#### Acceptance Criteria
- [ ] Landing page or `/browse` shows all completed debates as cards (topic, resolution, winner, scores)
- [ ] Cards sorted by most recent, with option to sort by most liked
- [ ] Authenticated users can "like" a debate (one like per user per debate)
- [ ] `POST /api/debates/{id}/like` — toggle like (auth required)
- [ ] `GET /api/debates/` returns `like_count` in each debate summary
- [ ] Like count displayed on debate cards and detail view
- [ ] Unauthenticated users can browse but not like

---

### Issue #14: Human voting system
**Labels:** `feature`, `priority: medium`  
**Milestone:** Sprint 2  
**Assignee:** Shuai  
**Depends on:** #3, #10

#### Description
Authenticated users vote on debate winners, displayed alongside AI judge scores with dynamic weighting.

#### Acceptance Criteria
- [ ] `POST /votes` — authenticated users cast Pro or Con vote
- [ ] One vote per user per debate
- [ ] `GET /votes/{debate_id}` returns tallies
- [ ] Vote buttons in judging results panel
- [ ] Dynamic weighting: AI-heavy (70/30) with few votes → human-heavy (40/60) at 20+ votes
- [ ] Combined winner displayed
- [ ] Integration tests (auth required, one vote per user)

---

### Issue #15: Dashboard + public debate browsing
**Labels:** `feature`, `priority: medium`  
**Milestone:** Sprint 2  
**Assignee:** Shuai  
**Depends on:** #3, #16

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

#### Description
After running the first live debates, several UX gaps became apparent: phases auto-advance too quickly, markdown doesn't render in arguments, internal phases are invisible, evidence bundle uses mock data, personas appear silently, and judging lacks transparency. This issue addresses all 7 gaps in one cohesive overhaul.

#### Sub-issues

**23a. Pause between phases — Continue button in live mode**
- [ ] Opening, rebuttal, and closing phases wait for user to click "Continue" before advancing
- [ ] SSE events continue buffering in the background; only the displayed phase is gated
- [ ] Internal phases (eval, research_consultation) auto-advance without user action

**23b. Markdown rendering in argument cards**
- [ ] Headings (`#`, `##`, `###`), lists (`-`), and horizontal rules (`---`) render as styled HTML
- [ ] Existing citation badge and bold rendering preserved
- [ ] StreamingText component updated

**23c. Evaluation phases — show agent thought process**
- [ ] Backend streams internal phase LLM chunks as `internal_content` SSE events
- [ ] Frontend stores internal analysis and displays in StrategicAnalysisPanel
- [ ] Users can toggle-view the strategic analysis for eval_openings and eval_full_debate

**23d. Evidence bundle based on actual research**
- [ ] Backend sends real evidence data (pro_arguments, con_arguments, citations) in `evidence_loaded` SSE event
- [ ] Frontend displays real evidence in research phase instead of hardcoded mock data
- [ ] Falls back to mock data only in demo mode

**23e. Research consultation viewable via toggle**
- [ ] Research consultation phase output viewable in the research phase UI
- [ ] Toggle panel shows pro/con strategic analysis from the research consultation
- [ ] Uses same `internal_content` SSE mechanism as evaluation phases

**23f. Persona reveal animation + "Start Debate" button**
- [ ] Persona interface expanded to include expertise_areas, core_values, rhetorical_approach
- [ ] Animated persona reveal UI shown after personas are generated
- [ ] Full persona details displayed: name, identity, expertise, values, approach
- [ ] "Start Debate →" button gates progression to the debate phases

**23g. Judging phase — transparency and per-judge breakdowns**
- [ ] Backend synthesizes a summary from the 3 judges' individual reasoning
- [ ] Frontend shows per-judge expandable cards with scores, reasoning, strongest/weakest moves
- [ ] Uses backend `weighted_total` instead of re-computing on frontend
- [ ] Score bars include per-judge contribution labels
- [ ] Verdict explanation shows why the winner was chosen with supporting judge analysis

---

## Sprint 3 Issues — AI-Powered Research + Custom Topics (Stretch)

> **Goal:** Allow users to debate any topic by having the AI generate research automatically, or by bringing their own research. Requires the user to provide their own API key or pay.

---

### Issue #11: Topic analysis and research prompt generator
**Labels:** `feature`, `priority: medium`  
**Milestone:** Sprint 3  
**Assignee:** Jason  
**Depends on:** #4

#### Description
For custom topics, Claude Haiku analyzes the resolution and generates argument dimensions. The system produces two research prompts that **users copy into Claude or ChatGPT** to run externally, then upload the results. Backend prompt logic already exists in `topics/analysis.py` and `topics/prompts.py`.

#### Acceptance Criteria
- [x] `topics/analysis.py` implements `TOPIC_ANALYSIS_PROMPT` per `prompts-doc.md §5`
- [x] `topics/prompts.py` implements `CUSTOM_RESEARCH_PROMPT_TEMPLATE` per `prompts-doc.md §4`
- [x] Research prompts require structured Markdown output with citation format
- [x] Accepts optional user-supplied argumentation lines
- [x] `POST /api/topics/analyze` route exists
- [x] Frontend `/debates/new` page exists with 3-step flow
- [ ] User can review/edit generated positions before proceeding
- [ ] Unit tests verify analysis returns valid structured output

---

### Issue #12: User research upload and custom topic flow
**Labels:** `feature`, `priority: medium`  
**Milestone:** Sprint 3  
**Assignee:** Shuai  
**Depends on:** #11

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
