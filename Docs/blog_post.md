# Building DebateMeBro: How We Built an AI Debate Platform That Forces Good-Faith Arguments

*By Jason Ingersoll and Shuai Ren — CS 7180: AI-Assisted Coding, Spring 2026*

---

## The Problem: Online Discourse Is Broken

Spend five minutes on any social media platform and you'll see it: strawman arguments, bad-faith rhetoric, cherry-picked statistics, and people talking past each other. When someone wants to genuinely understand both sides of a contentious issue — healthcare policy, AI ethics, economic theory — they're forced to navigate a minefield of bias, motivated reasoning, and outright misinformation.

The fundamental problem isn't that people disagree. It's that our current tools for disagreement are terrible. Comment sections reward dunks over depth. Cable news rewards polarization over nuance. Even formal debate formats often devolve into rhetorical tricks rather than genuine engagement with opposing ideas.

We asked ourselves: **What would it look like if two debaters were forced to be intellectually honest?** What if, before attacking an opponent's argument, you had to first prove you understood it at its strongest? What if every claim had to be backed by cited evidence? What if the judges explained exactly why they scored each side the way they did?

That's what DebateMeBro does.

---

## Our Solution: Structured AI Debate with Steelmanning

DebateMeBro is a full-stack web application where two AI agents debate any topic in real time through a structured 7-phase pipeline. The key innovation is the **steelmanning requirement**: before rebutting an opponent, each agent must articulate the strongest version of the other side's argument. This isn't optional — it's enforced in the system prompts that govern each debate phase.

The platform generates unique AI personas for each debate, complete with specific expertise, values, and rhetorical styles. Both agents receive the same body of research evidence (mirroring real competitive debate where both teams research the same topic), and a panel of three specialized AI judges scores the debate on a transparent rubric.

Our design philosophy is deliberately provocative: **no topic is off limits.** We don't filter, refuse, or editorialize debate topics. The premise is that bad ideas lose when forced to defend themselves against the strongest possible counterarguments. The structured format and transparent judging are the quality control — not content moderation.

---

## Walking Through the Application

When a user opens DebateMeBro, they land on a dark-themed homepage with preset debate topics — each displayed as a card with the resolution, pro/con positions, and a "Debate It" button. Users can also type any custom topic into a search bar.

### Preset Topics: One Click to Launch

Clicking a preset topic (like "Should the United States adopt universal healthcare?") kicks off the full pipeline. The backend generates two unique personas — not "Pro Bot" and "Con Bot," but characters like "Dr. Elena Vasquez, Health Policy Researcher" with specific expertise areas, core values, and rhetorical approaches. An animated overlay reveals these personas before the debate begins, letting users meet the debaters.

### Custom Topics: Research Prompt Generation

For custom topics, the user enters any resolution they want debated. Claude Haiku analyzes the topic and generates structured research prompts — one for the Pro side, one for the Con side. These prompts are designed to be run in any AI research tool (Claude Research Mode, ChatGPT Deep Research, Perplexity). The user copies the prompts, runs them externally, and uploads the resulting research documents. This approach leverages the user's own AI subscriptions while ensuring high-quality, balanced evidence.

### The Debate Itself

Once launched, the debate streams token-by-token in a split-screen layout: Pro arguments in blue on the left, Con in red on the right. A phase navigation bar at the top shows progress through all seven phases.

The opening arguments are the first thing users see — each agent presents its case with cited evidence, structured reasoning, and clear claims. Then comes the magic: the evaluation phase, where each agent privately reads and analyzes the opponent's opening. Users can view this internal strategic analysis, seeing exactly how each AI planned its response.

Rebuttals follow, and this is where steelmanning shines. Each agent must acknowledge the opponent's strongest point before attacking it, demonstrating genuine engagement rather than strawmanning. Closing statements synthesize everything, acknowledging where the opponent made strong points and identifying where real disagreement remains.

### AI Judging

Three specialized judges — Logic, Evidence, and Engagement — independently evaluate the complete debate transcript. Each judge provides per-side scores, chain-of-thought reasoning, analysis of strongest and weakest moves, and a winner determination. The results display as expandable judge cards with score bars and a synthesized verdict explaining why the winner won.

Users can also cast their own vote on who they think won, with tallies displayed alongside the AI scores.

---

## How We Built It: Architecture and Tech Decisions

### The Three-Layer Architecture

We structured DebateMeBro as three distinct layers:

