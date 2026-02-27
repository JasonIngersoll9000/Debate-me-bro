import { useState, useEffect, useRef } from "react";

const MOCK_TOPIC = "Should the United States adopt universal healthcare?";
const PRO_POSITION =
  "The US should implement a single-payer universal healthcare system to ensure equitable access, reduce administrative costs, and improve population health outcomes.";
const CON_POSITION =
  "The US should preserve its market-based healthcare system, which drives medical innovation, offers patient choice, and avoids the inefficiencies and rationing seen in government-run systems.";

const PHASES = [
  { id: "research", label: "Research", icon: "🔍" },
  { id: "opening", label: "Opening Arguments", icon: "📖" },
  { id: "rebuttal", label: "Rebuttals", icon: "⚔️" },
  { id: "closing", label: "Closing Statements", icon: "🏁" },
  { id: "judging", label: "Judging", icon: "📊" },
];

const MOCK_RESEARCH = {
  pro: [
    {
      query: "single-payer healthcare administrative cost savings",
      results: 5,
    },
    { query: "health outcomes universal coverage countries", results: 4 },
    { query: "moral arguments healthcare as a right", results: 3 },
    { query: "Taiwan single-payer transition results", results: 3 },
  ],
  con: [
    { query: "market-based healthcare innovation advantages", results: 5 },
    { query: "single-payer wait times Canada UK", results: 4 },
    { query: "Medicare for All cost estimates CBO", results: 4 },
    { query: "regulated multi-payer systems Germany Switzerland", results: 3 },
  ],
};

