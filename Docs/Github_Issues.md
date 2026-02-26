# GitHub Issues for DebateMeBro

Instructions: Create each issue on GitHub with the title, body, labels, and milestone shown. Then assign Sprint 1 issues to the "Sprint Todo" column on your Project board.

---

## Issue #1: Set up project scaffolding and Docker Compose
**Labels:** `chore`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Jason

### Description
Initialize the monorepo with backend (FastAPI) and frontend (Next.js) projects, Docker Compose for local development, and basic CI.

### Acceptance Criteria
- [ ] FastAPI backend runs on `localhost:8000` with a `/health` endpoint returning `{"status": "ok"}`
- [ ] Next.js frontend runs on `localhost:3000` with a basic landing page
- [ ] Docker Compose starts PostgreSQL 16, Redis, backend, and frontend with `docker compose up`
- [ ] `.env.example` includes all required environment variables (ANTHROPIC_API_KEY, DATABASE_URL, REDIS_URL, JWT_SECRET)
- [ ] `.antigravityrules` file is committed to project root
- [ ] Basic CI runs linting on push (GitHub Actions)

---

## Issue #2: Database schema and models
**Labels:** `chore`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Shuai

### Description
Create the PostgreSQL database schema, SQLAlchemy ORM models, Alembic migration setup, and corresponding Pydantic models.

### Acceptance Criteria
- [ ] SQLAlchemy models defined for: `users`, `debates`, `debate_turns`, `votes`, `judge_scores`
- [ ] Pydantic models defined in `models/` for: `DebateState`, `DebateTurn`, `DebateConfig`, `TopicAnalysis`, `JudgeScore`
- [ ] Alembic initialized with first migration creating all tables
- [ ] `database.py` provides async session factory using `asyncpg`
- [ ] Database connection verified in Docker Compose setup
- [ ] At least 3 unit tests verifying model validation (e.g., invalid debate status rejected)

---

## Issue #3: User authentication (register + login + JWT)
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Shuai

### Description
Implement JWT-based user authentication so users can register, log in, and access protected routes.

### Acceptance Criteria
- [ ] `POST /auth/register` creates a new user with hashed password (passlib bcrypt)
- [ ] `POST /auth/login` returns a JWT access token on valid credentials
- [ ] `get_current_user` dependency extracts and validates JWT from Authorization header
- [ ] Protected routes return 401 without valid token
- [ ] Passwords are never stored in plaintext
- [ ] Integration tests for register, login, and protected route access

---

## Issue #4: Preset topics and evidence loader
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Jason

### Description
Create the preset topic system with pre-loaded research documents. The evidence loader reads markdown research files and provides them to debate agents.

### Acceptance Criteria
- [ ] `GET /topics/presets` returns a list of 3 preset topics with titles, descriptions, and Pro/Con position statements
- [ ] Pre-researched evidence files exist in `backend/evidence/` for all 3 topics (healthcare, remote work, AI copyright)
- [ ] Each topic has a Pro research document and Con research document (8-15 pages each, with cited sources)
- [ ] `evidence.py` loads and parses research files into a structured format usable by debate agents
- [ ] Evidence loader returns the same format regardless of source (pre-loaded vs future uploaded)
- [ ] Unit tests verify evidence loading and parsing

---

## Issue #5: LangGraph debate state machine
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Jason

### Description
Implement the core debate orchestration as a LangGraph state machine with nodes for each phase and conditional edges for transitions.

### Acceptance Criteria
- [ ] `DebateState` TypedDict tracks: debate_id, topic, status, current_phase, debate_turns, pro_evidence, con_evidence
- [ ] Graph nodes: `research_display` → `opening_pro` → `opening_con` → `rebuttal_pro` → `rebuttal_con` → `closing_pro` → `closing_con` → `judging` → `complete`
- [ ] Each debate phase node calls the appropriate agent/judge service
- [ ] State machine transitions correctly through all phases in sequence
- [ ] Debate status updates in the database at each phase transition
- [ ] Unit tests verify the state machine transitions without making real API calls (mock agents)

---

## Issue #6: Pro and Con debate agent prompts
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Jason

### Description
Build the prompt construction system for Pro and Con debate agents, with distinct personas, phase-specific instructions, and evidence injection.

