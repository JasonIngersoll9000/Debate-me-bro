# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DebateMeBro is an AI-powered debate platform where two Claude agents argue opposing sides of a topic. Users watch the live-streamed debate, then vote on the winner judged by three AI judges (Logic, Evidence, Engagement).

---

## Commands

### Backend (Python / FastAPI)

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Run dev server
uvicorn app.main:app --reload --port 8000

# Tests
pytest                          # all tests
pytest tests/unit/              # unit only
pytest tests/integration/       # integration only
pytest -v --cov                 # verbose + coverage
pytest tests/unit/test_agents.py::test_name  # single test
# Note: asyncio_mode = auto in pytest.ini — do NOT add @pytest.mark.asyncio to async tests
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev        # port 3000
npm run build
npm run lint
npm test           # Jest
npm run test:coverage
```

### Docker (All Services)

```bash
docker compose up -d --build   # frontend :3030, backend :8000, postgres, redis
docker compose down
# Swagger docs: http://localhost:8000/docs
```

---

## Architecture

### Three Layers

1. **Frontend** — Next.js 15 + React + TailwindCSS + Zustand
2. **Orchestration** — FastAPI + LangGraph state machine + SSE streaming
3. **Intelligence** — Anthropic Claude Haiku (analysis), Claude Sonnet (debate/judging)

### Backend Debate Pipeline

The core is a LangGraph directed graph in `backend/app/debate/graph.py` with 10 nodes running in order:

```
research_consultation → opening_pro → opening_con → eval_openings
→ rebuttal_pro → rebuttal_con → eval_full_debate
→ closing_pro → closing_con → judging
```

- `stream.py` — orchestrates full debate lifecycle, enforces usage cap, emits SSE events
- `agents.py` — wraps Claude API calls with persona injection and prompt templates
- `evidence.py` — loads pre-researched evidence bundles from `backend/evidence/`
- `persona_generator.py` — generates unique debater personas per debate
- `judging/panel.py` — 3 parallel judge agents (logic, evidence, engagement) score and return structured JSON

### SSE Event Types

The backend emits 9 event types over the SSE stream:
`content`, `phase_transition`, `personas`, `evidence_loaded`, `internal_content`, `judging_results`, `mode`, `complete`, `error`

Frontend consumes these via `EventSource` and writes directly to Zustand store.

### Frontend State

Single Zustand store in `frontend/src/lib/store.ts`. Key shape:
- `topicId`, `topicTitle`, `activePhase`
- `debateTurns` — all streamed argument content
- `internalAnalysis` — eval nodes (not shown to user during debate)
- `personas`, `evidenceBundle`, `judgingResults`
- `completedPhases`, `isStreaming`

React components subscribe with `useDebateStore()` + `useShallow`.

### Cache-First Flow

1. `GET /api/debates/{id}` — checks PostgreSQL `cached_debate` table
2. If cached: replays JSON instantly (no SSE, no AI calls)
3. If not cached: opens SSE, runs full LangGraph pipeline, saves result to DB

### Auth & Usage Cap

- JWT tokens via passlib/bcrypt; `get_current_user` FastAPI dependency
- SSE accepts JWT via `?token=` query param (EventSource API limitation)
- `MAX_DEBATES_PER_USER` env var caps live debate generation; replayed debates are free
- `ADMIN_EMAILS` comma-separated list exempt from cap
- `GET /api/debates/usage` returns quota info for the current user

### Database

- PostgreSQL 16 + pgvector; SQLAlchemy async ORM + Alembic migrations
- Tables auto-created on startup via `Base.metadata.create_all()`
- Redis (`redis:7-alpine`) available for session state
- Custom topic metadata stored as JSON files in `backend/data/topics/`

---

## Key Configuration

All env vars defined in `.env.example`, loaded via `pydantic-settings` in `backend/app/config.py`:

| Var | Purpose |
|-----|---------|
| `DEBATE_MODE` | `demo` (mock) or `live` (real Claude) |
| `ANTHROPIC_API_KEY` | Claude API key |
| `DATABASE_URL` | PostgreSQL connection string |
| `MAX_DEBATES_PER_USER` | Usage cap (default 5) |
| `ADMIN_EMAILS` | Comma-separated admin emails exempt from cap |
| `SECRET_KEY` | JWT signing key |

---

## Branch and Commit Conventions

**Active development branch:** `develop` — all PRs target `develop`, never `main`
**`main` is frozen** for grading. Do not push or open PRs to `main`.

**Branch naming:** `feature/<issue>-<kebab-desc>`, `bugfix/<issue>-<desc>`, `chore/<issue>-<desc>`

**Commit format:** `<type>(<scope>): <description> (#<issue>)`
- Types: `feat`, `fix`, `chore`, `docs`, `test`
- Scopes: `frontend`, `backend`, `db`, `infra`, `docs`

---

## Project Skills

12 custom skills in `.claude/skills/` — invoke with `/skill-name`:
`/start-session`, `/end-session`, `/pick-issue`, `/new-work`, `/gen-tests`,
`/quality-gate`, `/quality-fix`, `/validate-prompts`, `/test-debate-graph`,
`/debug-stream`, `/sprint-standup`, `/create-sprint-issues`

---

## Rules

- Read GitHub Issues before substantial changes; PRD is in `Docs/debatemebro-prd.md`
- Keep 3-layer boundaries clean — no ad-hoc AI calls outside the graph, no state managers other than Zustand
- Don't hard-code API URLs in components — use `frontend/src/lib/api.ts`
- Mock external APIs (Anthropic, DB) in unit tests; integration tests hit real services
- `DEBATE_MODE=demo` must work without any API keys
- Maintain split-screen debate layout and 5-phase navigation — these are core UX constraints
