# DebateMeBro — Product Requirements Document

**Project:** DebateMeBro — AI-Powered Structured Debates That Steelman Both Sides  
**Team:** Jason Ingersoll, Shuai Ren  
**Course:** CS 7180 — AI-Assisted Coding (Spring 2026)  
**Date:** February 2026  
**Version:** 2.0

---

## 1. Problem Statement

Online discourse is broken. People strawman, argue in bad faith, and use rhetorical tricks instead of engaging with substance. When someone wants to understand both sides of a contentious issue, they have to wade through biased sources, social media shouting matches, and pundits who are incentivized to polarize rather than inform. There is no tool that shows what a genuinely good-faith argument looks like on both sides of a topic — one backed by real evidence, structured reasoning, and honest engagement with opposing views.

DebateMeBro solves this by letting two AI agents formally debate any user-submitted topic in real time, with each side required to steelman the other before rebutting. An AI judging panel scores both sides on a transparent rubric, giving users not just a debate, but a breakdown of where each argument is strong and where it's weak.

**Design Philosophy: No topic is off limits.** The platform does not filter, refuse, or reframe debate topics. The entire premise is that bad ideas lose when they're forced to defend themselves against the strongest possible counterarguments in a structured format with transparent scoring. Suppressing topics gives weak ideas the power of forbidden knowledge; debating them in the open exposes their weaknesses. The debate format and the judging rubric are the quality control mechanism — not content moderation.

---

## 2. Target Users

### The Frustrated Thinker
Someone sick of online discourse where people strawman and argue in bad faith. They want to see what a real argument looks like when you strip away ego and intellectual dishonesty. They use DebateMeBro to stress-test ideas and sharpen their own thinking.

### The Educator
A teacher who wants to demonstrate critical thinking and formal argumentation to students. They use DebateMeBro as a teaching tool to show what makes arguments logically sound versus just persuasive, using the rubric-based scoring and judge reasoning.

### The Civic Participant
Someone trying to form an informed opinion on a policy issue. They want to see the strongest case for each side before deciding where they stand, rather than being swayed by whichever side they heard from first.

---

## 3. User Stories (MoSCoW Prioritized)

### Must Have (MVP — Sprint 1)

**US-1: Preset Topic Debate**  
*As a frustrated thinker, I want to pick from a curated list of debate topics and watch two AI agents argue both sides in real time, so I can immediately see what genuine intellectual engagement looks like.*

Acceptance Criteria:
- [ ] Landing page displays 3 preset debate topics with brief descriptions
- [ ] Clicking a topic launches a debate with pre-loaded research for both sides
- [ ] Two AI agents debate using the 5-phase structure: Research Summary → Opening Arguments → Rebuttals → Closing Statements → Judging
- [ ] Arguments stream token-by-token in a split-screen view (Pro left, Con right)
- [ ] Each argument includes inline citations referencing the pre-loaded research
- [ ] Debate completes and transitions to the judging phase

**US-2: Live Debate Streaming**  
*As a civic participant, I want to watch the debate unfold in real time with clear visual structure, so I can follow the argument progression and see how each side responds to the other.*

Acceptance Criteria:
- [ ] Split-screen layout shows Pro (left, blue) and Con (right, red) agents
- [ ] Arguments stream token-by-token with a typing cursor animation
- [ ] Phase navigation bar shows progress: Research → Opening → Rebuttal → Closing → Judging
- [ ] Completed phases are clickable to review earlier arguments
- [ ] Transition messages explain what agents are doing between phases (e.g., "Evaluating opponent's opening argument...")
- [ ] Citations appear as clickable badges that expand to show source details

**US-3: User Authentication**  
*As a returning user, I want to log in so my debate history and votes are saved across sessions.*

Acceptance Criteria:
- [ ] User can register with email/password
- [ ] User can log in and receive a JWT token
- [ ] Authenticated routes are protected
- [ ] User can view their past debates on a dashboard

**US-4: Topic Analysis & Position Generation**  
*As a civic participant, I want the system to generate clear Pro and Con positions for any topic I enter, so the debate is well-structured from the start.*

Acceptance Criteria:
- [ ] System accepts any user-entered topic string — no topic filtering or refusal
- [ ] Claude Haiku analyzes the topic and returns: Pro/Con position statements, 3-5 argument dimensions, and an evidence landscape summary
- [ ] System generates the strongest possible framing for both sides, regardless of topic
- [ ] Generated positions are displayed for user review and editing before proceeding
- [ ] User can override or rewrite the generated positions

### Should Have (Sprint 2)

**US-5: Custom Topic via User-Supplied Research**  
*As a frustrated thinker, I want to debate a topic of my choice by uploading research I've gathered, so I'm not limited to the preset topics.*