const MOCK_TURNS = [
  // OPENING ARGUMENTS
  {
    side: "pro",
    phase: "opening",
    text: `The United States spends more on healthcare than any nation on Earth — roughly $4.5 trillion annually, nearly 18% of GDP — yet ranks last among high-income nations on the Commonwealth Fund's health system performance index [Source 1]. This is not a system that is expensive because it is excellent. It is expensive because it is broken.\n\nThe core of the problem is administrative complexity. The US healthcare system employs more billing specialists than hospital beds. An estimated $350 billion per year is consumed by administrative waste — insurance company overhead, prior authorizations, claims processing, and the bureaucratic machinery required to maintain a fragmented multi-payer system [Source 2].\n\nA single-payer system would consolidate this fragmentation. When Taiwan transitioned to single-payer in 1995, administrative costs fell from 25% to 2% of total health spending, and coverage was extended to 99% of the population within a single year [Source 3]. The results were not merely financial — infant mortality dropped, life expectancy rose, and patient satisfaction reached 80% [Source 3].\n\nBeyond efficiency, there is a moral imperative. Today, 27 million Americans have no health insurance. Medical debt remains the leading cause of personal bankruptcy in the United States [Source 4]. In the wealthiest country in human history, no one should lose their home because they got sick. A single-payer system would guarantee coverage for every American, eliminate medical bankruptcy, and align the US with the universal coverage standard that every other developed nation has already achieved.`,
    citations: [
      {
        id: "Source 1",
        title:
          "Commonwealth Fund: Mirror, Mirror 2024 — International Health System Comparison",
        type: "web",
      },
      {
        id: "Source 2",
        title: "JAMA: Administrative Costs in US Healthcare System (2023)",
        type: "web",
      },
      {
        id: "Source 3",
        title: "WHO: Taiwan Health System Transition Case Study",
        type: "web",
      },
      {
        id: "Source 4",
        title: "KFF: Uninsured in America — 2024 Update",
        type: "web",
      },
    ],
  },
  {
    side: "con",
    phase: "opening",
    text: `The American healthcare system has real problems — costs are too high, coverage gaps exist, and administrative complexity is a genuine burden. I do not dispute these facts. The question is whether replacing the entire system with a government-run single-payer model is the right solution, and the evidence says it is not.\n\nFirst, consider what the current system produces despite its flaws. The United States accounts for 36% of all global biomedical R&D output [Source 5]. Eight of the world's ten largest pharmaceutical companies are headquartered in the US or conduct the majority of their research here. This is not a coincidence — it is a direct result of a pricing system that rewards the enormous financial risk of drug development. Countries with price controls benefit from American innovation without bearing its costs.\n\nSecond, the savings promised by single-payer advocates are dramatically overstated. The Mercatus Center estimated that Medicare for All would cost $32.6 trillion in new federal spending over ten years [Source 6]. Achieving the projected savings requires cutting provider reimbursement to Medicare rates — a 40% pay cut for hospitals and 30% for physicians. The political feasibility of this is near zero, and the practical consequence would be provider shortages and reduced access.\n\nThird, the wait time problem is not a talking point — it is a measurable reality. In Canada, the median wait time from specialist referral to treatment is 27.7 weeks [Source 7]. In the UK, 7.6 million people were on NHS waiting lists as of 2023 [Source 8]. These are systems where the government controls all funding, and when budgets tighten, patients wait.\n\nThe better path is a regulated multi-payer model — like Germany or Switzerland — that achieves universal coverage while preserving competition, innovation incentives, and patient choice.`,
    citations: [
      {
        id: "Source 5",
        title: "Nature Reviews: Global Distribution of Biomedical R&D (2024)",
        type: "web",
      },
      {
        id: "Source 6",
        title: "Mercatus Center: Cost Analysis of Medicare for All",
        type: "web",
      },
      {
        id: "Source 7",
        title: "Fraser Institute: Waiting Your Turn — Canadian Wait Times 2024",
        type: "web",
      },
      {
        id: "Source 8",
        title: "NHS England: Referral to Treatment Waiting Times (2023)",
        type: "web",
      },
    ],
  },
  // REBUTTALS (after each side evaluates the other's opening)
  {
    side: "pro",
    phase: "rebuttal",
    text: `My opponent raises three substantive challenges — innovation incentives, overstated savings, and wait times — and I want to engage with each at their strongest before explaining why they ultimately fail.\n\n**On innovation:** The claim that American drug pricing drives global R&D is the strongest argument against single-payer, and my opponent states it well. However, it conflates a specific pricing model with innovation capacity itself. The NIH already funds $47 billion annually in basic research — the foundational science on which private R&D builds [Source 9]. Germany and Switzerland, which my opponent cites as models, rank 2nd and 3rd globally in pharmaceutical patents per capita — and neither relies on American-style unregulated pricing. Innovation thrives on research funding and talent, not on the ability to charge $84,000 for a course of Sovaldi.\n\n**On savings:** My opponent cites the Mercatus Center's $32.6 trillion figure, but omits the study's own finding that Medicare for All would reduce total national health spending by $2 trillion over 10 years compared to the status quo [Source 10]. The $32.6 trillion is new *federal* spending — it replaces existing private spending, not adds to it. As for provider reimbursement cuts, the current system overpays for many services precisely because of administrative complexity. Simplifying the payment system itself reduces the cost of delivering care.\n\n**On wait times:** This is the most empirically honest challenge. But wait times are a function of funding levels, not system architecture. The UK's NHS wait times spiked after a decade of austerity cuts — they were half as long in 2010 before budget constraints were imposed [Source 11]. Australia's universal system maintains wait times comparable to the US for most procedures by allocating sufficient resources. The lesson is fund the system adequately, not avoid building one.`,
    citations: [
      {
        id: "Source 9",
        title: "NIH: Budget and Research Funding Overview 2024",
        type: "web",
      },
      {
        id: "Source 10",
        title:
          "Mercatus Center: Detailed Findings — Total National Health Expenditures Under M4A",
        type: "web",
      },
      {
        id: "Source 11",
        title: "BMJ: NHS Performance and Austerity — A Longitudinal Analysis",
        type: "web",
      },
    ],
  },
  {
    side: "con",
    phase: "rebuttal",
    text: `My opponent makes three sophisticated moves that deserve direct engagement: reframing innovation as about funding rather than pricing incentives, contextualizing the Mercatus figure as replacement spending, and attributing wait times to funding levels rather than structural design. Each is partially correct and ultimately insufficient.\n\n**On innovation reframing:** The Germany and Switzerland comparison actually undermines my opponent's case. Neither country has single-payer — both use regulated multi-payer systems with competing private insurers [Source 12]. If the evidence shows that universal coverage plus innovation is achievable, it points toward a multi-payer model, not single-payer. My opponent's own best examples argue against their own proposal.\n\n**On the Mercatus study:** My opponent is correct that total spending may decrease on paper. But the mechanism matters enormously. Achieving those savings requires providers to accept Medicare-level reimbursement rates for all patients. Currently, many hospitals depend on higher private-insurance payments to cross-subsidize Medicare patients. Eliminating private insurance removes that subsidy. A 2022 RAND study found that hospitals would face operating losses of 8-12% under universal Medicare rates [Source 13]. The likely result is not savings — it is hospital closures in rural and underserved communities, the exact populations single-payer aims to help.\n\n**On wait times and funding:** My opponent says the solution is to "fund the system adequately." This is the central vulnerability of single-payer: it assumes perpetual political will to fund healthcare at sufficient levels. But every single-payer system in the world has faced budget pressure, and patients bear the cost. In a multi-payer system, competitive pressure from insurers creates a structural incentive to maintain access — it does not depend on any government's budget priorities in any given year.\n\nThe multi-payer path achieves every goal my opponent values — universal coverage, reduced administration, protected innovation — without the catastrophic transition risks or the dependency on permanent political consensus.`,
    citations: [
      {
        id: "Source 12",
        title:
          "Commonwealth Fund: International Health System Profiles — Germany",
        type: "web",
      },
      {
        id: "Source 13",
        title:
          "RAND: Hospital Financial Impact of Medicare-Level Reimbursement (2022)",
        type: "web",
      },
    ],
  },
  // CLOSING STATEMENTS (after each side considers rebuttals)
  {
    side: "pro",
    phase: "closing",
    text: `My opponent has been an excellent advocate for the multi-payer alternative, and I want to acknowledge where this debate has genuinely narrowed. We agree that universal coverage is necessary, that administrative waste must be reduced, and that innovation must be preserved. The remaining disagreement is about mechanism.\n\nMy opponent argues that multi-payer achieves these goals with less risk. But this ignores the transition we are actually starting from. Germany and Switzerland built their multi-payer systems from the ground up over decades. The United States would be converting a system where 150 million people get insurance through their employers, where provider pricing varies by 300% across regions, and where insurance company market power creates local monopolies. Converting this into a well-regulated multi-payer system is not obviously simpler than converting to single-payer.\n\nHere is what single-payer offers that multi-payer cannot: a single risk pool covering all 330 million Americans, maximum bargaining power to negotiate drug and device prices, and the complete elimination of insurance-related medical bankruptcy. Every complication my opponent raises — provider rates, transition costs, political will — is a problem of implementation, not of principle. And implementation problems are solvable by competent governance.\n\nTwenty-seven million Americans are uninsured tonight. Sixty-six thousand will die this year from causes attributable to lack of coverage [Source 4]. The question is not whether we can afford single-payer. It is whether we can afford not to act.`,
    citations: [
      {
        id: "Source 4",
        title: "KFF: Uninsured in America — 2024 Update",
        type: "web",
      },
    ],
  },
  {
    side: "con",
    phase: "closing",
    text: `My opponent closes with moral urgency, and that urgency is real. People are dying because they lack coverage. This is not acceptable, and I have never argued otherwise.\n\nBut moral urgency does not excuse strategic recklessness. My opponent dismisses implementation concerns as "solvable by competent governance" — but implementation is where healthcare reform lives or dies. The Affordable Care Act's rollout nearly collapsed over a website. The VA system — the closest thing the US has to government-run healthcare — has faced decades of documented access failures. Assuming competent governance for a $4.5 trillion system transformation is not a plan; it is a hope.\n\nHere is what this debate has shown: single-payer's strongest arguments — reduced administration, universal coverage, cost savings — are all achievable through a regulated multi-payer model without betting the entire healthcare system on a single, irreversible transition. Germany covers 99.9% of its population through competing sickness funds. Switzerland achieves universal coverage with an individual mandate and regulated private insurers. Both preserve innovation, both control costs better than the US, and both did so without eliminating private insurance entirely.\n\nThe path to universal coverage in America runs through building on what works — expanding public options, regulating insurers, filling coverage gaps — not through dismantling the system and hoping the replacement works as designed. Reform should be urgent, pragmatic, and reversible. Single-payer is urgent and irreversible. I'll take the option that helps 27 million Americans without risking the care of the 300 million who are already covered.`,
    citations: [],
  },
];