### Acceptance Criteria
- [ ] Pro agent has a distinct persona (e.g., Constitutional Law Professor) with specific values and rhetorical style
- [ ] Con agent has a different persona (e.g., Policy Economist) with contrasting epistemic framework
- [ ] System prompts include: assigned position (re-injected every turn), commitment device, steelmanning requirement
- [ ] Opening prompt instructs agent to present case with citations from evidence documents
- [ ] Rebuttal prompt provides opponent's opening and requires steelmanning before responding
- [ ] Closing prompt provides full debate history and requires synthesis, not repetition
- [ ] Each agent's prompt includes the relevant research evidence with citation markers
- [ ] Unit tests verify prompt construction includes all required components for each phase

---

## Issue #7: SSE streaming endpoint for debate
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Shuai

### Description
Create the Server-Sent Events endpoint that streams debate content to the frontend as the debate progresses through its phases.

### Acceptance Criteria
- [ ] `GET /debates/{id}/stream` returns an SSE stream (content-type: text/event-stream)
- [ ] Each debate turn is streamed token-by-token as SSE events
- [ ] Phase transition events are sent between turns (e.g., `{"type": "phase_change", "phase": "rebuttal"}`)
- [ ] Stream includes metadata: current phase, current speaker (pro/con), turn number
- [ ] Stream ends with a completion event when the debate finishes
- [ ] Frontend SSE handler connects, processes events, and handles reconnection
- [ ] Integration test verifies SSE events are sent in correct order for a complete debate

---

## Issue #8: Frontend — Landing page with preset topics
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Shuai

### Description
Build the landing page with the topic input field, preset topic cards, and navigation to the debate view.

### Acceptance Criteria
- [ ] Landing page displays app title, tagline, and topic input field
- [ ] 3 preset topic cards are displayed below the input, fetched from `GET /topics/presets`
- [ ] Clicking a preset topic navigates to `/debates/[id]` and starts the debate
- [ ] "How it works" section shows the 5-phase flow
- [ ] Page is styled with TailwindCSS matching the mockup design (dark theme, gradient title)
- [ ] Component test verifies preset topics render and are clickable

---

## Issue #9: Frontend — Live debate view with streaming
**Labels:** `feature`, `priority: high`  
**Milestone:** Sprint 1  
**Assignee:** Shuai

### Description
Build the split-screen debate view that displays streaming arguments from the SSE endpoint, with phase navigation and citation badges.

### Acceptance Criteria
- [ ] Split-screen layout: Pro (left, blue accent) and Con (right, red accent)
- [ ] Arguments stream token-by-token with a cursor animation
- [ ] Phase navigation bar at top shows: Research → Opening → Rebuttal → Closing → Judging
- [ ] Completed phases are clickable to review earlier arguments
- [ ] Transition messages display between phases ("Evaluating opponent's opening argument...")
- [ ] Citation badges appear inline and expand on click to show source details
- [ ] Agent personas displayed (name, role) at top of each column
- [ ] Zustand store manages debate state (current phase, turns, streaming status)
- [ ] Component tests for ArgumentCard, PhaseNav, and StreamingText components

---

## Issue #10: Basic AI judging (single judge, no position swap)
**Labels:** `feature`, `priority: medium`  
**Milestone:** Sprint 1  
**Assignee:** Jason

### Description
Implement a basic judging system with a single AI judge evaluating the debate on the four-criterion rubric. Position swapping and multi-judge panel will be added in Sprint 2.

### Acceptance Criteria
- [ ] Single Claude Sonnet judge evaluates the full debate transcript
- [ ] Judge scores on 4 criteria: Logical Validity (30%), Evidence Quality (25%), Refutation Strength (25%), Steelmanning Quality (20%)
- [ ] Judge provides chain-of-thought reasoning before assigning scores
- [ ] Scores are stored in the `judge_scores` table
- [ ] Results displayed in the frontend as score bars (Pro vs Con per criterion)
- [ ] Unit test verifies rubric scoring with mocked API response

---

## Issue #11: Topic analysis and research prompt generator
**Labels:** `feature`, `priority: medium`  
**Milestone:** Sprint 2  
**Assignee:** Jason

### Description
For custom topics, Claude Haiku analyzes the topic and generates argument dimensions. The system then produces optimized research prompts the user can take to an external AI research tool.

