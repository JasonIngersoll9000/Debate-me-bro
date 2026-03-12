# GitHub Issues for DebateMeBro

# PAT token: REMOVED_TOKEN_FOR_SECURITY

## Setup Checklist
1. Create GitHub Project (Board layout): **Backlog | Sprint Todo | In Progress | In Review | Done**
2. Create Milestone: **Sprint 1** (due: Week 9)
3. Create Milestone: **Sprint 2** (due: Week 10)
4. Create labels: `feature`, `chore`, `bug`, `docs`, `priority: high`, `priority: medium`, `priority: low`
5. Create all issues below, assign milestones and labels
6. Move Sprint 1 issues → "Sprint Todo" column
7. Move Sprint 2 issues → "Backlog" column

## Dependency Order (build in roughly this sequence)

### Sprint 1 — Core Debate Loop
```
#1 Scaffolding + Docker ──→ #2 DB Schema ──→ #3 Auth
                       └──→ #4 Evidence Loader ──→ #5 LangGraph State Machine ──→ #6 Agent Prompts
                                                                                       ↓
#8 Landing Page ──→ #9 Debate View + Streaming ←── #7 SSE Endpoint ←── #6
                                                       ↓
                                                  #10 Basic Judging
```

### Sprint 2 — Custom Topics + Full Judging
```
#11 Topic Analysis + Prompt Gen ──→ #12 Research Upload + Custom Flow
#13 Full Judging Panel (extends #10)
#14 Human Voting
#15 Dashboard
```

---

## Sprint 1 Issues (Must Have — Core Debate Pipeline)

---

### Issue #1: Set up project scaffolding and Docker Compose
**Labels:** `chore`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Jason  
**Depends on:** Nothing (first issue)

#### Description
Initialize the monorepo with backend (FastAPI) and frontend (Next.js), Docker Compose for local dev, `.agent/` rules and workflows, and basic CI.

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
**Depends on:** #1

#### Description
Create PostgreSQL schema, SQLAlchemy ORM models, Alembic migrations, and corresponding Pydantic request/response models.

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
**Depends on:** #2

#### Description
JWT-based auth so users can register, log in, and access protected routes.

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
**Depends on:** #1

#### Description
Create preset topic system with pre-loaded research. Evidence loader parses structured Markdown research docs with hyperlinked sources into a format debate agents can reference and cite.

#### Acceptance Criteria
- [x] `GET /topics/presets` returns 3+ preset topics with titles, descriptions, Pro/Con positions
- [x] Pre-researched evidence files in `backend/evidence/` for all preset topics (structured Markdown with hyperlinked sources)
- [x] Each topic has Pro research doc and Con research doc (generated via Claude Research / ChatGPT Deep Research during development)
- [x] `evidence.py` parses Markdown research files, extracts arguments, and builds a citation index (`[Source Title](URL)` → `CitationDetail`)
- [x] Evidence loader returns ALL research (Pro + Con combined) as a single `EvidenceBundle` — no side restriction
- [x] Evidence format identical whether from pre-loaded files or future uploaded docs
- [x] Unit tests verify evidence loading, parsing, and citation extraction

---

### Issue #5: LangGraph debate state machine
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Jason  
**Depends on:** #4

#### Description
Core debate orchestration as a LangGraph state machine with nodes for all 7 phases (including internal evaluation phases).

#### Acceptance Criteria
- [x] `DebateState` TypedDict tracks: debate_id, topic, status, current_phase, debate_turns, evidence_bundle (shared Pro + Con), personas
- [x] Graph nodes for full pipeline: `research_consultation` → `opening_pro` → `opening_con` → `eval_openings` → `rebuttal_pro` → `rebuttal_con` → `eval_full_debate` → `closing_pro` → `closing_con` → `judging` → `complete`
- [x] Internal phases (research_consultation, eval_openings, eval_full_debate) produce strategic analysis output but do NOT stream to user by default
- [x] Streamed phases (opening, rebuttal, closing) emit SSE events with argument content
- [x] Phase transition events sent between phases (including transition messages for internal phases)
- [x] Debate status updates in database at each transition
- [x] Unit tests verify state machine transitions with mocked agents

---

### Issue #6: Dynamic persona generation + debate agent prompts
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Jason  
**Depends on:** #4, #5

