# Building an AI debate platform with democratic consensus synthesis

**The most critical architectural decisions for this platform center on three pillars: a LangGraph-based state machine for orchestrating multi-turn debates, a position-swapped multi-model judging panel to eliminate AI bias, and a Polis-inspired consensus engine using PCA clustering with Condorcet aggregation.** This report synthesizes research across debate theory, multi-agent AI systems, RAG pipelines, computational social choice, and fullstack engineering to provide implementation-ready guidance. The platform combines formal debate structures (Lincoln-Douglas and Oxford-style) with adversarial LLM agents, user-uploaded evidence via RAG, hybrid AI-human judging, and a democratic preference aggregation system that generates a coherent AI candidate persona. Each section below provides specific tools, libraries, code patterns, and papers prioritized for direct implementation.

---

## 1. Formal debate structures map directly to state machines

### Lincoln-Douglas format timing

The NSDA standard LD format follows a **6-3-7-3-4-6-3** structure totaling ~45 minutes:

| Speech | Duration | Speaker |
|--------|----------|---------|
| Affirmative Constructive (1AC) | 6 min | Pro |
| Cross-Examination | 3 min | Con questions Pro |
| Negative Constructive (1NC) | 7 min | Con |
| Cross-Examination | 3 min | Pro questions Con |
| 1st Affirmative Rebuttal | 4 min | Pro |
| Negative Rebuttal | 6 min | Con |
| 2nd Affirmative Rebuttal | 3 min | Pro |

Each debater receives **4 minutes of prep time** distributed at their discretion. Cases are built around a **value/criterion framework**: a debater asserts a core value (e.g., justice, liberty) and a criterion to measure it (e.g., utilitarianism, Kantian ethics), then presents 2–3 contentions connecting back through evidence and analysis. The NSDA ballot evaluates on burden of proof fulfillment, evidence quality ("the logic and ethos of a student's independent analysis and/or authoritative opinion"), mandatory clash with opponent arguments, cross-examination effectiveness, and civility. Speaker points use a **20–30 scale** where 26–30 is the competitive range. Crucially, NSDA explicitly penalizes strawmanning—"judge should vote against the debater who uses a straw argument and award zero speaker points"—while rewarding engagement with the strongest version of opposing arguments.

### Oxford-style and the opinion-shift mechanic

Oxford-style debates, popularized by Intelligence Squared (IQ2), determine winners not by raw majority but by **which side achieves the largest net shift in audience opinion**. Audiences vote For/Against/Undecided before and after the debate. Across 170+ IQ2 debates, **47% of audience members shifted opinion** and 39% changed sides—compared to only 5% after 2016 presidential debates. This mechanic is the single most implementable engagement feature for the platform. The format uses 6–10 minute opening speeches per side, floor Q&A, and 3–4 minute closing statements, with a moderator enforcing rules. Points of Information (brief interjections) are allowed except during the first and last minute of each speech.

### Steelmanning as a scorable criterion

Steelmanning—addressing the *strongest possible version* of an opponent's argument—is formally distinct from the Principle of Charity (which interprets charitably in real-time). A steelmanned rebuttal reconstructs the opponent's best case before dismantling it. The Long Now Foundation debate format requires debaters to restate their opponent's position **to the opponent's satisfaction** before countering it. For AI implementation, each debate turn should include an explicit steelmanning section: "The strongest case for my opponent's position is... My response is..." This can be scored as a distinct rubric criterion weighted at 20% of the total evaluation.

### Judging rubrics across formats

**British Parliamentary** ranks four teams 1st–4th (3/2/1/0 points) with speaker points on a **50–100 scale** (WUDC standard). **World Schools** uses three explicit weighted criteria: Content (40%), Style (40%), Strategy (20%), scored per speech on a 60–80 constructive / 30–40 reply scale. For the AI platform, the most actionable rubric combines elements from all formats into four weighted criteria: Logical Validity (30%), Evidence Quality (25%), Refutation Strength (25%), and Steelmanning Quality (20%).

---

## 2. Multi-agent debate architecture: what works and what fails

### The research landscape

