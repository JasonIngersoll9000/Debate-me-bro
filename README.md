# DebateMeBro

AI-Powered Structured Debates That Steelman Both Sides.
*(CS 7180 - AI-Assisted Coding, Spring 2026)*

## Table of Contents
1. [Overview & Functionality](#1-overview--functionality)
2. [Technical Excellence & Architecture](#2-technical-excellence--architecture)
3. [AI Mastery](#3-ai-mastery)
4. [CI/CD & DevOps](#4-cicd--devops)
5. [Agile Process](#5-agile-process)
6. [API Documentation](#6-api-documentation)
7. [Local Development Setup](#7-local-development-setup)

---

## 1. Overview & Functionality
DebateMeBro solves the problem of online discourse by letting two AI agents formally debate any user-submitted topic in real time, with each side required to steelman the other before rebutting. An AI judging panel scores both sides on a transparent rubric.

**Core Features (3+ Distinct Features & Roles):**
- **Preset & Custom Debates:** Pick from curated topics or generate optimized research prompts for custom topics.
- **Live Debate Streaming:** Real-time token-by-token streaming of the debate using Server-Sent Events (SSE). 
- **AI Judging Panel:** 3 distinct AI judges dynamically score both sides with transparent reasoning logic.
- **User Authentication:** JWT-based user accounts limit features, save history, and allow users to vote on debates.
- **Real-Time State Management:** Implemented via Zustand on the frontend, flawlessly mapping complex LangGraph state progression from backend SSE buffers.

## 2. Technical Excellence & Architecture
**Tech Stack:**
- **Frontend:** Next.js 15+ (App Router), React, TailwindCSS, Zustand.
- **Backend:** FastAPI (Python), LangGraph for debate state machine orchestration.
- **Database:** PostgreSQL 16+ with `pgvector` for vector operations, mapped via SQLAlchemy and Alembic.
- **Caching/Queue:** Redis for SSE fan-out and session states.

**Testing & Quality (80%+ Coverage Goal):**
We utilize `pytest` for unit and integration testing inside the backend, heavily mocking the Anthropic API and database operations. Frontend utilizes React Testing Library and modern assertion libraries for UI elements. An evaluation suite checks code quality metrics and API endpoints functionally.

## 3. AI Mastery
**Effective Use of AI Modalities:**
1. **API / Agentic AI (Claude API):** 
   - **Claude Haiku** powers deep topic analysis and automatic research prompt generation.
   - **Claude Sonnet** powers the debate agents (Pro & Con) applying intense persona alignment and strict steelmanning guidelines. It is also used to evaluate the debate via 3 distinct Judge personas.
2. **IDE-Centric AI (Copilot / Windsurf / Cursor):**
   - We heavily leveraged inline generation to write asynchronous LangGraph execution sequences and SSE streaming loops. IDE tools helped identify bugs like LLM context-leak scenarios during the Rebuttal/Closing rounds and suggested asynchronous optimizations (like utilizing `asyncio.gather` for the judges).

## 4. CI/CD & DevOps
**Advanced Pipeline & Automation:**
- **Containerization:** The application uses a multi-stage `docker-compose.yml` that securely isolates the frontend, backend FastAPI layer, PostgreSQL engine, and Redis.
- **CI/CD Pipeline:** Implemented in `.github/workflows/ci.yml`. Triggers automated backend formatting (Black, Flake8) and frontend dependency tracing & linting on push/pull request. 
- **Database Management:** Alembic automates schema rollout, generating structured migration paths ensuring SQL parity.

## 5. Agile Process
**Sprints & Planning:**
- Development structured over multiple 2+ week sprints with thoroughly documented logs and iterative retrospectives (`Docs/sprint_1_log.md`, `Docs/sprint_2_log.md`).
- Extensive User Stories with MoSCoW-prioritized Acceptance Criteria mapped via GitHub Issues (`Docs/debatemebro-prd.md` & `Docs/github-issues.md`).
- Retrospectives efficiently diagnosed and resolved major architecture blockers (e.g., port proxies, Alembic generation pathing, legacy bcrypt security updates).

## 6. API Documentation
The backend leverages OpenAPI to generate automatic interactive Swagger documentation. Test the API at `http://localhost:8000/docs` during runtime.

### Key Swagger Endpoints:

#### Auth 
- `POST /api/auth/register` - Create a new user with secure password hashing.
- `POST /api/auth/login` - Authenticate via OAuth2 form data and return a JWT access token.

#### Debates
- `GET /api/debates/` - List all completed, cached debates.
- `GET /api/debates/{debate_id}` - Fetch entire JSON structure (history and judging metadata) for a known debate.
- `GET /api/debates/{debate_id}/stream` - SSE endpoint streaming real-time tokens of the AI debate pipeline in motion.

#### Topics & Research
- `GET /api/topics/presets` - Retrieve hardcoded preset topics, including their starting positions and parameters.
- `POST /api/research/analyze` - Request Claude Haiku to analyze a custom resolution and return structued Pro/Con viewpoints and optimized research prompts.
- `POST /api/research/upload/{topic_id}` - Upload provided Markdown research for a custom topic directly into the evidence pool.
- `GET /api/research/status/{topic_id}` - A polling endpoint verifying if the uploaded research meets criteria to initiate the debate.

## 7. Local Development Setup

### Prerequisites
- Docker & Docker Compose
- Node.js (if running frontend outside of Docker)
- Python 3.12+ (if running backend outside of Docker)

### Quick Start

1. **Environment Variables**:
   Copy the example environment file and insert your active API Keys:
   ```bash
   cp .env.example .env
   # Add your ANTHROPIC_API_KEY
   ```

2. **Start Services**:
   Initiate the stack (Postgres + Redis + API + Next.js).
   ```bash
   docker compose up -d --build
   ```

3. **Accessing the Apps**:
   - Frontend Interface: [http://localhost:3030](http://localhost:3030)
   - Backend API: [http://localhost:8000](http://localhost:8000)
   - Swagger API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Stopping Services
To tear down the stack but preserve mounted volumes:
```bash
docker compose down
```