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

### Issue #5: LangGraph debate state machine
**Status:** Completed
**What Went Well:**
- Isolated the pure sequential flow of our 7-phase debate into 10 explicit LangGraph nodes. This structure guarantees that transitions like `opening_pro` -> `opening_con` execute flawlessly before agents are even attached.
- Successfully implemented DB synchronization callbacks so the physical PostgreSQL row (`status`) updates precisely as the StateGraph moves.

**Challenges & Insights:**
- I opted to explicitly write unit tests mapping the `debate_turns` array mutations first, simulating the LLM with placeholder strings. This test-driven approach proved we were appending histories correctly prior to dealing with complex Anthropic logic.

**Action Items for Next Issues:**
- Issue #6 will plug directly into these 10 empty state machine nodes and replace the placeholders with `langchain-anthropic` models interacting with structured personas.

### Issue #6: Dynamic persona generation + debate agent prompts
**Status:** Completed
**What Went Well:**
- Implemented `generate_persona` using Claude 3 Haiku for high-speed, dynamic character generation tailored directly to the `(topic, side)` parameters.
- LangChain's `SystemMessage` / `HumanMessage` encapsulation provided immediate logical splits between absolute system-level rules (like Steelmanning / Persona Voice constraints) and dynamic local inputs (Opponent Histories / Evidence Bundles).
- Refactored our `agents.py` and `graph.py` pipeline using GitHub Copilot's review suggestions to effectively run internal evaluations concurrently via `asyncio.gather`, slashing execution latency.

**Challenges & Insights:**
- **Context Leaks:** Our initial tests proved that the Language Models were leaking their internal, invisible `eval` turning notes directly to their opponents during Rebuttal/Closing rounds. Copilot flagged this, and we implemented strict `is_internal` boolean filtering on our array structures.
- **Async Mocking:** Testing the LLMs requires rigorous understanding of `AsyncMock` behaviors interacting heavily with Python's `await` loops inside heavily mocked `@patch` structures. Testing the LLMs is infinitely harder than calling the LLMs.

**Action Items for Next Issues:**
- Now that agents autonomously reason asynchronously across our LangGraph architecture, Issue #7 revolves entirely around opening up the SSE interface pipeline to begin actively streaming those generated tokens sequentially directly to external consumers.

### Issue #7: SSE streaming endpoint for debate
**Status:** Completed
**What Went Well:**
- Implemented `stream_debate_events()` as a highly resilient asynchronous generator interpreting the raw outputs from LangGraph's `.astream_events(version="v2")`.
- Cleanly separated FastAPI's `StreamingResponse` routing logic allowing UI architectures standard SSE compatibility (`text/event-stream`).

**Challenges & Insights:**
- Mocking a full end-to-end `httpx.AsyncClient` parsing `data:` structs inside local `pytest` pipelines requires strict control over how `event["metadata"]["langgraph_node"]` transitions are fired natively during `.astream_events()`. Once mapped appropriately, HTTpx validated the entire flow effortlessly.

**Action Items for Next Issues:**
- We are ready to consume this endpoint. The backend pipeline logic is formally completed for the core debate loop. Issue #8 will shift into Next.js and Tailwind to construct the User Interface for displaying it.