The foundational paper is Irving, Christiano & Amodei's **"AI Safety via Debate"** (2018, arXiv:1805.00899), proposing two AI agents in a zero-sum debate game judged by humans. The most significant empirical follow-up is Khan et al.'s **"Debating with More Persuasive LLMs Leads to More Truthful Answers"** (ICML 2024 Best Paper, arXiv:2402.06782), which demonstrated that debate consistently helps non-expert judges reach correct answers at **76% accuracy** (vs. 48% baseline for non-experts). The code is open-source at `ucl-dark/llm_debate` (MIT license). Du et al.'s **"Improving Factuality and Reasoning through Multiagent Debate"** (ICML 2024, arXiv:2305.14325) showed significant factuality improvements with a "society of minds" approach, with code at `composable-models/llm_multiagent_debate`. Most recently, **MADAM-RAG** (2025, arXiv:2504.13079) demonstrated that multi-agent debate over retrieved evidence improves misinformation suppression by up to **15.8%**.

### Sycophancy is the primary failure mode

The biggest risk in AI-to-AI debates is **agreement spiraling**—agents converging rather than arguing. Multiple 2024–2025 papers confirm this. **CONSENSAGENT** (ACL 2025 Findings) provides the most actionable solution: dynamically refining prompts based on observed interaction patterns. Estornell & Liu (NeurIPS 2024) proved that **similar models converge to majority opinion**, including shared misconceptions from training data. The critical mitigation is using heterogeneous model families (e.g., Claude for Pro, GPT-4o for Con) rather than two instances of the same model.

Recommended anti-sycophancy techniques in order of effectiveness:

- **Heterogeneous models** across agents to break shared training biases
- **Explicit disagreement instructions** requiring agents to maintain position unless presented with genuinely new evidence
- **Dynamic prompt refinement** (CONSENSAGENT approach) adjusting mid-debate
- **Best-of-N sampling** (Khan et al. use BoN=4–8) to select the most on-position response
- **Sparse communication topologies** (Li et al., EMNLP 2024) using graph-based rather than all-to-all messaging

### Position anchoring requires multi-layered enforcement

To prevent drift, re-inject the assigned position statement in every prompt, not just the initial turn. Use a "commitment device" in the system prompt: *"Your core thesis is [X]. This is non-negotiable. You may refine supporting arguments but never abandon this thesis."* Assign detailed expert personas (e.g., "You are a constitutional law professor who has published extensively arguing [position]"). Maintain structured debate history summarizing each round rather than passing raw conversation, and include a self-check step: "Confirm your position has not changed from: [ORIGINAL POSITION]." For context management across many rounds, use a sliding window keeping system prompt + position + last 2–3 rounds, with earlier rounds summarized by a cheaper model.

### Research phase pipeline

Structure the pre-debate research as a ReAct-style pipeline: the agent reasons about what evidence it needs, calls search tools, observes results, and iterates. Use LangChain's `WebSearchTool`, `ArxivQueryRun`, and `WikipediaQueryRun` for structured research. For citation in debate output, use ID-tagged chunks (`[Source_1]`, `[Source_2]`) with post-generation resolution to full references. Anthropic's native Citations feature provides built-in reference attachment from provided documents. The recommended citation grounding technique is a two-pass approach: generate the argument first, then verify each citation against the source in a second LLM call.

---

## 3. Document ingestion and RAG: the evidence pipeline

### Parsing library selection

Based on 2025 benchmarks, the recommended parsing stack is:

| Library | Best For | Speed | Accuracy | License |
|---------|----------|-------|----------|---------|
| **LlamaParse** | Primary PDF/doc parsing | ~6s regardless of size | Excellent structure preservation | Freemium API |
| **Docling (IBM)** | Complex table extraction | Moderate | **97.9%** table accuracy | Apache 2.0 |
| **Unstructured.io** | OCR-heavy scans | Slow (51s/page) | 75% complex tables | Open source + API |
| **PyMuPDF/pdfplumber** | Simple text-heavy PDFs | Very fast | Basic extraction | Open source |
| **Apache Tika** | Format detection/normalization | Fast | 1000+ formats | Apache 2.0 |

The ingestion pipeline should route by format: PDFs through LlamaParse (with Docling fallback for tables), DOCX through python-docx, URLs through Trafilatura for article extraction, and everything normalized to Markdown/JSON before chunking.

### Argument-aware chunking and retrieval