#### Description
Build the prompt construction system: dynamic persona generation (tailored to topic + evidence), phase-specific instructions, shared evidence injection, and internal evaluation prompts. Agents should appeal to values and argue persuasively, not produce dry academic output.

#### Acceptance Criteria
- [x] `persona_generator.py` generates a tailored advocate persona based on topic and evidence (via Claude Haiku) — not a fixed character
- [x] System prompt includes: dynamic persona, assigned position (re-injected every phase), commitment device, steelmanning requirement, instruction to appeal to values
- [x] **Research consultation prompt:** Agent receives ALL research, identifies strengths/vulnerabilities/opponent strategy/source conflicts
- [x] **Opening prompt:** Agent presents case with citations, hasn't seen opponent's opening
- [x] **Eval openings prompt (internal):** Agent reads opponent's opening, assesses sources, plans rebuttal — output stored but not streamed
- [x] **Rebuttal prompt:** Steelman → respond → challenge evidence → introduce new sources → connect to values
- [x] **Eval full debate prompt (internal):** Agent reflects on all arguments, plans closing — output stored but not streamed
- [x] **Closing prompt:** Acknowledge opponent, name core disagreement, synthesize, address hardest question, close with impact
- [x] All prompts use minimums (not maximums) for length and sources — as long as needed
- [x] Evidence passed with `[Source: Title](URL)` citation markers so agents can reference specific sources
- [x] Unit tests verify prompt construction includes all required components per phase

---

### Issue #7: SSE streaming endpoint for debate
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Shuai  
**Depends on:** #5

#### Description
Server-Sent Events endpoint that streams debate content to the frontend as the debate progresses, including phase transitions and internal phase notifications.

#### Acceptance Criteria
- [x] `GET /debates/{id}/stream` returns SSE stream (content-type: text/event-stream)
- [x] Streamed phases: argument content sent token-by-token as SSE events
- [x] Internal phases: transition event sent (type: "phase_transition", message: "Agents evaluating...")
- [x] Internal phase strategic analysis available via separate endpoint (hidden by default, viewable on request)
- [x] Stream includes metadata: current phase, speaker (pro/con), phase type (streamed vs internal)
- [x] Stream ends with completion event
- [x] Frontend SSE handler connects, processes events, handles reconnection
- [x] Integration test verifies events sent in correct order for complete debate

---

### Issue #8: Frontend — Landing page with preset topics
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Shuai  
**Depends on:** #1

#### Description
Landing page with topic input, preset topic cards, "How it works" flow, and navigation to debate view.

#### Acceptance Criteria
- [ ] Displays app title, tagline, topic input field (dark theme, gradient title per mockup)
- [ ] 3+ preset topic cards fetched from `GET /topics/presets`
- [ ] Clicking a preset navigates to `/debates/[id]` and launches debate
- [ ] "How it works" shows 7-phase flow: Research → Opening → Eval → Rebuttal → Eval → Closing → Judging
- [ ] Styled with TailwindCSS matching v3 mockup
- [ ] Component test verifies preset topics render and are clickable

---

### Issue #9: Frontend — Live debate view with streaming
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Shuai  
**Depends on:** #7, #8

#### Description
Split-screen debate view with streaming arguments, 7-phase navigation, citation badges with clickable source URLs, internal phase transition messages, and "Show strategic analysis" toggle.

#### Acceptance Criteria
- [ ] Split-screen: Pro (left, blue) and Con (right, red) with dynamic persona names/roles
- [ ] Arguments stream token-by-token with cursor animation
- [ ] Phase nav bar shows all 7 phases — internal phases styled differently (italic/muted)
- [ ] Completed phases clickable to review earlier arguments
- [ ] Internal phases show transition message + spinner + "🧠 Show strategic analysis" toggle
- [ ] Strategic analysis panels display in monospace, collapsible, visually distinct from arguments
- [ ] Citation badges show source title, click to expand with hyperlink URL for verification
- [ ] Zustand store manages debate state (phase, turns, streaming, internal analysis)
- [ ] Component tests for ArgumentCard, PhaseNav, StreamingText, StrategicAnalysisPanel

---

### Issue #10: Basic AI judging (single judge, no position swap)
**Labels:** `feature`, `priority: medium`  
**Milestone:** Sprint 1  
**Assignee:** Jason  
**Depends on:** #6

#### Description
Basic judging with a single AI judge on the 4-criterion rubric. Multi-judge panel + position swapping added in Sprint 2.