Acceptance Criteria:
- [ ] User enters a custom debate topic
- [ ] System generates a high-quality research prompt tailored for the topic, with separate Pro and Con research directions
- [ ] User can copy the prompt to use with their preferred AI research tool (Claude Research, OpenAI Deep Research, etc.)
- [ ] User can upload the resulting research documents (text/PDF) for Pro and Con sides
- [ ] Uploaded research is parsed, chunked, and made available to both debate agents
- [ ] Debate proceeds using the uploaded research as the evidence base
- [ ] Both agents have access to all uploaded research (shared evidence pool)

**US-6: AI Judging Panel**  
*As an educator, I want a panel of AI judges to score both sides on a transparent rubric with visible reasoning, so I can use the scores as a teaching tool for what makes arguments strong or weak.*

Acceptance Criteria:
- [ ] Three AI judges evaluate the debate on four criteria: Logical Validity (30%), Evidence Quality (25%), Refutation Strength (25%), Steelmanning Quality (20%)
- [ ] Each judge provides chain-of-thought reasoning for its scores
- [ ] Judging runs with position-swapped evaluation (each judgment run twice with sides reversed)
- [ ] Inconsistent results between orderings are flagged
- [ ] Results display as a rubric breakdown with expandable judge reasoning

**US-7: Human Voting**  
*As a civic participant, I want to vote on who I think won the debate, so my perspective is part of the evaluation alongside the AI judges.*

Acceptance Criteria:
- [ ] Authenticated users can cast a vote for Pro or Con after the debate
- [ ] Vote tallies are displayed alongside AI judge scores
- [ ] Combined winner uses dynamic weighting (AI-heavy with few votes, human-heavy with 20+ votes)

**US-8: Debate Configuration**  
*As an educator, I want to configure debate settings like the number of rounds and format, so I can tailor the experience for my classroom needs.*

Acceptance Criteria:
- [ ] User can choose number of debate phases to include
- [ ] User can select debate format (Free-Form or Lincoln-Douglas structure)
- [ ] User can manually edit Pro/Con positions before starting
- [ ] Quick Start option uses smart defaults

### Could Have (Post-P2 / If Time Permits)

**US-9: Oxford-Style Opinion Shift**  
*As a civic participant, I want to record my opinion before and after the debate, so I can see whether the arguments actually changed my mind.*

Acceptance Criteria:
- [ ] Pre-debate poll captures For/Against/Undecided
- [ ] Post-debate poll captures the same
- [ ] Winner determined by largest net opinion shift
- [ ] Visual showing how opinions shifted

**US-10: Automated Research Pipeline**  
*As a user, I want the system to automatically research any topic I enter without me needing to supply external research, so I can get a fully automated debate experience.*

Acceptance Criteria:
- [ ] System runs automated web searches via Tavily API per argument dimension
- [ ] Results are classified by stance, strength, and argument role via Claude Haiku
- [ ] Each debater accesses only its assigned evidence pool plus shared sources
- [ ] Full pipeline runs without user intervention

### Won't Have (Out of Scope for P2)

- Consensus aggregation engine (Polis-style PCA clustering)
- AI candidate persona generation
- Multi-model debate (GPT-4o vs Claude) — single model with persona differentiation only
- Quadratic voting and Sybil resistance
- Consensus dashboard and radar charts
- C2PA Content Credentials / legal compliance tooling
- Mobile-first UI optimization

---

## 4. Research Strategy: Three-Tier Approach

The research phase is architecturally decoupled from the debate engine. The debate agents consume structured evidence documents regardless of how they were produced. This enables a phased rollout:

### Tier 1: Pre-Loaded Research (Sprint 1 — MVP)
The platform ships with 3 curated debate topics, each with pre-researched evidence documents for both sides. These documents are generated once during development using high-quality AI research tools (Claude Research Mode or OpenAI Deep Research) and stored as structured files. This eliminates all research API costs at runtime and guarantees high-quality evidence for the demo experience.

**Preset Topics (initial set):**
1. "Should the United States adopt universal healthcare?"
2. "Is remote work better than in-office work for knowledge workers?"
3. "Should AI-generated art be eligible for copyright protection?"

Each topic includes: a Pro research document (8-15 pages of sourced evidence), a Con research document (8-15 pages of sourced evidence), pre-generated position statements and argument dimensions.

### Tier 2: User-Supplied Research via Prompt Generation (Sprint 2)
For custom topics, the system generates a tailored research prompt that the user can take to any AI research tool. The workflow:
1. User enters a custom topic
2. System analyzes the topic (Claude Haiku) and generates argument dimensions
3. System produces two optimized research prompts — one for Pro evidence, one for Con evidence
4. User runs these prompts in their preferred research tool (Claude Research, OpenAI Deep Research, Perplexity, etc.)
5. User uploads the resulting research documents to the platform
6. System parses and chunks the uploaded research
7. Debate agents use the uploaded evidence as their shared knowledge base