Standard fixed-size chunking loses argumentative structure. Use a **hybrid approach**: semantic chunking via LangChain's `SemanticChunker` (splitting at semantic shift boundaries using sentence embeddings) with an argument metadata overlay—a second LLM pass tagging each chunk with `chunk_type` (claim/evidence/reasoning/background), `stance` (pro/con/neutral), and `strength` (strong/moderate/weak). Chunk size should be **256–512 tokens** with 10–20% overlap for argument-dense content. Use parent-child retrieval: retrieve small precise chunks but return the parent context window for coherence.

For retrieval, the 2025 consensus is **BM25 + dense vectors + reranking**. Implement with LangChain's `EnsembleRetriever` combining `BM25Retriever` (weight 0.4) and vector retriever (weight 0.6) with Reciprocal Rank Fusion, followed by cross-encoder reranking (BAAI/bge-reranker-v2-m3 open source, or Cohere rerank-v3 API). This pipeline reranks the top 20–50 retrieved chunks down to 5–8 for the LLM context. For embeddings, use **Cohere embed-v4** ($0.12/1M tokens, 128K context) for production or **BGE-M3** (MIT license, self-hosted) for privacy-first deployments.

### Side-based access control

Each AI debater should only access its assigned evidence plus the shared pool. Implement this as metadata filtering on the vector database:

```python
class DebateRetriever:
    def __init__(self, vector_store, debate_id: str, side: str):
        self.allowed_sides = [side, "shared"]
    
    def retrieve(self, query: str, top_k: int = 10):
        return self.vector_store.similarity_search(
            query=query, k=top_k,
            filter={"debate_id": self.debate_id, 
                    "assigned_side": {"$in": self.allowed_sides}}
        )
```

For user talking points, use structured delimiters (`<user_talking_points>...</user_talking_points>`) with a sanitization layer stripping prompt injection patterns, and a quarantined LLM call to parse user input into structured argument directions before it reaches the debater agent. The debater never sees raw user text—only parsed structured representations.

### Two-tier citation system

Distinguish user-uploaded sources from web research using visual badges: `[📄 U1]` for user evidence (blue) and `[🌐 W1]` for web sources (green). Embed citation metadata at ingestion time including `source_type`, `doc_title`, `page_number`, and a unique `citation_anchor`. Post-generation, resolve citation markers against retrieved chunks and compute attribution confidence scores. LlamaIndex's `CitationQueryEngine` provides built-in citation tracking with `citation_chunk_size` and `similarity_top_k` parameters.

---

## 4. AI judging: multi-model panels eliminate bias

### The core judging prompt

The LLM-as-judge literature (Zheng et al., NeurIPS 2023, arXiv:2306.05685) shows GPT-4 achieves **>80% agreement with human evaluators** on pairwise comparisons. The key finding from G-Eval (Liu et al., EMNLP 2023) is that chain-of-thought evaluation—having the model reason before scoring—improves human correlation by **10–30%**. Use 1–5 integer scales (not continuous), additive rubric criteria scored independently, and 2–3 few-shot examples to increase consistency from 65% to 77.5%.

The recommended debate judging rubric scores four criteria: **Logical Validity & Soundness (30%)**, evaluating premise-to-conclusion chains and fallacy detection; **Evidence Use & Citation Quality (25%)**, assessing source credibility and relevance; **Refutation Strength (25%)**, measuring how effectively the opponent's specific arguments were countered; and **Steelmanning Quality (20%)**, evaluating whether the debater engaged with the strongest version of the opponent's position. The explicit anti-sycophancy instruction in the system prompt is critical: *"An unpopular position that is well-argued with strong evidence MUST score higher than a popular position that is poorly argued."*

### Multi-model jury outperforms single judges

The **PoLL paper** (Verga et al., Cohere, arXiv:2404.18796) proved that a Panel of LLM evaluators composed of multiple smaller models outperforms a single large judge while costing **7× less**. For the debate platform, deploy three specialized judges from different model families: a Logic Judge (GPT-4o), an Evidence Judge (Claude Sonnet), and an Engagement Judge (Gemini Pro). Each evaluates only its specialty criteria. Aggregate using weighted averaging for rubric scores and majority voting for winner determination. Cross-family panels achieve **94.6% majority agreement** across evaluation instances.