1. **Presentation Layer (Next.js 15, React, TailwindCSS, Zustand):** Handles the UI, debate streaming display, phase navigation, and state management. The debate view page alone is over 1,500 lines of TypeScript, managing SSE connections, phase gating, persona reveals, and judging displays.

2. **Orchestration Layer (FastAPI + LangGraph):** Manages the debate lifecycle as a state machine with 10 nodes. FastAPI handles REST endpoints and SSE streaming. LangGraph manages phase transitions, concurrent execution of evaluation phases, and state persistence.

3. **Intelligence Layer (Anthropic Claude):** Claude Haiku handles fast, cheap operations (topic analysis, persona generation). Claude Sonnet powers the debate agents and judges with strict steelmanning requirements and specialized scoring criteria.

### Why LangGraph?

The debate is fundamentally a state machine: research, opening, eval, rebuttal, eval, closing, judging, complete. Each phase has different inputs, outputs, and execution requirements (some phases run sequentially, others in parallel). LangGraph lets us define this as a declarative graph where transitions, node logic, and state management are cleanly separated from the HTTP layer.

The alternative — ad-hoc control flow in FastAPI route handlers — would have created an unmaintainable tangle of nested async calls. LangGraph keeps the orchestration logic testable and modifiable.

### Why SSE Over WebSockets?

Debate streaming is unidirectional: the server sends tokens to the client. SSE is simpler, works through proxies and CDNs without special configuration, and auto-reconnects on failure. We stream 9 event types through a single SSE endpoint: `content`, `phase_transition`, `personas`, `evidence_loaded`, `internal_content`, `judging_results`, `mode`, `complete`, and `error`.

### Cache-First Architecture

Every completed debate is saved as a JSON file. Before opening an SSE connection, the frontend checks if the debate already exists via a REST call. If it does, all data loads instantly — no streaming, no API costs. This means a debate only costs tokens once; every subsequent view is free.

---

## Techniques and Approaches That Made It Work

### Prompt Engineering for Steelmanning

The steelmanning requirement is enforced through carefully crafted system prompts. Each rebuttal phase prompt includes explicit instructions: "Before responding to any argument, first articulate the strongest version of your opponent's point. Demonstrate that you understand why someone would find it compelling. Only then explain where you disagree and why." This produces rebuttals that feel intellectually honest rather than dismissive.

### Concurrent Judge Execution

The three judges run concurrently via `asyncio.gather`, cutting judging time by roughly 3x compared to sequential execution. Each judge has a specialized prompt focusing on its domain (logic, evidence, engagement) with anti-bias instructions to prevent order effects.

### Anthropic Prompt Caching

System prompts and evidence bundles are tagged for Anthropic's prompt caching. Since the same evidence is referenced across multiple LLM calls within a single debate, caching significantly reduces input token costs — particularly important given that a full debate involves 10+ separate LLM invocations.

### Phase Gating with SSE

A non-obvious challenge: when should the UI advance to the next phase? We implemented phase gating with Continue buttons so users control the pacing. SSE events continue buffering in the background while the user reads the current phase. This required tracking `lastContentPhase` in the SSE handler and a `userNavigatedRef` to prevent incoming events from overriding manual phase navigation.

---

## Challenges We Hit Along the Way

### The bcrypt/passlib Conflict

Modern bcrypt (v4.0+) enforces a strict 72-byte maximum length and raises a `ValueError` for longer strings. Passlib, our password hashing library, internally hashes a 255-byte string to detect an old BSD wraparound bug — which immediately crashes the application. The fix was simple (pin `bcrypt==3.2.2`) but the diagnosis took hours of tracing through third-party library internals.

### Context Leaks in Evaluation Phases

Our initial implementation had a subtle bug: agents' private evaluation notes from internal phases were leaking into the conversation history visible to opponents. When the Con agent was writing its rebuttal, it could see the Pro agent's internal analysis of how to attack it. GitHub Copilot actually flagged this during a review suggestion, and we fixed it with `is_internal` boolean filtering on the conversation history.

### Internal Phase Speaker Detection

LangGraph runs pro and con evaluation phases concurrently via `asyncio.gather`. But when streaming events arrived, `get_speaker()` couldn't distinguish which agent produced which chunk — everything was tagged as "system." The fix required adding `config={"tags": [role]}` to every `llm.ainvoke()` call in `agents.py`, and reading `event.tags` in the stream handler. A one-line root cause, but it took significant debugging to identify.