This approach leverages the user's existing AI tool subscriptions, produces higher-quality research than a budget pipeline, and costs the platform nothing in API fees for the research phase.

### Tier 3: Automated Research Pipeline (Future Enhancement)
A fully automated pipeline using Tavily search + Claude Haiku classification (budget tier) or Claude Web Search (standard tier). This is architecturally designed but not implemented in P2. The evidence format consumed by the debate agents is identical across all three tiers, so adding automated research later requires no changes to the debate engine.

---

## 5. Debate Structure

Every debate follows a five-phase structure. Each phase has a distinct purpose and the agents' prompts are tailored accordingly.

### Phase 1: Research Display
The system shows what evidence is available to the agents. For preset topics, this displays a summary of the pre-loaded research. For custom topics, this shows the parsed content from user-uploaded documents.

### Phase 2: Opening Arguments
Each agent delivers a comprehensive opening statement presenting its case. The Pro agent goes first. The system prompt instructs each agent to: present their core thesis with supporting evidence, cite sources from the research documents, structure the argument logically with clear claims and warrants. Neither agent has seen the other's opening at this point.

### Phase 3: Rebuttals
Each agent receives the opponent's opening argument and constructs a targeted rebuttal. The system prompt requires agents to: explicitly steelman the opponent's strongest point before responding, address specific claims rather than general positions, introduce new evidence not used in the opening, identify the weakest element of the opponent's case.

### Phase 4: Closing Statements
Each agent delivers a final synthesis considering all previous arguments. The system prompt requires agents to: acknowledge where the opponent made strong points, identify where the debate narrowed and where genuine disagreement remains, make a final case for why their position is stronger overall, avoid simply restating earlier arguments.

### Phase 5: Judging
Three AI judges evaluate the complete debate transcript on a four-criterion rubric. Each judgment is run twice with position-swapped evaluation. Results are displayed with expandable reasoning.

---

## 6. Success Metrics

| Metric | Target | How Measured |
|--------|--------|-------------|
| Debate completes without error | 95%+ of initiated debates | Error logging + completion rate |
| Debate quality — no agreement spiraling | Agents maintain distinct positions throughout | Cosine similarity between final arguments stays below 0.85 |
| Judge consistency | Position-swapped judgments agree 60%+ | Automated comparison of swapped results |
| User engagement | Average user reads full debate | Time-on-page analytics |
| Streaming latency | First token within 2 seconds | Backend latency monitoring |
| Test coverage | 80%+ across unit, integration, E2E | CI pipeline coverage reporting |

---

## 7. Technical Constraints

### Tech Stack
- **Frontend:** Next.js 15+ (App Router), React, TailwindCSS, Zustand for state management
- **Backend:** FastAPI (Python), LangGraph for debate orchestration
- **Database:** PostgreSQL 16+ with pgvector extension
- **APIs:** Anthropic (Claude Haiku for topic analysis + Claude Sonnet for debate/judging)
- **Caching/Pub-Sub:** Redis (SSE fan-out, session state)
- **Streaming:** Server-Sent Events (SSE) for debate content
- **Auth:** JWT-based authentication
- **Deployment:** TBD (Vercel for frontend, Railway/Fly.io for backend)

### Timeline
- **Sprint 1 (Weeks 7-9):** Core debate loop with preset topics — topic selection, pre-loaded research, 5-phase debate with streaming, basic judging, minimal frontend, auth
- **Sprint 2 (Weeks 9-10):** Custom topics with user-supplied research, full judging panel with position swap, human voting, debate configuration, polished UI

### API Cost Constraints
- **Sprint 1 estimated cost per debate:** $0.15-$0.25 (no research API calls — pre-loaded evidence)
- **Sprint 2 estimated cost per debate:** $0.20-$0.35 (research prompt generation is cheap, user supplies their own research)
- Research phase API costs eliminated by design; users leverage their own AI tool subscriptions

---

## 8. Out of Scope

The following features are part of the long-term vision but explicitly excluded from P2:

- **Automated Research Pipeline:** Tavily/Claude web search integration is architecturally planned but not implemented. Pre-loaded research (preset topics) and user-supplied research (custom topics) cover the P2 scope.
- **Consensus Engine:** Polis-inspired opinion matrix, PCA clustering, and Condorcet aggregation.
- **AI Candidate Persona:** RAG-backed chatbot representing community consensus.
- **Multi-Provider Debate:** Different AI providers for Pro vs Con. Both sides use Claude with persona differentiation.
- **Document Upload for Evidence Injection:** Full RAG pipeline with chunking, embedding, and side-based access control. User-uploaded research in Sprint 2 uses a simpler approach — parsed text passed directly to agent prompts.
- **Advanced Anti-Gaming:** Quadratic voting, Sybil resistance, deliberation quality gates.
- **C2PA Content Credentials:** Legal compliance tooling.