### Position bias is the most critical vulnerability

GPT-4 shows approximately **40% position inconsistency**—it may flip its winner determination when answer order is swapped. The required mitigation is **position swapping**: run every judgment twice with debaters in reversed order. Only count results where both orderings produce consistent winners. Inconsistent results should be flagged as inconclusive ties. For rubric scores, average the scores from both orderings for each debater. Additionally, use explicit instructions against verbosity bias (*"Concise, well-reasoned arguments are preferable to verbose ones"*) and self-enhancement bias (different model families reduce same-model favoritism by 30–40%).

### Combining AI judges with human votes

Use **dynamic weighting** that shifts authority toward human voters as participation increases:

```python
human_confidence = min(1.0, (total_votes / 20) ** 0.5)
ai_weight = 0.7 - (0.3 * human_confidence)   # 0.7 → 0.4
human_weight = 0.3 + (0.3 * human_confidence)  # 0.3 → 0.6
```

With few votes, AI judgment dominates (70/30). At 20+ votes, human opinion takes precedence (40/60). For longitudinal ranking of debate positions across topics, implement **Bradley-Terry models** (used by LMSYS Chatbot Arena instead of Elo) which produce proper confidence intervals from pairwise comparison data. For simpler 1v1 tracking, standard **Elo** with K=32 works well.

---

## 5. Democratic consensus: from votes to an AI candidate

### Computational social choice fundamentals

**Arrow's Impossibility Theorem** proves no ranked voting system with ≥3 candidates satisfies all fairness axioms simultaneously—but cardinal systems (score voting, quadratic voting) sidestep it by allowing preference intensity expression. For synthesizing a consensus platform from debate outcomes, **Condorcet methods** (specifically Schulze or Ranked Pairs) select the position that beats all others in pairwise majority comparisons, making them ideal for identifying the "majority consensus" on each issue. When Condorcet cycles occur (empirically rare in ideologically structured domains), the **Kemeny-Young method** finds the ranking closest to consensus, though it is NP-hard to compute.

The deepest challenge is **judgment aggregation on interconnected propositions**. The "doctrinal paradox" shows that aggregating votes on logically connected issues (e.g., lower taxes AND more spending) can produce inconsistent packages. The solutions from the *Handbook of Computational Social Choice* (Brandt et al., Cambridge 2016) include sequential voting with agenda control, distance-based methods finding the closest consistent position, and maximum likelihood estimation treating votes as noisy observations of a "correct" outcome.

### Polis is the gold standard for consensus surfacing

**Polis** (pol.is, open source at `github.com/compdemocracy/polis`) creates an opinion matrix (participants × statements, values: agree/disagree/pass) and runs PCA dimensionality reduction to project into 2D space, followed by K-means clustering to identify opinion groups. Its killer feature: statements with high agreement **across all clusters** are surfaced as consensus items. Critically, Polis does not allow replies—only agree/disagree/pass—which eliminates trolling and creates a "dialogic" dynamic where disagreement motivates users to craft better consensus statements. Deployments include Taiwan's vTaiwan (80%+ of 26+ national deliberations led to government action), Anthropic's Collective Constitutional AI, and Community Notes on X/Twitter.