const MOCK_SCORES = {
  pro: { logic: 4, evidence: 5, refutation: 4, steelman: 5 },
  con: { logic: 5, evidence: 4, refutation: 5, steelman: 4 },
};

function CitationBadge({ citation, isExpanded, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer border ${isExpanded ? "bg-emerald-700/50 text-emerald-200 border-emerald-500/50" : "bg-emerald-900/40 text-emerald-300 hover:bg-emerald-800/50 border-emerald-700/30"}`}
    >
      {citation.type === "web" ? "🌐" : "📄"} {citation.id}
    </button>
  );
}

function StreamingText({ text, speed = 8, onComplete }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idx = useRef(0);
  useEffect(() => {
    idx.current = 0;
    setDisplayed("");
    setDone(false);
    const iv = setInterval(() => {
      idx.current += 3;
      if (idx.current >= text.length) {
        setDisplayed(text);
        setDone(true);
        clearInterval(iv);
        onComplete?.();
      } else setDisplayed(text.slice(0, idx.current));
    }, speed);
    return () => clearInterval(iv);
  }, [text]);
  return (
    <span>
      {displayed}
      {!done && <span className="animate-pulse text-blue-400">▌</span>}
    </span>
  );
}

function ScoreBar({ label, proScore, conScore, weight }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>
          {label} <span className="text-gray-600">({weight})</span>
        </span>
        <span className="font-mono">
          <span className="text-blue-400">{proScore}</span> vs{" "}
          <span className="text-red-400">{conScore}</span>
        </span>
      </div>
      <div className="flex gap-1 h-2.5 rounded">
        <div className="flex-1 bg-gray-800 rounded-l overflow-hidden flex justify-end">
          <div
            className="bg-blue-500/80 transition-all duration-1000"
            style={{ width: `${proScore * 20}%` }}
          />
        </div>
        <div className="flex-1 bg-gray-800 rounded-r overflow-hidden">
          <div
            className="bg-red-500/80 transition-all duration-1000"
            style={{ width: `${conScore * 20}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ResearchAnimation({ side, queries, onComplete }) {
  const [visibleIdx, setVisibleIdx] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (visibleIdx < queries.length) {
      const t = setTimeout(() => setVisibleIdx((i) => i + 1), 700);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setDone(true);
        onComplete?.();
      }, 500);
      return () => clearTimeout(t);
    }
  }, [visibleIdx, queries.length]);
  const color = side === "pro" ? "blue" : "red";
  return (
    <div className="space-y-2">
      {queries.slice(0, visibleIdx).map((q, i) => (
        <div key={i} className="flex items-center gap-2 text-xs animate-in">
          <span className={`text-${color}-400`}>🔍</span>
          <span className="text-gray-400 flex-1 font-mono">{q.query}</span>
          <span className="text-emerald-400">{q.results} sources</span>
        </div>
      ))}
      {!done && visibleIdx < queries.length && (
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="animate-spin">⏳</span> Searching...
        </div>
      )}
      {done && (
        <div className={`text-xs text-${color}-400 font-medium mt-1`}>
          ✓ Research complete — {queries.reduce((s, q) => s + q.results, 0)}{" "}
          sources gathered
        </div>
      )}
    </div>
  );
}

