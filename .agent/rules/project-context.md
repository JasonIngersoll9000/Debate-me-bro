---
trigger: always_on
glob:
description:
---

## DebateMeBro — Project Context

This file gives AI assistants the **minimum shared context** they must load into working memory before making non-trivial changes. It summarizes the tech stack, architecture, naming/coding standards, and testing strategy. For full details, always cross-check:

- `Docs/debatemebro-prd.md`
- `Docs/file_tree.md`
- `Docs/Github_Issues.md`

### 1. Tech Stack and Versions

- **Frontend**
  - Framework: **Next.js 15+ (App Router)**, React, TypeScript
  - Styling: **TailwindCSS**
  - State management: **Zustand** for client-side state
  - Streaming: **SSE client** utilities in `frontend/*/sse.ts`
  - See `frontend/package.json` for exact versions.

- **Backend**
  - Framework: **FastAPI** (Python)
  - Orchestration: **LangGraph** for debate state machine
  - Models: **Pydantic** / `pydantic-settings`
  - DB: **PostgreSQL 16+** with **pgvector**
  - ORM & migrations: **SQLAlchemy** + **Alembic**
  - Caching / pub-sub: **Redis**
  - AI APIs: **Anthropic** (Claude Haiku for topic analysis, Claude Sonnet for debate + judging)
  - See `backend/requirements.txt` for concrete Python dependencies.

### 2. Architecture Overview

High-level layout (details in `Docs/file_tree.md`):

- **Backend (`backend/`)**
  - `app/main.py`: FastAPI entry; CORS, lifespan, route registration.
  - `app/models/`: Pydantic schemas for debates, research, judging.
  - `app/debate/`: Debate orchestration:
    - `graph.py`: LangGraph state machine for phases.
    - `agents.py`: Pro/Con agent prompt construction.
    - `evidence.py`: Evidence loader (pre-loaded + uploaded).
  - `app/judging/`: AI judging panel logic (panel, rubric, position swap).
  - `app/topics/`: Topic analysis, prompt generation, preset topics.
  - `app/routes/`: Thin FastAPI route handlers (`debates`, `topics`, `research`, `votes`).
  - `app/auth/`: JWT auth: register/login, password hashing, dependencies.
  - `app/db/`: DB engine, tables, migrations.
  - `evidence/`: Pre-loaded research docs per preset topic.
  - `tests/`: `unit/` + `integration/` tests.

- **Frontend (`frontend/`)**
  - `app/` (Next.js App Router):
    - `page.tsx`: Landing page with preset topics + topic input.
    - `debates/new/page.tsx`: Custom topic setup + research upload (Sprint 2).
    - `debates/[id]/page.tsx`: Live debate view + results + voting.
    - `dashboard/page.tsx`: User debate history (authenticated).
  - `components/`:
    - `debate/`: `DebateView`, `ArgumentCard`, `CitationBadge`, `StreamingText`, `PhaseNav`.
    - `topics/`: `TopicSelector`, `TopicInput`, `ResearchUpload`.
    - `judging/`: `ScoreCard`, `RubricBreakdown`, `VotePanel`, `JudgeReasoning`.
    - `shared/`: `LoadingStates`, `ErrorBoundary`, `Navbar`.
  - `lib/`: `api.ts`, `sse.ts`, `store.ts` (Zustand).
  - `tests/`: Component tests + e2e tests (preset debate flow).

- **Docs (`Docs/` or `docs/`)**
  - `Docs/debatemebro-prd.md` (or `docs/PRD.md`): Product Requirements Document v2.
  - `Docs/Github_Issues.md`: Canonical issue descriptions + acceptance criteria.
  - `Docs/file_tree.md`: Target project structure (this file mirrors its intent).
  - `Docs/debatemebro-mockup.tsx` and/or `docs/mockup-screenshots/`: Design prototypes.

Key architectural patterns:

- **Three-layer architecture** (see PRD §9):
  - Presentation (Next.js) → Orchestration (FastAPI + LangGraph) → Intelligence (Claude).
- **State machine–driven debate**:
  - Phases: research_display → opening → rebuttal → closing → judging → complete.
- **Evidence decoupled from debate engine**:
  - Debate agents consume structured evidence docs regardless of whether they come from pre-loaded files or user uploads.

### 3. Naming Conventions and Coding Standards (High Level)

For detailed style rules, see `.agent/rules/code-style.md` (when present). At minimum, assistants must follow:

- **General**
  - Prefer clear, descriptive names over abbreviations.
  - Keep functions and components **small and single-purpose**.
  - Avoid dead code, commented-out blocks, and unused parameters.

- **TypeScript / React (frontend)**
  - Components: **PascalCase** (`DebateView`, `ScoreCard`).
  - Hooks: `useXxx` (`useDebateStore`).
  - Files:
    - Components: `ComponentName.tsx`.
    - Hooks/utilities: `useThing.ts`, `thingUtils.ts`.
  - Use **functional components** and React hooks (no class components).
  - Prefer **composition** over inheritance.
  - Use **Zustand** for shared client-side state instead of adding new global state libraries.

- **Python (backend)**
  - Modules: `snake_case.py`.
  - Classes: `PascalCase` (`DebateState`, `JudgeScore`).
  - Functions and variables: `snake_case`.
  - Keep FastAPI routes **thin**; move business logic to `debate/`, `judging/`, `topics/`, `db/`.

### 4. Testing Strategy

The PRD sets an explicit **test coverage goal of ≥ 80%** across unit, integration, and E2E tests. Assistants must treat tests as first-class, not an afterthought.

- **Backend**
  - Framework: **pytest**.
  - Test layout:
    - `backend/app/tests/unit/`: Model validation, prompt construction, evidence parsing, rubric logic.
    - `backend/app/tests/integration/`: End-to-end API behaviors (debate lifecycle, auth, SSE streaming) with external services mocked.
  - Patterns:
    - Use fixtures in `conftest.py` for DB/session and Anthropic client mocks.
    - Mock external APIs (Anthropic, Redis) in unit tests; only integration tests may touch more realistic wiring.

- **Frontend**
  - Component tests:
    - Use React Testing Library + a modern test runner (Jest or Vitest) for UI components under `frontend/tests/components/`.
    - Focus on behavior and accessibility (what the user sees / can do), not implementation details.
  - E2E tests:
    - Use Playwright (or equivalent) under `frontend/tests/e2e/` for full debate flows (preset topic selection → streaming → judging → voting).

- **General testing rules**
  - New features that change behavior must come with **at least one** test at an appropriate level.
  - When modifying existing code, **update or add tests** to cover the new behavior and maintain the 80%+ coverage target.
  - Prefer **small, focused tests** tied to acceptance criteria from `Docs/Github_Issues.md` and user stories from the PRD.