#### Acceptance Criteria
- [ ] Single Claude Sonnet judge evaluates complete debate transcript
- [ ] Scores on 4 criteria: Logical Validity (30%), Evidence Quality (25%), Refutation Strength (25%), Steelmanning Quality (20%)
- [ ] Chain-of-thought reasoning before assigning scores
- [ ] Judge uses anti-bias instructions (unpopular but well-argued > popular but poorly argued)
- [ ] Evidence judge criteria: methodology and accuracy over institutional prestige
- [ ] Scores stored in `judge_scores` table
- [ ] Results displayed as score bars (Pro vs Con per criterion) in frontend
- [ ] Unit test verifies rubric scoring with mocked API response

---

## Sprint 2 Issues (Should Have + Could Have)

---

### Issue #11: Topic analysis and research prompt generator
**Labels:** `feature`, `priority: medium`  
**Milestone:** Sprint 2  
**Assignee:** Jason  
**Depends on:** #4

#### Description
For custom topics, Claude Haiku analyzes the resolution and generates argument dimensions. The system produces two research prompts requiring structured Markdown with hyperlinked sources.

#### Acceptance Criteria
- [ ] `POST /topics/analyze` accepts any topic string — no filtering or refusal
- [ ] Claude Haiku returns: Pro/Con position statements, 3-5 argument dimensions per side, key values/frameworks, contested empirical questions, persona suggestions
- [ ] `GET /research/prompt/{topic_id}` returns two formatted research prompts (Pro + Con)
- [ ] Research prompts require structured Markdown output with `**[Source Title](URL)**` format
- [ ] Research prompts instruct for deep advocacy research, not balanced overview
- [ ] Accepts optional user-supplied argumentation lines (Could Have — only if US-9 is implemented)
- [ ] User can review/edit generated positions before proceeding
- [ ] Unit tests verify analysis returns valid structured output

---

### Issue #12: User research upload and custom topic flow
**Labels:** `feature`, `priority: medium`  
**Milestone:** Sprint 2  
**Assignee:** Shuai  
**Depends on:** #11

#### Description
Upload research documents for custom topics. Parsed into same structured format as pre-loaded research.

#### Acceptance Criteria
- [ ] `POST /research/upload` accepts text or PDF files for Pro and/or Con research
- [ ] Uploaded Markdown parsed by evidence loader — same `EvidenceBundle` format as pre-loaded
- [ ] Citation index built from `**[Title](URL)**` hyperlinks in uploaded documents
- [ ] Both debate agents receive ALL uploaded research (shared pool)
- [ ] Frontend upload page: generated prompts displayed + copy buttons, file upload for Pro + Con
- [ ] User can optionally add specific argumentation lines (Could Have — only if US-9 is implemented; UI makes clear these are additive, not restrictive)
- [ ] Debate launches after research uploaded
- [ ] Integration test verifies upload → parse → debate flow

---

### Issue #13: Full judging panel with position-swapped evaluation
**Labels:** `feature`, `priority: medium`  
**Milestone:** Sprint 2  
**Assignee:** Jason  
**Depends on:** #10

#### Description
Extend basic judging to 3-judge panel (Logic, Evidence, Engagement) with position-swapped bias elimination.

#### Acceptance Criteria
- [ ] Three judges with specialized system prompts: Logic Judge, Evidence Judge, Engagement Judge
- [ ] Evidence Judge evaluates source quality on methodology/accuracy, not institutional prestige
- [ ] Each judgment runs twice: original order + reversed order (position swap)
- [ ] Consistent results counted; inconsistent flagged
- [ ] Scores from both orderings averaged
- [ ] Frontend: per-judge breakdown with expandable reasoning, consistency indicator
- [ ] Unit tests verify position-swap logic and consistency detection

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

### Issue #15: User dashboard — debate history
**Labels:** `feature`, `priority: low`  
**Milestone:** Sprint 2  
**Assignee:** Shuai  
**Depends on:** #3

#### Description
Authenticated users see past debates, votes, and results.

#### Acceptance Criteria
- [ ] `GET /debates?user_id={id}` returns user's debates
- [ ] Dashboard lists: topic, date, winner, user's vote
- [ ] Click navigates to full debate view with results
- [ ] Auth-gated (redirect to login if not authenticated)
- [ ] Component test for list rendering