---

## 9. Architecture Overview

### Three-Layer Architecture

**Presentation Layer (Next.js):** Handles UI, debate streaming display, voting interface, and configuration. Communicates with backend via SSE (debate streaming) and REST API (everything else).

**Orchestration Layer (FastAPI + LangGraph):** Manages the debate lifecycle as a state machine. Nodes: topic_selection → research_display → opening_arguments → rebuttals → closing_statements → judging → complete. Dispatches work to the intelligence layer and streams results to the frontend.

**Intelligence Layer (AI Providers):** Contains debate agents (Claude Sonnet with distinct personas), AI judges (Claude Sonnet with specialized rubric prompts), and topic analysis (Claude Haiku). Evidence is consumed from pre-loaded files or user uploads — not generated by the intelligence layer in P2.

### Evidence Flow
```
PRESET TOPICS:
  Pre-researched docs (stored as files) → Loaded into agent context → Debate

CUSTOM TOPICS (Sprint 2):
  User enters topic
    → Topic Analysis (Claude Haiku) → Argument dimensions
    → Research Prompt Generator → Two optimized prompts (Pro + Con)
    → User runs prompts externally → Uploads results
    → Parser extracts text → Loaded into agent context → Debate
```

### Debate State Machine (LangGraph)
```
topic_selection
  → research_display
    → opening_pro → opening_con
      → [agents evaluate opponent's opening]
        → rebuttal_pro → rebuttal_con
          → [agents consider all arguments]
            → closing_pro → closing_con
              → judging (3 judges × 2 orderings)
                → complete
```

### Project Structure
```
debate-platform/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Environment variables, API keys
│   │   ├── models/              # Pydantic models
│   │   │   ├── debate.py        # DebateState, DebateTurn, DebateConfig
│   │   │   ├── research.py      # ResearchDocument, TopicAnalysis
│   │   │   └── judging.py       # JudgeScore, RubricCriteria
│   │   ├── debate/              # Debate orchestration
│   │   │   ├── graph.py         # LangGraph state machine
│   │   │   ├── agents.py        # Pro/Con agent prompt construction
│   │   │   └── evidence.py      # Evidence loader (files + uploads)
│   │   ├── judging/             # AI judging panel
│   │   │   ├── panel.py         # Judge orchestration
│   │   │   ├── rubric.py        # Scoring rubric definitions
│   │   │   └── position_swap.py # Position-swapped evaluation
│   │   ├── topics/              # Topic management
│   │   │   ├── analysis.py      # Topic analysis via Claude Haiku
│   │   │   ├── prompts.py       # Research prompt generator
│   │   │   └── presets.py       # Preset topic loader
│   │   ├── routes/              # FastAPI route handlers
│   │   │   ├── debates.py       # CRUD, launch, stream endpoints
│   │   │   ├── topics.py        # Topic analysis, preset list
│   │   │   ├── research.py      # Upload research, get prompts
│   │   │   └── votes.py         # Voting endpoints
│   │   └── db/                  # Database layer
│   │       ├── database.py      # Connection pool, session management
│   │       └── tables.py        # SQLAlchemy table definitions
│   ├── evidence/                # Pre-loaded research documents
│   │   ├── healthcare/
│   │   │   ├── pro_research.md
│   │   │   └── con_research.md
│   │   ├── remote_work/
│   │   │   ├── pro_research.md
│   │   │   └── con_research.md
│   │   └── ai_copyright/
│   │       ├── pro_research.md
│   │       └── con_research.md
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/                     # Next.js App Router pages
│   │   ├── page.tsx             # Landing page with preset topics
│   │   ├── debates/
│   │   │   ├── new/page.tsx     # Custom topic setup
│   │   │   └── [id]/page.tsx    # Live debate view + results
│   │   └── dashboard/page.tsx   # User's debate history
│   ├── components/
│   │   ├── debate/              # DebateView, ArgumentCard, CitationBadge
│   │   ├── topics/              # TopicSelector, ResearchUpload
│   │   ├── judging/             # ScoreCard, RubricBreakdown, VotePanel
│   │   └── shared/              # StreamingText, PhaseNav, LoadingStates
│   └── lib/
│       ├── api.ts               # Backend API client
│       ├── sse.ts               # SSE connection handler
│       └── store.ts             # Zustand state management
├── docker-compose.yml           # PostgreSQL, Redis, backend, frontend
└── .env.example                 # API keys template
```