### Docker Desktop Port Proxying

Docker Desktop on Windows had a persistent conflict on `localhost:3000`. Rather than fighting it, we remapped the frontend container to port 3030 and updated all CORS origins. A small decision that saved hours of frustration.

---

## How AI Shaped Our Development Process

DebateMeBro is an AI product built with AI tools — a meta-layer that was both powerful and occasionally disorienting.

**Windsurf/Cascade** was our primary development IDE, functioning as a pair programmer throughout the project. It was particularly effective for complex, multi-file changes: the SSE streaming handler required coordinating backend event emission, frontend event parsing, Zustand state updates, and React component rendering across 6+ files simultaneously. Cascade could hold the full context and suggest coherent changes across all layers.

Cascade also proved invaluable for debugging. The internal phase speaker detection bug — where all evaluation phases showed "computing strategy" instead of actual content — was diagnosed by Cascade identifying that LangGraph event tags could carry role information. What might have taken a full day of manual debugging was resolved in one session.

**GitHub Copilot** excelled at boilerplate and pattern completion. Writing 10 similar LangGraph node functions, generating test fixtures with `AsyncMock`, and constructing Pydantic models were all dramatically faster with inline suggestions. Copilot also caught the context leak bug early, suggesting the `is_internal` filter before we'd even noticed the issue in testing.

**Claude itself** (via direct conversation) generated the pre-loaded research documents for our preset topics — 8-15 pages of sourced evidence per side for healthcare, remote work, and AI copyright debates. These documents are the foundation that makes preset debates high-quality out of the box.

The meta-experience of using AI to build an AI debate platform gave us unique insight into both the capabilities and limitations of current AI tooling. AI excels at pattern completion, context-aware suggestions, and reducing boilerplate. It struggles with novel architectural decisions, subtle async timing bugs, and understanding the *intent* behind code rather than just its structure.

---

## How We Worked as a Team

Jason and Shuai divided the work along architectural lines. Jason owned the backend debate pipeline (LangGraph state machine, agent prompts, SSE streaming, judging panel) and the frontend debate view (the 1,500+ line page that renders the entire debate experience). Shuai built the authentication system (register, login, JWT, protected routes), the voting system (backend + frontend), the dashboard, and the browse page.

We used GitHub Issues with detailed acceptance criteria for every feature, organized into two sprints with documented planning, execution, and retrospectives. Sprint 1 delivered the core infrastructure (10 issues, all completed). Sprint 2 focused on live API integration and UX polish (8 issues, 3 completed including a massive 7-sub-issue UX overhaul). We also useproper PR methods, checking out to a new branch per issue, and merging only after review.

Our retrospective process was genuinely useful — not just ceremony. After Sprint 1, we identified that starting with demo/mock mode had masked real integration issues. After Sprint 2, we documented that the monolithic UX overhaul (Issue #23) should have been split into smaller PRs. These insights directly informed how we approached subsequent work.

---

## Reflections: What We Learned

**AI-assisted development is a force multiplier, not a replacement.** The tools made us dramatically faster at implementation, but every major architectural decision — choosing LangGraph, designing the SSE protocol, structuring the cache-first pattern — required human judgment about tradeoffs that AI couldn't navigate alone.

**Start with real data earlier.** Our biggest Sprint 2 lesson: most bugs only appeared when running real Claude debates, not mock data. Demo mode is useful for development velocity, but it creates a false sense of completeness.

**Prompt engineering is real engineering.** The debate quality depends entirely on how well the system prompts are crafted. Getting steelmanning to feel genuine, making judges produce useful reasoning, and keeping personas consistent across 10+ LLM calls required iterative refinement that rivals any traditional software engineering challenge.

**The product is genuinely useful.** After building DebateMeBro, we've both started using it to explore topics we're curious about. There's something uniquely valuable about seeing the strongest case for both sides of an issue laid out with cited evidence and transparent scoring. It doesn't tell you what to think — it shows you what the best arguments are and lets you decide.

DebateMeBro is live at [https://debatemebro.vercel.app](https://debatemebro.vercel.app). Try debating any topic and see what happens when AI is forced to argue in good faith.

---

*Jason Ingersoll and Shuai Ren are graduate students at Northeastern University. DebateMeBro was built for CS 7180: AI-Assisted Coding (Spring 2026). The source code is available on [GitHub](https://github.com/JasonIngersoll9000/Debate-me-bro).*