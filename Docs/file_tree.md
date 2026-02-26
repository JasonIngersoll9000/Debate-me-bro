debate-me-bro/
│
├── .agent/                              # Antigravity workspace config
│   ├── rules/                           # Always-on passive guardrails (loaded every prompt)
│   │   ├── project-context.md           # Identity, stack, architecture, folder layout
│   │   ├── code-style.md               # Naming, typing, build order, testing conventions
│   │   ├── dos-and-donts.md            # MUST/NEVER rules, security
│   │   ├── scrum-workflow.md           # Branching, commits, PRs, sprint plan
│   │   └── plan-first.md              # "Plan before coding" guardrail
│   └── workflows/                       # On-demand /slash commands (loaded when triggered)
│       ├── onboard.md                   # /onboard — scan repo, suggest next task
│       ├── review.md                    # /review — adversarial two-pass code review
│       ├── test.md                      # /test — generate + run tests
│       ├── commit.md                    # /commit — semantic commit from staged diffs
│       ├── fix.md                       # /fix — structured debug protocol
│       ├── debate-turn.md              # /debate-turn — implement/debug a debate phase
│       └── ui-check.md                 # /ui-check — visual verification vs mockup
│
├── .github/
│   └── pull_request_template.md         # PR template with checklist
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                      # FastAPI entry point, CORS, lifespan, route registration
│   │   ├── config.py                    # pydantic-settings: env vars, API keys, tier selection
│   │   │
│   │   ├── models/                      # Pydantic schemas (request/response/internal state)
│   │   │   ├── __init__.py
│   │   │   ├── debate.py                # DebateState, DebateTurn, DebateConfig, DebatePhase
│   │   │   ├── research.py              # ResearchDocument, TopicAnalysis, ArgumentDimension
│   │   │   └── judging.py               # JudgeScore, RubricCriteria, JudgingResult
│   │   │
│   │   ├── debate/                      # Core debate orchestration
│   │   │   ├── __init__.py
│   │   │   ├── graph.py                 # LangGraph state machine definition
│   │   │   ├── agents.py               # Pro/Con agent system prompts + prompt construction
│   │   │   └── evidence.py             # Evidence loader (pre-loaded files + uploaded docs)
│   │   │
│   │   ├── judging/                     # AI judging panel
│   │   │   ├── __init__.py
│   │   │   ├── panel.py                 # Orchestrates 3 judges × 2 orderings
│   │   │   ├── rubric.py               # Rubric criteria definitions and weights
│   │   │   └── position_swap.py        # Runs eval in both orderings, checks consistency
│   │   │
│   │   ├── topics/                      # Topic management
│   │   │   ├── __init__.py
│   │   │   ├── analysis.py             # Topic analysis via Claude Haiku
│   │   │   ├── prompts.py              # Research prompt generator for custom topics
│   │   │   └── presets.py              # Loads preset topics + pre-researched evidence
│   │   │
│   │   ├── auth/                        # Authentication
│   │   │   ├── __init__.py
│   │   │   ├── router.py               # POST /auth/register, POST /auth/login
│   │   │   ├── service.py              # Password hashing, JWT creation/validation
│   │   │   └── dependencies.py         # get_current_user FastAPI dependency
│   │   │
│   │   ├── routes/                      # Thin FastAPI route handlers
│   │   │   ├── __init__.py
│   │   │   ├── debates.py              # POST /debates, GET /debates/{id}, GET /debates/{id}/stream
│   │   │   ├── topics.py              # GET /topics/presets, POST /topics/analyze
│   │   │   ├── research.py            # POST /research/upload, GET /research/prompt/{topic_id}
│   │   │   └── votes.py               # POST /votes, GET /votes/{debate_id}
│   │   │
│   │   └── db/                          # Database layer
│   │       ├── __init__.py
│   │       ├── database.py             # Async engine, session factory (asyncpg)
│   │       ├── tables.py              # SQLAlchemy ORM model definitions
│   │       └── migrations/             # Alembic migrations directory
│   │           ├── env.py
│   │           ├── alembic.ini
│   │           └── versions/
│   │
│   ├── evidence/                        # Pre-loaded research documents (checked into git)
│   │   ├── healthcare/
│   │   │   ├── pro_research.md
│   │   │   └── con_research.md
│   │   ├── remote_work/
│   │   │   ├── pro_research.md
│   │   │   └── con_research.md
│   │   └── ai_copyright/
│   │       ├── pro_research.md
│   │       └── con_research.md
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py                  # Shared fixtures: test DB, mock Anthropic client
│   │   ├── unit/
│   │   │   ├── __init__.py
│   │   │   ├── test_models.py
│   │   │   ├── test_agents.py
│   │   │   ├── test_evidence.py
│   │   │   └── test_rubric.py
│   │   └── integration/
│   │       ├── __init__.py
│   │       ├── test_debates.py
│   │       └── test_auth.py
│   │
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── app/                             # Next.js App Router
│   │   ├── page.tsx                     # Landing page: preset topics + topic input
│   │   ├── layout.tsx                   # Root layout, nav, theme, font
│   │   ├── globals.css                  # Tailwind imports + base styles
│   │   ├── debates/
│   │   │   ├── new/
│   │   │   │   └── page.tsx             # Custom topic setup + research upload (Sprint 2)
│   │   │   └── [id]/
│   │   │       └── page.tsx             # Live debate view + results + voting
│   │   └── dashboard/
│   │       └── page.tsx                 # User's debate history (authenticated)
│   │
│   ├── components/
│   │   ├── debate/
│   │   │   ├── DebateView.tsx
│   │   │   ├── ArgumentCard.tsx
│   │   │   ├── CitationBadge.tsx
│   │   │   ├── StreamingText.tsx
│   │   │   └── PhaseNav.tsx
│   │   ├── topics/
│   │   │   ├── TopicSelector.tsx
│   │   │   ├── TopicInput.tsx
│   │   │   └── ResearchUpload.tsx
│   │   ├── judging/
│   │   │   ├── ScoreCard.tsx
│   │   │   ├── RubricBreakdown.tsx
│   │   │   ├── VotePanel.tsx
│   │   │   └── JudgeReasoning.tsx
│   │   └── shared/
│   │       ├── LoadingStates.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── Navbar.tsx
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   ├── sse.ts
│   │   └── store.ts
│   │
│   ├── tests/
│   │   ├── components/
│   │   │   ├── ArgumentCard.test.tsx
│   │   │   ├── PhaseNav.test.tsx
│   │   │   └── StreamingText.test.tsx
│   │   └── e2e/
│   │       └── preset-debate.spec.ts
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── next.config.ts
│
├── docs/
│   ├── PRD.md                           # Product Requirements Document (v2)
│   └── mockup-screenshots/              # Screenshots of Claude prototype
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
└── LICENSE