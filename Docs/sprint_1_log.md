# Sprint 1 Log & Retrospectives

## Sprint 1 Planning
**Goal:** Build the core 7-phase debate pipeline, streaming functionality, and basic judging with pre-loaded topics.
**Duration:** Up to Week 9 deadline.

### Key Objectives (From PRD)
- US-1: Preset Topic Debate
- US-2: Live Debate Streaming
- US-3: AI Judging
- US-4: User Dashboard (History)
- US-6: Specialized AI Personas
- US-7: Robust Steelmanning

### Issues in Scope
- Set up project scaffolding and Docker Compose
- Database schema and Pydantic models
- User authentication (register + login + JWT)
- Preset topics and evidence loader
- LangGraph debate state machine
- Dynamic persona generation + debate agent prompts
- SSE streaming endpoint for debate
- Frontend – Landing page with preset topics
- Frontend – Live debate view with streaming
- Basic AI judging (single judge, no position swap)

---

## Issue Retrospectives

### Set up project scaffolding and Docker Compose
**Status:** Completed
**What Went Well:**
- We successfully identified the tools needed (PostgreSQL with `pgvector`, Redis, FastAPI, Next.js) and configured the `docker-compose.yml` for them to run locally.
- Backend dependencies were efficiently containerized using a multi-stage approach.

**Challenges & Insights:**
- **Postgres Version Mismatch:** The initial `ankane/pgvector:v0.5.1` image defaulted to PostgreSQL 15, but our PRD mandates PostgreSQL 16+. We quickly identified the mismatch via container logs and swapped to `pgvector/pgvector:pg16` to ensure compatibility with all modern vector operations.
- **Docker Desktop Port Proxying Bug:** We encountered a persistent port conflict on `localhost:3000` commonly affecting Docker Desktop on Windows. Instead of repeatedly force-killing local processes, we adapted to the environment by definitively remapping the frontend container port to `localhost:3030`. Being proactive about mapping bypasses resulted in a more stable local environment.

**Action Items for Next Issues:**
- Always explicitly check container/dependency version outputs against PRD strict requirements early in the startup phase.
- Document any required environmental port mappings immediately in the `README.md` to prevent onboarding friction.

### Database schema and Pydantic models
**Status:** Completed
**What Went Well:**
- Mapping backend Python objects to Postgres tables via `SQLAlchemy`, and applying standard HTTP validation schemas dynamically correctly bridged internal structures to external API interfaces inside `app.db.models` and `app.models.schemas`.
- Migrations effectively picked up the generated `SQLAlchemy` metadata after wiring `env.py`.

**Challenges & Insights:**
- **pgvector Extension Creation Issue**: Initial `alembic --autogenerate` commands did not explicitly command postgres to `CREATE EXTENSION IF NOT EXISTS vector`. Migrations without this explicit addition in `upgrade()` would crash. This reinforcement of manually inspecting output migrations before running `upgrade head` mitigated a silent deployment threat. 
- **Offline Alembic Initialization Paths**: Running `alembic init` generated files in paths interpreted strictly against the container runtime (`/app`), placing them outside standard repository root contexts. Refactoring moving those to the host's standard `backend/app/db/migrations` path preserved our internal git standards. 

**Action Items for Next Issues:**
- Continue running `alembic` commands relative to the `backend` Docker runtime, but manually verify that created script destinations map to expected physical paths in the repository.
- Continue to manually inspect all Auto-Generated Alembic Scripts.

### User authentication (register + login + JWT)
**Status:** Completed
**What Went Well:**
- Implemented `/api/auth/register` and `/api/auth/login` cleanly leveraging FastAPI's `OAuth2PasswordBearer` and PyJWT.
- Successfully built end-to-end integration tests using `httpx.AsyncClient` alongside `pytest-asyncio`.

**Challenges & Insights:**
- **Passlib/Bcrypt Version Conflict**: Modern `bcrypt` (version 4.0+) enforces a strict 72-byte maximum length and raises a `ValueError` for longer strings. Passlib attempts to hash a 255-byte string internally to detect an old BSD wraparound bug upon initialization, which immediately crashes the application. We resolved this by explicitly pinning `bcrypt==3.2.2` in `requirements.txt`.
- **SQLAlchemy Scalar Evaluation**: Implicitly checking truth values of SQLAlchemy result objects (`if result.scalars().first():`) can throw an ambiguous context `ValueError`, especially within environments running custom binary extensions like pgvector. We fixed this by assigning the object and explicitly checking `user is not None`.

**Action Items for Next Issues:**
- Always ensure legacy security dependencies (like passlib) are pinned against known stable sub-tier versions (like bcrypt 3.2.2).
- Always use explicit `is None` or `is not None` context evaluations on objects extracted from SQLAlchemy queries.

### Preset topics and evidence loader
**Status:** Completed
**What Went Well:**
- Seamlessly extended the predefined `schemas.py` without interfering with prebuilt Alembic SQL migrations. The Pydantic isolation is proving highly modular.
- The `EvidenceLoader` Regex parser implementation worked perfectly inside the Pytest Async runner on the very very first execution without throwing typing issues or dropping complex string citations.

**Challenges & Insights:**
- I opted for strict Regex `\[([^\]]+)\]\(([^\)]+)\)` mapping over a Heavy Markdown AST Parser (`markdown-it-py`). Because our generated LLM research documents use explicit, simplistic citation link formatting natively, dropping the heavy python dependency keeps processing lightning fast prior to LangGraph ingestions.

**Action Items for Next Issues:**
- Continue maintaining separate routing tables (`topics.py` vs `auth.py`) mapped to unified endpoints in `main.py`! The FastAPI structure scale is holding perfectly.