function ArgumentCard({ turn, expandedCitation, setExpandedCitation }) {
  const renderText = (text, citations) => {
    return text.split(/(\[Source \d+\])/).map((part, j) => {
      const match = part.match(/\[Source (\d+)\]/);
      if (match) {
        const c = citations.find((c) => c.id === `Source ${match[1]}`);
        if (c)
          return (
            <CitationBadge
              key={j}
              citation={c}
              isExpanded={expandedCitation === c.id}
              onClick={() =>
                setExpandedCitation(expandedCitation === c.id ? null : c.id)
              }
            />
          );
      }
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={j} className="text-gray-200">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={j}>{part}</span>;
    });
  };

  const expandedCit = turn.citations?.find((c) => c.id === expandedCitation);

  return (
    <div className="mb-4">
      <div className="text-sm leading-relaxed text-gray-300 whitespace-pre-line">
        {renderText(turn.text, turn.citations || [])}
      </div>
      {expandedCit && (
        <div className="mt-2 p-3 bg-gray-800/80 rounded-lg border border-gray-700/50 text-xs">
          <div className="font-medium text-emerald-400 mb-1">
            🌐 {expandedCit.title}
          </div>
          <div className="text-gray-500">
            Full source excerpt would appear here with relevant passages
            highlighted for verification.
          </div>
        </div>
      )}
    </div>
  );
}

