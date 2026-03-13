# DebateMeBro

**AI-Powered Structured Debates That Steelman Both Sides.**

> *CS 7180 — AI-Assisted Coding, Spring 2026*
> **Team:** Jason Ingersoll & Shuai Ren

**Live Demo:** [https://debatemebro.vercel.app](https://debatemebro.vercel.app)
**Backend API:** [https://debatemebro-api.onrender.com](https://debatemebro-api.onrender.com)
**Blog Post:** [Docs/blog_post.md](Docs/blog_post.md) | **Video Script:** [Docs/script.md](Docs/script.md)

---

## Table of Contents

1. [What Is DebateMeBro?](#1-what-is-debatemebro)
2. [Why It Matters](#2-why-it-matters)
3. [Features](#3-features)
4. [How a Debate Works — The 7-Phase Pipeline](#4-how-a-debate-works--the-7-phase-pipeline)
5. [Architecture](#5-architecture)
6. [Tech Stack](#6-tech-stack)
7. [AI Usage — In the Product and In Development](#7-ai-usage--in-the-product-and-in-development)
8. [API Documentation](#8-api-documentation)
9. [Development Process](#9-development-process)
10. [Team Contributions](#10-team-contributions)
11. [Known Issues & Future Work](#11-known-issues--future-work)
12. [Local Development Setup](#12-local-development-setup)
13. [Deployment](#13-deployment)

---

## 1. What Is DebateMeBro?

DebateMeBro is a full-stack web application that lets two AI agents formally debate any topic in real time. Each agent receives a dynamically generated persona, reads the same body of research evidence, and argues through a structured 7-phase pipeline: research consultation, opening arguments, strategic evaluation, rebuttals, full-debate evaluation, closing statements, and AI judging.

A panel of three specialized AI judges — Logic, Evidence, and Engagement — independently scores both sides on a weighted rubric, producing transparent per-judge reasoning and a final verdict. Users watch the entire debate stream token-by-token, can review each agent's internal strategic analysis, and cast their own vote on the winner.

**Design philosophy: No topic is off limits.** The platform does not filter or refuse debate topics. The premise is that bad ideas lose when forced to defend themselves against the strongest possible counterarguments in a structured format with transparent scoring. The debate format and judging rubric are the quality control mechanism — not content moderation.

---

## 2. Why It Matters

Online discourse is broken. People strawman, argue in bad faith, and use rhetorical tricks instead of engaging with substance. When someone wants to understand both sides of a contentious issue, they have to wade through biased sources, social media shouting matches, and pundits incentivized to polarize rather than inform.

DebateMeBro solves this by showing what genuinely good-faith arguments look like on both sides of any topic — arguments backed by real evidence, structured reasoning, and honest engagement with opposing views. Each side is *required* to steelman the other before rebutting, meaning they must articulate the strongest version of their opponent's argument before attacking it.

The result is an educational tool that helps users:
- See the strongest case for each side of complex issues
- Learn to recognize logical fallacies and weak reasoning
- Understand how evidence should support argumentation
- Form informed opinions based on substance, not rhetoric

---

## 3. Features

### Preset & Custom Debates
Pick from curated topics (e.g., "Should the United States adopt universal healthcare?") with pre-researched evidence, or enter any custom topic. For custom topics, Claude Haiku analyzes the resolution and generates optimized research prompts the user can run externally, then upload the results.

### Live Debate Streaming
Arguments stream token-by-token in a split-screen layout (Pro on the left in blue, Con on the right in red) via Server-Sent Events (SSE). A phase navigation bar shows progress through all debate stages. Completed phases are clickable for review.

### Dynamic AI Personas
Each debate generates unique personas with specific names, identities, expertise areas, core values, and rhetorical approaches — not generic "Pro Bot / Con Bot" but nuanced advocates. An animated persona reveal overlay introduces them before the debate begins.

### Strategic Analysis Transparency
Between argument rounds, agents privately evaluate each other's arguments and plan their strategy. Users can view this internal strategic analysis through toggle panels, seeing exactly how each agent prepared its rebuttal and closing.

### AI Judging Panel
Three specialized judges (Logic, Evidence, Engagement) independently evaluate the debate. Each provides per-side scores, chain-of-thought reasoning, strongest/weakest move analysis, and a winner determination. Results display as expandable judge cards with score bars and a synthesized verdict.

### Debate Persistence & Caching
Every completed debate is permanently cached as JSON. Replaying a cached debate costs $0 in API tokens and loads instantly. All debates are publicly browseable.

### User Authentication & Voting
JWT-based authentication with register/login. Authenticated users can vote Pro or Con after the debate, with vote tallies displayed alongside AI judge scores.

### Demo / Live Mode Toggle
`DEBATE_MODE=demo|live` environment variable controls whether debates use mock data or real Claude API calls. A badge in the UI always shows which mode is active.

---

## 4. How a Debate Works — The 7-Phase Pipeline

Every debate follows a structured pipeline managed by a LangGraph state machine:

```
Phase 1: Research Consultation (internal)
    Both agents read ALL evidence (Pro + Con research). Each identifies strongest
    arguments for its position and anticipates opponent attack vectors.

Phase 2: Opening Arguments (streamed)
    Pro and Con each deliver comprehensive opening statements with cited evidence.
    Neither agent has seen the other's opening.

Phase 3: Evaluation of Openings (internal)
    Each agent receives the opponent's opening and strategically analyzes it.
    Users can view this analysis via toggle panels.

Phase 4: Rebuttals (streamed)
    Each agent constructs targeted rebuttals. Must steelman the opponent's
    strongest point before responding. Introduces new evidence not used in opening.

Phase 5: Full Debate Evaluation (internal)
    Each agent reflects on all arguments so far before writing closing statements.

Phase 6: Closing Statements (streamed)
    Final synthesis. Each agent acknowledges opponent's strong points, identifies
    where real disagreement remains, and makes their final case.

Phase 7: Judging
    Three AI judges evaluate the complete transcript:
    - Logic Judge (30% weight): Logical validity, soundness, fallacy identification
    - Evidence Judge (25% weight): Source quality, citation accuracy, data usage
    - Engagement Judge (25% weight): Steelmanning quality, rhetorical effectiveness
    - Refutation (20% weight): How well each side addressed opponent arguments
```

**Critical design decision:** Both sides see ALL research. Unlike some designs that restrict each side to its own evidence, DebateMeBro gives both agents the complete research body — mirroring real competitive debate where both teams research the same topic. The skill is in argumentation, not information asymmetry.

---

## 5. Architecture

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (Next.js 15, React, TailwindCSS)    │
│  - Debate streaming UI (SSE consumer)                    │
│  - Phase navigation, persona reveal, judging display     │
│  - Zustand state management                              │
│  - Auth pages, dashboard, browse, custom topic flow      │
├─────────────────────────────────────────────────────────┤
│  ORCHESTRATION LAYER (FastAPI + LangGraph)               │
│  - Debate state machine (10 nodes, 7 phases)             │
│  - SSE streaming endpoint (stream.py)                    │
│  - Cache-first replay (store.py)                         │
│  - REST API routes (auth, topics, debates, votes)        │
├─────────────────────────────────────────────────────────┤
│  INTELLIGENCE LAYER (Anthropic Claude)                   │
│  - Claude Haiku: topic analysis, persona generation      │
│  - Claude Sonnet: debate agents, AI judges               │
│  - Prompt caching on system prompts + evidence bundles   │
└─────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

- **LangGraph over ad-hoc control flow:** The debate is a state machine with 10 nodes. LangGraph manages transitions, concurrent execution (pro/con eval phases run in parallel via `asyncio.gather`), and state persistence. This keeps the orchestration logic declarative and testable.

- **SSE over WebSockets:** Server-Sent Events provide a simpler, unidirectional streaming protocol that's sufficient for debate content. The backend streams 9 event types: `content`, `phase_transition`, `personas`, `evidence_loaded`, `internal_content`, `judging_results`, `mode`, `complete`, `error`.

- **Cache-first architecture:** Before opening an SSE connection, the frontend calls `GET /api/debates/{id}`. If the debate exists in cache, all data loads instantly without streaming. If not, the SSE connection is opened and the LangGraph pipeline runs.

- **Zustand for state management:** A single store manages debate turns, personas, judging results, phase state, internal analysis, evidence bundles, and UI flags. The SSE handler writes directly to the store, and React components subscribe to slices via `useShallow`.

---

## 6. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15 (App Router) | React framework with file-based routing |
| Styling | TailwindCSS 4 + @tailwindcss/typography | Dark theme, gradient-heavy design |
| State | Zustand | Client-side global state for debate data |
| Backend | FastAPI (Python 3.12) | Async REST API + SSE streaming |
| Orchestration | LangGraph | Debate state machine with 10 nodes |
| AI Provider | Anthropic Claude (Haiku + Sonnet) | Topic analysis, personas, debate, judging |
| Database | PostgreSQL 16 + pgvector | User accounts, schema via SQLAlchemy + Alembic |
| Cache | Redis | SSE fan-out, session state |
| Persistence | JSON file store | Debate caching (dev mode) |
| Auth | JWT (passlib + bcrypt) | Token-based authentication |
| CI/CD | GitHub Actions | Linting, formatting, test automation |
| Containers | Docker Compose | PostgreSQL, Redis, backend, frontend |

---

## 7. AI Usage — In the Product and In Development

### AI in the Product

1. **Claude Haiku** — Fast, cheap model for topic analysis and persona generation. Analyzes custom resolutions into argument dimensions, generates research prompts, and creates unique debate personas with specific expertise and rhetorical approaches.

2. **Claude Sonnet** — Premium model for debate agents and judges. Powers the Pro and Con agents through all debate phases with strict steelmanning requirements, evidence citation, and persona adherence. Also powers the three-judge panel with specialized scoring criteria.

3. **Prompt Engineering** — Extensive prompt design following `prompts-doc.md` specifications. System prompts enforce steelmanning, evidence citation, persona voice consistency, and structured output formats. Anthropic prompt caching reduces repeated token costs.

### AI in Development

1. **Windsurf / Cascade** — Primary development IDE. Used for pair programming on complex features: SSE streaming handler, LangGraph state machine, phase gating logic, merge conflict resolution, and documentation. Cascade helped debug the internal phase speaker detection bug by identifying that LangGraph event tags could carry role information.

2. **GitHub Copilot** — Used for inline code generation, particularly for async patterns (`asyncio.gather` for judges), test fixtures, and boilerplate. Copilot flagged the context leak bug where eval phase notes were leaking to opponent agents.

3. **Claude (direct)** — Used to generate the pre-loaded research documents for preset topics (healthcare, remote work, AI copyright). Each research document is 8-15 pages of sourced evidence.

---

## 8. API Documentation

Interactive Swagger docs available at `/docs` on the backend.

### Auth
- `POST /api/auth/register` — Create user with bcrypt password hashing
- `POST /api/auth/login` — OAuth2 form login, returns JWT access token

### Debates
- `GET /api/debates/` — List all completed, cached debates (public)
- `GET /api/debates/{id}` — Full debate JSON (history, personas, judging)
- `GET /api/debates/{id}/stream` — SSE endpoint for live debate streaming
- `GET /api/debates/mode` — Current demo/live mode status

### Topics & Research
- `GET /api/topics/presets` — Preset topics with positions and parameters
- `POST /api/research/analyze` — Claude Haiku topic analysis
- `POST /api/research/upload/{topic_id}` — Upload markdown research
- `GET /api/research/status/{topic_id}` — Research readiness check

### Votes
- `POST /api/votes/` — Cast pro/con vote (auth required)
- `GET /api/votes/{debate_id}` — Vote tallies

---

## 9. Development Process

### Sprint Structure
Development was organized into 2+ week sprints with documented planning, execution, and retrospectives.

**Sprint 1 (Weeks 7-9):** Core infrastructure. 10 issues covering scaffolding, Docker, database schema, auth, evidence loader, LangGraph state machine, persona generation, agent prompts, SSE streaming, landing page, debate view (demo mode), and AI judging panel (backend). All completed.

**Sprint 2 (Weeks 9-10):** Live API integration. 8 issues covering debate persistence/caching, demo-to-live mode toggle, frontend UX overhaul (7 sub-issues + 6 bugfix follow-ups), dashboard, voting, browsing. 3 major issues completed, 5 deferred.

### Agile Artifacts
- **PRD:** `Docs/debatemebro-prd.md` — Full product requirements with MoSCoW-prioritized user stories
- **Issues:** `Docs/github-issues.md` — 31 tracked issues with acceptance criteria
- **Sprint Logs:** `Docs/sprint_1_log.md`, `Docs/sprint_2_log.md` — Retrospectives with challenges, insights, and action items
- **CI/CD:** `.github/workflows/ci.yml` — Automated linting and formatting

---

## 10. Team Contributions

### Jason Ingersoll
- Backend debate pipeline: LangGraph state machine, agent prompts, SSE streaming, evidence loader
- Frontend debate view: 1500+ line debate page with SSE handler, phase gating, persona reveal, judging UI
- AI judging panel: 3 judge prompts, concurrent execution, scoring synthesis
- Deployment configuration (Vercel + Render)
- All project documentation (PRD, sprint logs, blog post, demo script)

### Shuai Ren
- User authentication: register/login, JWT tokens, password hashing, protected routes
- Voting system: backend routes, frontend vote buttons, tally display
- Dashboard page: real data fetch, debate history cards
- Browse page: public debate listing
- Auth improvements: safe returnTo params, Suspense loading fallbacks

---

## 11. Known Issues & Future Work

### Known Bugs (deferred)
- **#29** Phase gating incomplete — Continue button missing on research, opening, rebuttal phases
- **#30** Browse page likes not functional (backend endpoint not wired)
- **#31** Judging metrics display issues (score bars, per-judge data inconsistencies)

### Planned Improvements
- **#25** Argument quality improvements (values/logic-first prompts, fallacy reduction)
- **#26** Per-criterion judge scoring breakdown with justifications
- **#27** Persona reveal on every debate load (including cached/demo)
- **#28** "How It Works" explanation page
- **#13** Position-swapped judging for bias elimination
- Automated research pipeline (Tavily + Claude web search)
- Oxford-style opinion shift tracking

---

## 12. Local Development Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (if running frontend outside Docker)
- Python 3.12+ (if running backend outside Docker)
- Anthropic API key

### Quick Start

1. **Environment Variables:**
   ```bash
   cp .env.example .env
   # Add your ANTHROPIC_API_KEY
   # Set DEBATE_MODE=live for real debates, DEBATE_MODE=demo for mock data
   ```

2. **Start Services:**
   ```bash
   docker compose up -d --build
   ```

3. **Access the Application:**
   - **Frontend:** [http://localhost:3030](http://localhost:3030)
   - **Backend API:** [http://localhost:8000](http://localhost:8000)
   - **Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

4. **Stop Services:**
   ```bash
   docker compose down
   ```

### Running Without Docker

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev  # runs on port 3000
```

---

## 13. Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | [https://debatemebro.vercel.app](https://debatemebro.vercel.app) |
| Backend | Render.com | [https://debatemebro-api.onrender.com](https://debatemebro-api.onrender.com) |

**Why two platforms:** Vercel excels at Next.js but its serverless functions have a 10-second execution limit. Debate SSE streams run 2-5 minutes, requiring a persistent server — Render provides this on the free tier.

**Deployment config files:**
- `frontend/vercel.json` — Vercel build configuration
- `backend/render.yaml` — Render blueprint for one-click deploy

**Environment variables:**
- **Vercel:** `NEXT_PUBLIC_API_URL` → Render backend URL
- **Render:** `ANTHROPIC_API_KEY`, `DEBATE_MODE`, `JWT_SECRET`, `DEBATE_MODEL`, `PERSONA_MODEL`