**All Our Ideas** (allourideas.org, by Princeton's Matthew Salganik) uses pairwise wiki surveys with Bayesian estimation via hierarchical probit models, producing a score representing the probability that an item beats a randomly chosen item. Its "wiki" aspect allows users to submit new options, making it adaptive. These two tools represent complementary approaches: Polis for clustering and consensus identification, All Our Ideas for issue prioritization and ranking.

### Building the policy position graph

Model policy domains as a **Bayesian network** (DAG) with structure learning from vote data to discover empirical dependencies between positions. Use the PC Algorithm or Partition MCMC (Kuipers & Moffa, 2017) for structure learning, implemented via `bnlearn` (R) or `PyBNesian` (Python). The network enables **preference inference**: given a user's stance on 5 issues, predict likely stance on 20 more. Overlay an ontological layer with relationships like `requires`, `contradicts`, `enables`, and `trades_off_with` to enforce logical consistency. For topic discovery from debate text, use structural topic models (STM) or the bipartite mixed-membership stochastic block model from Olivella et al. (arXiv:2305.05833), implemented in the `NetMix` package.

### Generating the AI candidate persona

Anthropic's **Collective Constitutional AI** (Huang et al., FAccT 2024) provides the leading precedent: ~1,000 representative U.S. adults used Polis to propose and vote on normative principles, producing a "Public Constitution" that was used to fine-tune an LLM. The public constitution emphasized objectivity, impartiality, and accessibility more than Anthropic's internal constitution, with ~50% overlap and **improved bias scores** on BBQ benchmarks.

For the AI candidate, encode the synthesized consensus positions as a structured policy database (JSON/graph) that the model references via RAG. The system prompt should specify: *"You are [CandidateName], whose positions are derived from the deliberative consensus of [N] citizens across [M] debates. Lead with the consensus position, acknowledge minority viewpoints with >30% support, explain the deliberative reasoning, and maintain consistency with your established platform."* Include confidence scores ("78% of deliberators supported X") and link every position back to specific debate outcomes. When asked about uncovered issues, the model should reason from its closest established positions using the policy position graph.

### The dimensionality problem

Research consistently shows left-right spectrums are insufficient. Poole & Rosenthal's **DW-NOMINATE** places legislators in low-dimensional space from roll-call votes, with the first dimension (liberal-conservative) explaining ~85% of variance and the second capturing issues like civil rights and lifestyle politics. Jonathan Haidt's **Moral Foundations Theory** identifies six foundations (Care, Fairness, Loyalty, Authority, Sanctity, Liberty) where liberals emphasize the first two while conservatives use all six more equally. The Political Compass's 2-axis model improves on 1D but still oversimplifies. For the platform, use **6–10 policy dimensions** rendered as radar/spider charts, with Polis-style PCA clustering for discovering natural opinion groups that may not align with traditional categories.

### Anti-gaming measures

**Quadratic voting** (Lalley & Weyl, 2018) naturally weights for preference intensity while making manipulation expensive (1 vote = 1 credit, 2 votes = 4 credits), but is not inherently Sybil-proof and must be paired with proof-of-personhood. For Sybil resistance, the practical spectrum ranges from phone verification (low friction, imperfect) through BrightID social graph verification (moderate) to government ID or Worldcoin biometric scanning (high assurance, high friction). **SumUp** (Tran et al., NSDI 2009) uses social trust networks to bound attacker influence. The platform should require deliberation engagement (minimum time on page, comprehension checks) before voting, rate-limit votes per user per time period, and apply demographic post-stratification to ensure results represent the target population.

---

## 6. The recommended technical stack

### Backend orchestration: LangGraph + FastAPI

**LangGraph** is the clear choice for the debate pipeline. A structured debate with defined turns, roles, and phases maps directly to its graph-based state machine—each phase (research → info sharing → debate rounds → judging) is a node, transitions are conditional edges. LangGraph provides persistent state across rounds, checkpointing for crash recovery, and human-in-the-loop support. Use **PydanticAI** for individual agent implementations within LangGraph nodes, providing type-safe structured outputs and OpenTelemetry observability. Avoid CrewAI (less control over strict turn order) and AutoGen (conversation-based approach risks agents looping endlessly).

The state machine definition:

```python
class DebateState(TypedDict):
    debate_id: str
    topic: str
    status: Literal["created", "researching", "debating", "judging", "complete"]
    current_round: int
    total_rounds: int
    debate_turns: List[dict]
    judge_scores: List[dict]
    audience_votes: dict

graph = StateGraph(DebateState)
graph.add_node("research", research_phase)
graph.add_node("debate_round", execute_debate_round)
graph.add_node("judge", judging_phase)
graph.add_conditional_edges("debate_round",
    lambda s: "debate_round" if s["current_round"] < s["total_rounds"] else "judge")
```

**FastAPI** serves as the web framework for its native async support (critical for concurrent LLM calls), SSE streaming via Starlette, WebSocket support, and Pydantic integration.

### Frontend and streaming

Use **Next.js 15+ (App Router)** with **SSE for debate streaming** (unidirectional, auto-reconnecting, load-balancer friendly) and **WebSocket for live voting** (bidirectional, sub-100ms updates). The debate layout should be side-by-side on desktop with sequential fallback on mobile, using token-by-token streaming with CSS typing animations. State management via Zustand or Jotai (lighter than Redux). For data visualization on the consensus dashboard, **D3.js** provides maximum flexibility for radar charts, Sankey diagrams (opinion shift), and force-directed policy graphs, with **Recharts** for simpler standard chart types.

### Database: PostgreSQL with pgvector

A unified **PostgreSQL 16+** with the **pgvector** extension handles both relational data and vector embeddings in a single database. For a debate platform with moderate vector counts (likely <1M total), pgvector handles up to 10–50M vectors at 471 QPS / 99% recall with the pgvectorscale extension. This eliminates the operational complexity of syncing between separate relational and vector databases. Key tables: `debates` (topic, status, config), `debate_turns` (speaker, content, round, phase), `documents` and `document_chunks` (with `vector(1536)` embedding column and `assigned_side` for access control), `votes`, `judge_scores`, and materialized `debate_results` for leaderboards.

### Cost optimization

With 2025 pricing, a 3-round debate with research costs approximately **$0.30–$0.50** using a tiered model strategy:

| Phase | Model | Est. Cost |
|-------|-------|-----------|
| Document processing | GPT-4o-mini ($0.15/$0.60 per 1M) | ~$0.01 |
| Research (4 calls) | Claude Haiku 3.5 ($0.80/$4.00) | ~$0.02 |
| Debate turns (6 turns) | Claude Sonnet 4 ($3/$15) | ~$0.21 |
| Judging (3 judges) | Mixed models | ~$0.08 |

At 1,000 debates/month, LLM costs total **$300–$600/month**. Key optimizations: Anthropic's prompt caching (cache system prompts at 0.1× base rate, saving 90% on repeated tokens), semantic caching via Redis for similar research queries (50–90% research cost reduction), batch API for non-time-critical phases (50% discount), and aggressive context pruning (sliding window of last 2–3 rounds with earlier rounds summarized by a cheaper model).

### File handling: Cloudflare R2 + processing pipeline

**Cloudflare R2** for document storage (**$0 egress**, $0.015/GB/mo, S3-compatible API). Upload pipeline: R2 storage → LlamaParse/Docling for text extraction → SemanticChunker for chunking → OpenAI text-embedding-3-small for embedding → pgvector for storage. Use **Redis** for semantic caching, pub/sub (SSE fan-out), and session state.

---

## 7. UX patterns from existing platforms

### What works and what doesn't

**Kialo** validates the argument-tree model (1M+ users, 400K+ discussions) with its columnar pro/con view, but suffers from context loss in deep trees and scoring opacity. **DebateArt's four-dimensional voting** (Argument, Sources, Legibility, Conduct) provides more nuanced evaluation than simple winner/loser and should be adapted for this platform. **Intelligence Squared's pre/post opinion poll** is the single most effective engagement mechanic: it creates personal investment, reveals impact, and provides a clear winner determination. Their data shows opinions are more fluid on science/technology topics and less on politics—useful for calibrating expectations.

The Canonical Debate Lab taxonomy identifies five visualization approaches: argument trees (hierarchical), outline views (collapsible), columnar views (single claim + pro/con), graph views (circular arguments), and multi-dimensional views. For a live AI debate, the **columnar view** for individual rounds combined with a **sequential timeline** for the full debate provides the best balance of comparison and narrative flow.

### Debate configuration as a 6-step wizard

Research from PatternFly and UX literature strongly supports a multi-step wizard: (1) Choose Format with visual previews, (2) Set Topic with suggestion autocomplete, (3) Assign Positions with AI auto-assignment option, (4) Upload Evidence with drag-and-drop and side assignment, (5) Advanced Settings (research depth, rounds, judge criteria), and (6) Review & Launch summary. Provide a "Quick Start" that requires only a topic, with smart defaults (3 rounds, moderate research depth, free-form format).

### Consensus dashboard

The consensus dashboard should combine a **Polis-style 2D cluster scatter plot** (showing where users sit relative to opinion groups), **radar/spider charts** overlaying "My Position" vs. "Community Consensus" vs. "Party Platforms," and a **Sankey diagram** showing opinion shift flows across debates. Each position on the AI candidate's platform should have an expandable "How was this determined?" section showing contributing debates, vote tallies, key arguments, confidence levels, and dissent indicators. Use D3.js for custom visualizations and ensure persistent disclosure: *"This candidate's platform is AI-generated based on community debate results. It does not represent any real person or party."*

---

## 8. Edge cases that will determine platform success

### When AI agents agree

Pre-debate topic classification should evaluate evidence asymmetry, expert consensus level, and credible source availability on both sides. One-sided topics should trigger automatic reframing suggestions (e.g., "Is the Earth round?" → "How should science communicators engage with science denial?"). For debates that proceed on lopsided topics, use strong devil's advocate prompting with counterfactual framing and explicit instruction to challenge underlying assumptions rather than defending a factually indefensible position. Competitive debate handles this through "kritiks"—philosophical critiques of the resolution's framing itself.

### Preventing repetitive debates

Implement **argument novelty scoring** using semantic similarity: before generating each round, embed previous arguments and require a minimum novelty threshold (<0.85 cosine similarity to any previous argument). Maintain a structured argument graph tracking claims, warrants, evidence, and rebuttals, prompting agents with explicit lists of what has already been said. Structure later rounds to require "impact calculus"—comparing the relative importance, probability, and scope of competing arguments rather than restating them. Flag dropped arguments that one side hasn't addressed and prompt the non-responding side to address or concede them.

### Misinformation in user uploads

Adopt a **layered transparency approach**: a passive layer displaying source credibility indicators (using NewsGuard or Media Bias/Fact Check ratings), an active layer checking extracted claims against Google Fact Check Tools API and ClaimBuster, and an agent awareness layer briefing AI debaters on source credibility scores so they can weigh evidence appropriately. Don't block uploads—preserve user sovereignty—but ensure all evidence carries visible provenance metadata and credibility indicators.

### Gaming the consensus synthesis

The most dangerous failure mode is coordinated groups flooding debates on single issues. Beyond the Sybil resistance measures described in Section 5, implement **deliberation quality requirements** (minimum engagement time, comprehension checks before voting), **temporal decay** (weight recent participation higher but cap total influence), and **diversity weighting** (weight results by demographic/geographic diversity of participants, not just volume). Keep some aggregation details private to prevent Goodhart's Law gaming, and show results only **after** a user completes their own deliberation—never before or during.

### Responsible AI candidate simulation

The EU AI Act (full enforcement August 2026) requires disclosure of AI-generated content and labeling of deepfakes "clearly and distinguishably." Sixteen-plus US states require disclosure on AI political content. The platform should embed **C2PA Content Credentials** (Coalition for Content Provenance and Authenticity, supported by Adobe, Microsoft, BBC, Google, OpenAI) in all generated content, maintain persistent disclosure banners, tag every position with derivation data ("Derived from 47 debates, 1,203 votes"), and include version history showing how positions evolved. The candidate simulation should never be extractable without attribution—implement anti-screenshot measures and require watermarking on any exported content.

---

## Conclusion: three architectural bets that matter most

The research converges on three decisions that will most determine this platform's success. First, **use heterogeneous model families for debaters** (e.g., Claude vs. GPT-4o)—homogeneous models provably converge to shared misconceptions rather than genuinely debating. Second, **implement position-swapped multi-model judging** as a non-negotiable requirement—single-model judges exhibit 40% position inconsistency, making their evaluations unreliable without the swap-and-verify protocol. Third, **adopt Polis's anti-reply consensus architecture** for the aggregation layer—its design of surfacing cross-cluster agreement while burying divisive statements is the most battle-tested approach to extracting genuine consensus from large groups, as demonstrated across 26+ national deliberations in Taiwan.

The total estimated cost per debate ($0.30–$0.50) makes this commercially viable at scale. The most novel contribution of this platform—connecting formal debate outcomes to a synthesized AI candidate persona—has direct precedent in Anthropic's Collective Constitutional AI work but pushes into genuinely new territory by making the synthesis dynamic, transparent, and publicly interactive. The key risk is Goodhart's Law: once users understand the aggregation mechanism, they will optimize for it rather than deliberating genuinely. Delayed disclosure of results, quadratic voting costs, and deliberation quality gates are the primary defenses. Start with consensus synthesis as an internal-only feature and expose it gradually as anti-gaming measures prove robust.