export default function DebateMeBroPrototype() {
  const [screen, setScreen] = useState("home");
  const [topic, setTopic] = useState("");
  const [activePhase, setActivePhase] = useState("research");
  const [currentTurnIdx, setCurrentTurnIdx] = useState(-1);
  const [completedTurns, setCompletedTurns] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [researchDone, setResearchDone] = useState({ pro: false, con: false });
  const [showResults, setShowResults] = useState(false);
  const [expandedCitation, setExpandedCitation] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [phaseTransition, setPhaseTransition] = useState(null);

  const startDebate = () => {
    if (!topic.trim()) return;
    setScreen("debate");
    setActivePhase("research");
    setCurrentTurnIdx(-1);
    setCompletedTurns([]);
    setStreaming(false);
    setResearchDone({ pro: false, con: false });
    setShowResults(false);
    setUserVote(null);
  };

  const advanceToNextTurn = () => {
    const nextIdx = currentTurnIdx + 1;
    if (nextIdx < MOCK_TURNS.length) {
      const nextTurn = MOCK_TURNS[nextIdx];
      const nextPhase = nextTurn.phase;
      if (nextPhase !== activePhase) {
        setPhaseTransition(nextPhase);
        setTimeout(() => {
          setActivePhase(nextPhase);
          setPhaseTransition(null);
          setCurrentTurnIdx(nextIdx);
          setStreaming(true);
        }, 1000);
      } else {
        setCurrentTurnIdx(nextIdx);
        setStreaming(true);
      }
    } else {
      setPhaseTransition("judging");
      setTimeout(() => {
        setActivePhase("judging");
        setPhaseTransition(null);
        setShowResults(true);
        setStreaming(false);
      }, 1000);
    }
  };

  const onResearchComplete = (side) => {
    setResearchDone((prev) => {
      const next = { ...prev, [side]: true };
      if (next.pro && next.con) {
        setTimeout(() => {
          setActivePhase("opening");
          setCurrentTurnIdx(0);
          setStreaming(true);
        }, 800);
      }
      return next;
    });
  };

  const onTurnComplete = () => {
    const turn = MOCK_TURNS[currentTurnIdx];
    setCompletedTurns((p) => [...p, turn]);
    setStreaming(false);
    setTimeout(advanceToNextTurn, 600);
  };

  const currentTurn = currentTurnIdx >= 0 ? MOCK_TURNS[currentTurnIdx] : null;
  const completedPhases = [...new Set(completedTurns.map((t) => t.phase))];
  if (researchDone.pro && researchDone.con) completedPhases.unshift("research");

  const proTurnsForPhase = completedTurns.filter(
    (t) => t.side === "pro" && t.phase === activePhase,
  );
  const conTurnsForPhase = completedTurns.filter(
    (t) => t.side === "con" && t.phase === activePhase,
  );
  const isProStreaming =
    streaming &&
    currentTurn?.side === "pro" &&
    currentTurn?.phase === activePhase;
  const isConStreaming =
    streaming &&
    currentTurn?.side === "con" &&
    currentTurn?.phase === activePhase;

  const phaseLabel = {
    research: "AI agents are researching both sides...",
    opening: "Opening Arguments",
    rebuttal: "Rebuttals — Each side responds to the other's opening",
    closing: "Closing Statements — Final synthesis",
    judging: "Judges are evaluating the debate...",
  };

  const evaluationMessages = {
    rebuttal:
      "Each agent is reviewing the opponent's opening argument and preparing a targeted response...",
    closing:
      "Each agent is considering all arguments and rebuttals to deliver a final synthesis...",
  };

  if (screen === "home") {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
        <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">
            🎯 DebateMeBro
          </span>
          <div className="flex items-center gap-3">
            <button className="text-sm text-gray-400 hover:text-white transition-colors">
              My Debates
            </button>
            <button className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors">
              Sign In
            </button>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent">
            See Both Sides. For Real.
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-lg">
            Two AI agents research, argue, and steelman both sides of any topic
            — scored by judges on logic, evidence, and intellectual honesty.
          </p>
          <div className="w-full max-w-xl">
            <div className="relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && startDebate()}
                placeholder="Enter a debate topic..."
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-4 text-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all"
              />
              <button
                onClick={startDebate}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                Debate It →
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {[
                "Should the US adopt universal healthcare?",
                "Is remote work better than in-office?",
                "Should AI-generated art be copyrightable?",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setTopic(s)}
                  className="text-xs text-gray-500 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full hover:text-gray-300 hover:border-gray-600 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-12 w-full max-w-lg">
            <div className="text-xs text-gray-600 mb-3 uppercase tracking-wider">
              How it works
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              {[
                "🔍 Research",
                "📖 Opening",
                "⚔️ Rebuttal",
                "🏁 Closing",
                "📊 Judging",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span>{step}</span>
                  {i < 4 && <span className="text-gray-700 ml-2">→</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-8 text-center">
            {[
              {
                icon: "🔍",
                title: "Real Research",
                desc: "Evidence from real sources, not hallucinations",
              },
              {
                icon: "⚖️",
                title: "Steelmanned",
                desc: "Each side represents the other at its strongest",
              },
              {
                icon: "📊",
                title: "Rubric-Scored",
                desc: "Transparent judging across 4 criteria",
              },
            ].map((f) => (
              <div key={f.title}>
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="font-medium text-sm mb-1">{f.title}</div>
                <div className="text-xs text-gray-500">{f.desc}</div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => setScreen("home")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="text-lg font-bold">🎯 DebateMeBro</span>
        </button>
        <div className="flex-1 text-center px-4">
          <span className="text-sm text-gray-400 font-medium">{topic}</span>
        </div>
        {(streaming || activePhase === "research") && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />{" "}
            Live
          </span>
        )}
      </header>

      {/* Position Banner */}
      <div className="px-4 py-2 bg-gray-900/30 border-b border-gray-800 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <span className="text-gray-500">
            <strong className="text-blue-400">PRO:</strong>{" "}
            {PRO_POSITION.slice(0, 90)}...
          </span>
        </div>
        <div className="text-gray-700">vs</div>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          <span className="text-gray-500">
            <strong className="text-red-400">CON:</strong>{" "}
            {CON_POSITION.slice(0, 90)}...
          </span>
        </div>
      </div>

      {/* Phase Navigation */}
      <div className="flex items-center gap-1 px-4 py-2 bg-gray-900/50 border-b border-gray-800">
        {PHASES.map((phase, i) => {
          const isActive = activePhase === phase.id;
          const isComplete =
            phase.id === "research"
              ? researchDone.pro && researchDone.con
              : phase.id === "judging"
                ? showResults
                : completedTurns.some((t) => t.phase === phase.id);
          const isFuture = !isActive && !isComplete;
          return (
            <div key={phase.id} className="flex items-center">
              <button
                onClick={() => {
                  if (isComplete || isActive) setActivePhase(phase.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${isActive ? "bg-gray-700 text-white" : isComplete ? "text-emerald-400 hover:bg-gray-800 cursor-pointer" : "text-gray-600 cursor-default"}`}
              >
                {isComplete && !isActive ? "✓" : phase.icon} {phase.label}
              </button>
              {i < PHASES.length - 1 && (
                <span className="text-gray-700 mx-1">›</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Phase Transition Overlay */}
      {phaseTransition && (
        <div className="px-4 py-3 bg-purple-900/20 border-b border-purple-800/30 text-center">
          <span className="text-sm text-purple-300 animate-pulse">
            {evaluationMessages[phaseTransition] ||
              `Moving to ${PHASES.find((p) => p.id === phaseTransition)?.label}...`}
          </span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {activePhase === "research" && (
          <div className="flex-1 flex">
            <div className="flex-1 border-r border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                  P
                </div>
                <div>
                  <div className="text-sm font-semibold text-blue-400">
                    Pro Research
                  </div>
                  <div className="text-xs text-gray-500">
                    Gathering evidence for the Pro position
                  </div>
                </div>
              </div>
              <ResearchAnimation
                side="pro"
                queries={MOCK_RESEARCH.pro}
                onComplete={() => onResearchComplete("pro")}
              />
            </div>
            <div className="flex-1 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-sm font-bold">
                  C
                </div>
                <div>
                  <div className="text-sm font-semibold text-red-400">
                    Con Research
                  </div>
                  <div className="text-xs text-gray-500">
                    Gathering evidence for the Con position
                  </div>
                </div>
              </div>
              <ResearchAnimation
                side="con"
                queries={MOCK_RESEARCH.con}
                onComplete={() => onResearchComplete("con")}
              />
            </div>
          </div>
        )}

        {activePhase === "judging" && showResults && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-200 mb-1">
                📊 Judging Results
              </h3>
              <p className="text-xs text-gray-500 mb-6">
                3 AI judges evaluated the debate with position-swapped
                verification. 2/3 judges produced consistent results.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-4">
                    <span className="text-blue-400 font-medium">← Pro</span>
                    <span className="text-red-400 font-medium">Con →</span>
                  </div>
                  <ScoreBar
                    label="Logical Validity"
                    weight="30%"
                    proScore={MOCK_SCORES.pro.logic}
                    conScore={MOCK_SCORES.con.logic}
                  />
                  <ScoreBar
                    label="Evidence Quality"
                    weight="25%"
                    proScore={MOCK_SCORES.pro.evidence}
                    conScore={MOCK_SCORES.con.evidence}
                  />
                  <ScoreBar
                    label="Refutation Strength"
                    weight="25%"
                    proScore={MOCK_SCORES.pro.refutation}
                    conScore={MOCK_SCORES.con.refutation}
                  />
                  <ScoreBar
                    label="Steelmanning Quality"
                    weight="20%"
                    proScore={MOCK_SCORES.pro.steelman}
                    conScore={MOCK_SCORES.con.steelman}
                  />
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Weighted Total</span>
                      <span className="font-mono">
                        <span className="text-blue-400">
                          {(
                            MOCK_SCORES.pro.logic * 0.3 +
                            MOCK_SCORES.pro.evidence * 0.25 +
                            MOCK_SCORES.pro.refutation * 0.25 +
                            MOCK_SCORES.pro.steelman * 0.2
                          ).toFixed(1)}
                        </span>
                        {" vs "}
                        <span className="text-red-400">
                          {(
                            MOCK_SCORES.con.logic * 0.3 +
                            MOCK_SCORES.con.evidence * 0.25 +
                            MOCK_SCORES.con.refutation * 0.25 +
                            MOCK_SCORES.con.steelman * 0.2
                          ).toFixed(1)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
                    Your Vote
                  </div>
                  <div className="flex gap-3 mb-4">
                    <button
                      onClick={() => setUserVote("pro")}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${userVote === "pro" ? "bg-blue-600 text-white ring-2 ring-blue-400/30" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                    >
                      👍 Pro Wins
                    </button>
                    <button
                      onClick={() => setUserVote("con")}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${userVote === "con" ? "bg-red-600 text-white ring-2 ring-red-400/30" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                    >
                      👍 Con Wins
                    </button>
                  </div>
                  {userVote && (
                    <div className="text-xs text-gray-500 p-3 bg-gray-800/50 rounded-lg mb-3">
                      <div className="font-medium text-gray-300 mb-1">
                        Vote recorded!
                      </div>
                      Human votes: 47% Pro · 53% Con (23 total)
                      <br />
                      Weighting: 60% AI judges · 40% human votes
                    </div>
                  )}
                  <div className="p-3 bg-gray-800/50 rounded-lg mb-3">
                    <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                      AI Judges Verdict
                    </div>
                    <div className="text-sm text-gray-300">
                      <strong className="text-yellow-400">
                        Extremely close debate.
                      </strong>{" "}
                      Pro excelled at steelmanning and evidence breadth. Con
                      demonstrated stronger logical structure and more effective
                      rebuttals. Position-swap check: 2/3 judges consistent.
                    </div>
                  </div>
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                      Judge Reasoning (Logic Judge)
                    </div>
                    <div className="text-xs text-gray-400 leading-relaxed">
                      Con's reframing of Pro's own Germany/Switzerland examples
                      to undermine the single-payer case was the strongest
                      logical move in the debate. Pro's closing appeal to moral
                      urgency was powerful but did not fully address the
                      implementation feasibility concerns raised in Con's
                      rebuttal.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {["opening", "rebuttal", "closing"].includes(activePhase) && (
          <>
            {/* PRO Side */}
            <div className="flex-1 border-r border-gray-800 overflow-y-auto p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                  P
                </div>
                <div>
                  <div className="text-sm font-semibold text-blue-400">
                    Pro Agent
                  </div>
                  <div className="text-xs text-gray-500">
                    Constitutional Law Professor
                  </div>
                </div>
              </div>

              {proTurnsForPhase.map((turn, i) => (
                <ArgumentCard
                  key={i}
                  turn={turn}
                  expandedCitation={expandedCitation}
                  setExpandedCitation={setExpandedCitation}
                />
              ))}

              {isProStreaming && (
                <div className="text-sm leading-relaxed text-gray-300">
                  <StreamingText
                    text={currentTurn.text
                      .replace(/\[Source \d+\]/g, "")
                      .replace(/\*\*/g, "")}
                    speed={6}
                    onComplete={onTurnComplete}
                  />
                </div>
              )}

              {!isProStreaming && proTurnsForPhase.length === 0 && (
                <div className="text-gray-600 text-sm italic flex items-center gap-2">
                  <span className="animate-pulse">⏳</span>{" "}
                  {activePhase === "rebuttal"
                    ? "Analyzing Con's opening argument..."
                    : activePhase === "closing"
                      ? "Preparing final synthesis..."
                      : "Preparing opening argument..."}
                </div>
              )}
            </div>

            {/* CON Side */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-sm font-bold">
                  C
                </div>
                <div>
                  <div className="text-sm font-semibold text-red-400">
                    Con Agent
                  </div>
                  <div className="text-xs text-gray-500">Policy Economist</div>
                </div>
              </div>

              {conTurnsForPhase.map((turn, i) => (
                <ArgumentCard
                  key={i}
                  turn={turn}
                  expandedCitation={expandedCitation}
                  setExpandedCitation={setExpandedCitation}
                />
              ))}

              {isConStreaming && (
                <div className="text-sm leading-relaxed text-gray-300">
                  <StreamingText
                    text={currentTurn.text
                      .replace(/\[Source \d+\]/g, "")
                      .replace(/\*\*/g, "")}
                    speed={6}
                    onComplete={onTurnComplete}
                  />
                </div>
              )}

              {!isConStreaming && conTurnsForPhase.length === 0 && (
                <div className="text-gray-600 text-sm italic flex items-center gap-2">
                  <span className="animate-pulse">⏳</span> Waiting for Pro to
                  finish...
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Phase Status Bar */}
      <div className="border-t border-gray-800 px-4 py-2 bg-gray-900/50 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {PHASES.find((p) => p.id === activePhase)?.icon}{" "}
          {phaseLabel[activePhase]}
        </div>
        <div className="flex items-center gap-3">
          {completedTurns.length > 0 && (
            <span className="text-xs text-gray-600">
              {completedTurns.length}/{MOCK_TURNS.length} arguments delivered
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