### Acceptance Criteria
- [ ] `POST /topics/analyze` accepts any topic string — no filtering or refusal
- [ ] Claude Haiku returns: Pro/Con position statements, 3-5 argument dimensions, evidence landscape summary
- [ ] `GET /research/prompt/{topic_id}` returns two formatted research prompts (one Pro, one Con)
- [ ] Research prompts are detailed and optimized for AI research tools (Claude Research, OpenAI Deep Research)
- [ ] User can review and edit the generated positions before proceeding
- [ ] Unit tests verify topic analysis returns valid structured output

---

## Issue #12: User research upload and custom topic flow
**Labels:** `feature`, `priority: medium`  
**Milestone:** Sprint 2  
**Assignee:** Shuai

### Description
Allow users to upload research documents for custom topics. Uploaded files are parsed and fed to the debate agents as evidence.

### Acceptance Criteria
- [ ] `POST /research/upload` accepts text or PDF files for Pro and/or Con sides
- [ ] Uploaded text is parsed and stored associated with the debate
- [ ] Evidence loader handles uploaded documents in the same format as pre-loaded research
- [ ] Frontend provides a research upload page with: generated prompts displayed, file upload for Pro research, file upload for Con research
- [ ] Debate launches after research is uploaded
- [ ] Integration test verifies upload → parse → debate flow

---

## Issue #13: Full judging panel with position-swapped evaluation
**Labels:** `feature`, `priority: medium`  
**Milestone:** Sprint 2  
**Assignee:** Jason

### Description
Extend basic judging to a 3-judge panel with position-swapped evaluation for bias elimination.

### Acceptance Criteria
- [ ] Three judges with specialized roles: Logic Judge, Evidence Judge, Engagement Judge
- [ ] Each judge has a distinct system prompt focusing on their specialty criteria
- [ ] Each judgment runs twice: original order and reversed order (position swap)
- [ ] Consistent results (same winner both orderings) are counted; inconsistent results are flagged
- [ ] Scores from both orderings are averaged for the final result
- [ ] Frontend displays per-judge breakdown with expandable reasoning
- [ ] Judge consistency indicator shown (e.g., "2/3 judges consistent")
- [ ] Unit tests verify position-swap logic and consistency detection

---

## Issue #14: Human voting system
**Labels:** `feature`, `priority: medium`  
**Milestone:** Sprint 2  
**Assignee:** Shuai

### Description
Allow authenticated users to vote on debate winners, with votes displayed alongside AI judge scores.

### Acceptance Criteria
- [ ] `POST /votes` allows authenticated users to cast a Pro or Con vote on a debate
- [ ] Users can only vote once per debate
- [ ] `GET /votes/{debate_id}` returns vote tallies
- [ ] Frontend vote buttons appear in the judging results panel
- [ ] Dynamic weighting formula: AI-heavy (70/30) with few votes, human-heavy (40/60) at 20+ votes
- [ ] Combined winner displayed using weighted score
- [ ] Integration tests for voting endpoint (auth required, one vote per user per debate)

---

## Issue #15: User dashboard — debate history
**Labels:** `feature`, `priority: low`  
**Milestone:** Sprint 2  
**Assignee:** Shuai

### Description
Authenticated users can see their past debates, votes, and results on a dashboard page.

### Acceptance Criteria
- [ ] `GET /debates?user_id={id}` returns debates the user has viewed or voted on
- [ ] Dashboard page lists past debates with: topic, date, winner, user's vote
- [ ] Clicking a past debate navigates to the full debate view with results
- [ ] Dashboard is only accessible to authenticated users (redirect to login otherwise)
- [ ] Component test for debate history list rendering

---

## Project Board Setup Checklist
1. Create GitHub Project (Board layout) with columns: **Backlog | Sprint Todo | In Progress | In Review | Done**
2. Create Milestone: **Sprint 1** (due date: Week 9)
3. Create Milestone: **Sprint 2** (due date: Week 10)
4. Create labels: `feature`, `chore`, `bug`, `docs`, `priority: high`, `priority: medium`, `priority: low`
5. Add Issues #1-#10 to Sprint 1 milestone
6. Add Issues #11-#15 to Sprint 2 milestone
7. Move Sprint 1 issues to "Sprint Todo" column
8. Move Sprint 2 issues to "Backlog" column