---
trigger: always_on
glob: "**/*"
description: Do's and Don'ts, security, and accessibility rules for DebateMeBro.
---

## Do's and Don'ts

This file encodes **hard constraints and strong preferences** for how DebateMeBro should be implemented and evolved. Treat the DO items as commitments and the DON'T items as guardrails you should not cross without an explicit issue or PRD update.

### 1. General Project Practices

**DO**

- DO **read the PRD** (`Docs/debatemebro-prd.md`) and the relevant GitHub Issue(s) (`Docs/Github_Issues.md`) before making substantial changes.
- DO keep the system aligned with the three-layer architecture:
  - Presentation (Next.js) → Orchestration (FastAPI + LangGraph) → Intelligence (Claude).
- DO keep functions, components, and modules **small and well-focused**.
- DO add or update tests whenever behavior changes, aiming to maintain **≥ 80% coverage**.
- DO write clear commit messages and PR descriptions that tie back to issues and acceptance criteria.

**DON'T**

- DON'T introduce **major new features** that are not in the PRD or Issues without also updating those documents.
- DON'T bypass the debate state machine by stuffing complex logic directly into FastAPI routes.
- DON'T leave large blocks of commented-out or dead code.
- DON'T silently change user-facing copy that is used in the mockup and PRD without updating those docs.

### 2. Frontend: Patterns and Dependencies

**DO**

- DO use **Next.js App Router**, React, and TypeScript as the core frontend stack.
- DO use **TailwindCSS** for styling and layout; mirror the dark-theme, gradient-heavy style from the mockup.
- DO use **Zustand** for client-side global state; keep its usage in `frontend/lib/store.ts` (or equivalent).
- DO reuse and extend existing components in `frontend/components/**` (`debate`, `topics`, `judging`, `shared`) before creating new ones.
- DO follow accessibility best practices:
  - Ensure interactive elements are reachable by keyboard (focusable, proper semantics).
  - Use accessible roles and labels where appropriate (`button`, `link`, `aria-label`, etc.).
  - Maintain good color contrast on dark backgrounds.

**DON'T**

- DON'T introduce alternative frontend frameworks or heavy UI libraries (e.g., MUI, Chakra) unless a new issue/PRD explicitly calls for them.
- DON'T invent new global state solutions (Redux, MobX, etc.) when Zustand is sufficient.
- DON'T hard-code API URLs or secrets into components; keep config in environment variables and shared config modules.
- DON'T break the **split-screen debate layout** or the **five-phase navigation** without a good reason tied to PRD updates.

### 3. Backend: Patterns and Dependencies

**DO**

- DO keep FastAPI route handlers **thin** and delegate logic to:
  - `debate/` (state machine, agents, evidence),
  - `judging/` (panel, rubric, position swap),
  - `topics/` (analysis, prompts, presets),
  - `db/` (database interactions).
- DO use **LangGraph** to manage debate phases and transitions, rather than ad-hoc control flow.
- DO represent DB interactions through SQLAlchemy models and migrations defined in `db/` + Alembic.
- DO centralize configuration in `config.py` using `pydantic-settings` and `.env` variables.
- DO mock external services (Anthropic, Redis) in unit tests; use fixtures in `tests/conftest.py`.

**DON'T**

- DON'T talk directly to AI providers (Anthropic, etc.) from arbitrary modules; centralize such calls in well-defined services.
- DON'T perform raw SQL or direct connection handling scattered across the codebase; use the existing database abstractions.
- DON'T couple debate logic tightly to HTTP endpoints; keep orchestration in the LangGraph graph/state structures.

### 4. Security Requirements

**DO**

- DO follow the security assumptions baked into the auth issues:
  - Hash passwords using **passlib bcrypt**.
  - Use **JWT** for authentication, and validate tokens in `get_current_user`.
- DO treat environment variables (API keys, secrets) as sensitive:
  - Load via `config.py` and `.env` files (see `.env.example`).
  - Never log secret values.
- DO validate inputs on public endpoints:
  - Use Pydantic models for request bodies.
  - Enforce type and range constraints where appropriate.

**DON'T**

- DON'T store plaintext passwords or secret tokens in the database, logs, or code.
- DON'T expose internal identifiers or implementation details in error messages.
- DON'T bypass authentication/authorization on routes that should be protected (e.g., voting, dashboard, user history).

### 5. Accessibility and UX Requirements

**DO**

- DO ensure important flows (preset debate, custom topic, judging, voting) are **navigable by keyboard** and screen reader friendly.
- DO use semantic HTML elements (`button`, `nav`, `main`, headings) to structure pages logically.
- DO provide user feedback:
  - Loading indicators while streaming or fetching data.
  - Error messages when network or server issues occur.
  - Clear call-to-action buttons (e.g., “Debate It →”).

**DON'T**

- DON'T rely solely on color to convey critical information (e.g., Pro vs Con should use color + labels).
- DON'T introduce intrusive animations that make the debate hard to follow; keep animations subtle and meaningful (e.g., streaming cursor, live badges).

### 6. Tests and Quality

**DO**

- DO treat tests as part of the feature, not an optional extra:
  - For backend work, add/extend pytest unit or integration tests under `backend/tests/**`.
  - For frontend work, add/extend component tests and e2e tests under `frontend/tests/**`.
- DO use acceptance criteria from `Docs/Github_Issues.md` to derive test cases.

**DON'T**

- DON'T land changes that significantly alter behavior without corresponding tests.
- DON'T reduce overall test coverage below the PRD target (~80%) without a clear, temporary rationale documented in the PR.

