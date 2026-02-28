import { useState, useEffect, useRef } from "react";

const MOCK_TOPIC = "Should the United States adopt universal healthcare?";
const PRO_POSITION = "The US should implement a single-payer universal healthcare system to ensure equitable access, reduce administrative costs, and improve population health outcomes.";
const CON_POSITION = "The US should preserve its market-based healthcare system, which drives medical innovation, offers patient choice, and avoids the inefficiencies and rationing seen in government-run systems.";

const PHASES = [
  { id: "research", label: "Research", icon: "🔍", internal: false },
  { id: "opening", label: "Opening", icon: "📖", internal: false },
  { id: "eval_opening", label: "Evaluation", icon: "🧠", internal: true },
  { id: "rebuttal", label: "Rebuttal", icon: "⚔️", internal: false },
  { id: "eval_full", label: "Evaluation", icon: "🧠", internal: true },
  { id: "closing", label: "Closing", icon: "🏁", internal: false },
  { id: "judging", label: "Judging", icon: "📊", internal: false },
];

const MOCK_PERSONAS = {
  pro: { name: "Dr. Amara Osei", role: "Public Health Policy Researcher", color: "blue" },
  con: { name: "Dr. James Whitfield", role: "Health Systems Economist", color: "red" },
};

const MOCK_RESEARCH_QUERIES = [
  { query: "Loading Pro + Con research documents...", results: "2 documents" },
  { query: "Building citation index...", results: "47 sources" },
  { query: "Extracting argument dimensions...", results: "8 dimensions" },
  { query: "Both agents consulting all research...", results: "shared pool" },
];

const MOCK_STRATEGIC_ANALYSIS = {
  pro_research: `**Strongest arguments:** (1) Administrative cost savings — JAMA 2023 study estimates $350B/yr in waste. Strong primary data. (2) Taiwan transition case — WHO longitudinal data shows coverage expansion + cost reduction. Hard to refute.\n\n**Vulnerabilities:** Innovation incentive argument is genuinely strong for opponent. US does lead in pharma R&D. Need to reframe as funding-mechanism issue, not pricing issue.\n\n**Opponent's likely strategy:** Will lead with innovation + wait times + transition costs (Mercatus $32T figure). The Mercatus study is their strongest weapon but has an exploitable detail — it actually shows total spending decreases.\n\n**Citation plan:** Lead with Commonwealth Fund ranking, JAMA admin costs, WHO Taiwan data. Hold NIH funding data and Mercatus detailed findings for rebuttal.`,
  con_research: `**Strongest arguments:** (1) Innovation incentives — Nature 2024 data on US share of global R&D is strong primary evidence. (2) Implementation risk — VA system failures and ACA rollout problems are concrete examples.\n\n**Vulnerabilities:** The "27 million uninsured" moral argument is hard to counter directly. Need to redirect to multi-payer alternatives (Germany/Switzerland) that achieve coverage without single-payer.\n\n**Opponent's likely strategy:** Will lead with moral framing + administrative waste + Taiwan example. The Taiwan example is strong but can be countered on scale differences. They'll probably cite Commonwealth Fund ranking.\n\n**Citation plan:** Lead with Nature R&D data, Mercatus cost analysis, Fraser Institute wait times. Hold Germany/Switzerland comparison and RAND hospital impact study for rebuttal.`,
  pro_eval: `**Their strongest point:** The innovation incentive argument backed by Nature 2024 data. US genuinely does account for 36% of global biomedical R&D. This is the hardest claim to counter.\n\n**Their weakest point:** They cited Germany and Switzerland as alternatives to single-payer — but this actually undermines their own "market-based" framing since both systems are heavily regulated with individual mandates.\n\n**Rebuttal strategy:** Steelman the innovation point, then reframe. Concede US leads in R&D, but show it's driven by NIH funding, not unregulated pricing. Use their own Germany/Switzerland examples against them.`,
  con_eval: `**Their strongest point:** The administrative waste argument ($350B/yr from JAMA) is well-sourced and specific. Hard to challenge the data directly.\n\n**Their weakest point:** They dismiss implementation concerns as "solvable by competent governance" — this is hand-waving, not evidence. The VA and ACA examples are concrete counterpoints.\n\n**Rebuttal strategy:** Steelman the admin waste point (it's real), then pivot to why single-payer isn't the only solution. Multi-payer achieves the same admin savings goal without the transition catastrophe. Use their Germany/Switzerland citation against them.`,
};

const MOCK_TURNS = [
  {
    side: "pro", phase: "opening",
    text: `The United States spends more on healthcare than any nation on Earth — roughly $4.5 trillion annually, nearly 18% of GDP — yet ranks last among high-income nations on the Commonwealth Fund's health system performance index [Source: Commonwealth Fund Mirror Mirror 2024]. This is not a system that is expensive because it is excellent. It is expensive because it is broken.\n\nThe core of the problem is administrative complexity. The US healthcare system employs more billing specialists than hospital beds. An estimated $350 billion per year is consumed by administrative waste — insurance company overhead, prior authorizations, claims processing, and the bureaucratic machinery required to maintain a fragmented multi-payer system [Source: JAMA Administrative Costs 2023].\n\nA single-payer system would consolidate this fragmentation. When Taiwan transitioned to single-payer in 1995, administrative costs fell from 25% to 2% of total health spending, and coverage was extended to 99% of the population within a single year [Source: WHO Taiwan Health System Transition]. The results were not merely financial — infant mortality dropped, life expectancy rose, and patient satisfaction reached 80%.\n\nBeyond efficiency, there is a moral imperative that we cannot afford to ignore. Today, 27 million Americans have no health insurance. Medical debt remains the leading cause of personal bankruptcy in the United States [Source: KFF Uninsured in America 2024]. In the wealthiest country in human history, no one should lose their home because they got sick. A single-payer system would guarantee coverage for every American, eliminate medical bankruptcy, and align the US with the universal coverage standard that every other developed nation has already achieved.\n\nThe question is not whether we can afford single-payer healthcare. The question is whether we can afford to continue with a system that spends more than any other country on earth while leaving millions without coverage and producing worse health outcomes than nations spending half as much.`,
    citations: [
      { id: "Commonwealth Fund Mirror Mirror 2024", url: "https://www.commonwealthfund.org/publications/fund-reports/2024/sep/mirror-mirror-2024", type: "web" },
      { id: "JAMA Administrative Costs 2023", url: "https://jamanetwork.com/journals/jama/article-abstract/2785479", type: "web" },
      { id: "WHO Taiwan Health System Transition", url: "https://www.who.int/publications/i/item/taiwan-health-system", type: "web" },
      { id: "KFF Uninsured in America 2024", url: "https://www.kff.org/uninsured/issue-brief/key-facts-2024", type: "web" },
    ]
  },
  {
    side: "con", phase: "opening",
    text: `The American healthcare system has real problems — costs are too high, coverage gaps exist, and administrative complexity is a genuine burden. I do not dispute these facts. The question is whether replacing the entire system with a government-run single-payer model is the right solution, and the evidence strongly suggests it is not.\n\nFirst, consider what the current system produces despite its flaws. The United States accounts for 36% of all global biomedical R&D output [Source: Nature Reviews Global Biomedical R&D 2024]. Eight of the world's ten largest pharmaceutical companies are headquartered in the US or conduct the majority of their research here. This is not coincidence — it is a direct result of a pricing system that rewards the enormous financial risk of drug development. Countries with price controls benefit from American innovation without bearing its costs. Every major breakthrough in cancer immunotherapy, mRNA vaccines, and gene therapy emerged from this ecosystem.\n\nSecond, the savings promised by single-payer advocates are dramatically overstated. The Mercatus Center estimated that Medicare for All would require $32.6 trillion in new federal spending over ten years [Source: Mercatus Center Medicare for All Analysis]. Achieving the projected savings requires cutting provider reimbursement to Medicare rates — a 40% pay cut for hospitals and 30% for physicians. The political feasibility of this is near zero, and the practical consequence would be provider shortages and hospital closures in exactly the rural and underserved communities single-payer aims to help.\n\nThird, the wait time problem is not a talking point — it is a measurable reality. In Canada, the median wait time from specialist referral to treatment is 27.7 weeks [Source: Fraser Institute Wait Times 2024]. In the UK, 7.6 million people were on NHS waiting lists as of 2023 [Source: NHS England Waiting Times 2023]. These are systems where the government controls all funding, and when budgets tighten — as they inevitably do — patients wait.\n\nThe better path forward is not to demolish the system and hope the replacement works. It is a regulated multi-payer model — like Germany or Switzerland — that achieves universal coverage while preserving competition, innovation incentives, and patient choice. Both countries cover over 99% of their populations through competing regulated insurers, maintain strong innovation sectors, and avoid the catastrophic wait times plaguing single-payer systems.`,
    citations: [
      { id: "Nature Reviews Global Biomedical R&D 2024", url: "https://www.nature.com/articles/s41573-024-biomedical-rd", type: "web" },
      { id: "Mercatus Center Medicare for All Analysis", url: "https://www.mercatus.org/research/working-papers/costs-national-single-payer", type: "web" },
      { id: "Fraser Institute Wait Times 2024", url: "https://www.fraserinstitute.org/studies/waiting-your-turn-2024", type: "web" },
      { id: "NHS England Waiting Times 2023", url: "https://www.england.nhs.uk/statistics/statistical-work-areas/rtt-waiting-times/", type: "web" },
    ]
  },
  {
    side: "pro", phase: "rebuttal",
    text: `My opponent raises three substantive challenges — innovation incentives, overstated savings, and wait times — and I want to engage with each at their strongest before explaining why they ultimately fail to defeat the case for single-payer.\n\n**The innovation argument is the strongest case against my position, and I take it seriously.** My opponent is correct that the US accounts for 36% of global biomedical R&D, and the Nature data backing this claim is solid. This is not a trivial point. However, it conflates a specific pricing model with innovation capacity itself. The National Institutes of Health already funds $47 billion annually in basic research — the foundational science on which private pharmaceutical R&D builds [Source: NIH Budget Overview 2024]. Private companies develop drugs; public funding discovers the science that makes those drugs possible. Germany and Switzerland — which my opponent cites as model alternatives — rank 2nd and 3rd globally in pharmaceutical patents per capita, and neither relies on American-style unregulated pricing. Innovation thrives on research funding and talent ecosystems, not on the ability to charge $84,000 for a course of Sovaldi.\n\n**On savings, my opponent misrepresents their own source.** The Mercatus Center's $32.6 trillion figure is new *federal* spending — it replaces existing private spending, it does not add to it. The same study found that Medicare for All would reduce total national health spending by $2 trillion over 10 years compared to the status quo [Source: Mercatus Center Detailed Findings]. My opponent cited this study but omitted its central finding. As for provider reimbursement cuts, the current system overpays for many services precisely because of administrative complexity. Simplifying the payment system reduces the cost of delivering care, partially offsetting reimbursement reductions.\n\n**On wait times, this is the most honest empirical challenge.** But wait times are a function of funding levels, not system architecture. The UK's NHS wait times spiked after a decade of austerity cuts — they were half as long in 2010 before budget constraints were imposed [Source: BMJ NHS Austerity Analysis]. Australia's universal system maintains wait times comparable to the US for most procedures by allocating sufficient resources. The lesson is to fund the system adequately, not to avoid building one.\n\nFinally, I note that my opponent's own preferred solution undermines their framing. Germany and Switzerland are not "market-based" systems — they are heavily regulated, with individual mandates, community rating, and standardized benefit packages. They are closer to the ACA on steroids than to the current US system. If my opponent is arguing for Germany's model, we agree on far more than we disagree — the debate is about implementation details, not fundamental direction.`,
    citations: [
      { id: "NIH Budget Overview 2024", url: "https://www.nih.gov/about-nih/what-we-do/budget", type: "web" },
      { id: "Mercatus Center Detailed Findings", url: "https://www.mercatus.org/research/working-papers/costs-national-single-payer", type: "web" },
      { id: "BMJ NHS Austerity Analysis", url: "https://www.bmj.com/content/373/bmj.n1314", type: "web" },
    ]
  },
  {
    side: "con", phase: "rebuttal",
    text: `My opponent makes three sophisticated moves that deserve direct engagement: reframing innovation as about public funding rather than pricing incentives, contextualizing the Mercatus figure as replacement spending, and attributing wait times to funding levels rather than structural design. Each is partially correct — and ultimately insufficient.\n\n**I'll steelman my opponent's strongest move: the Mercatus reframing.** My opponent is correct that the $32.6 trillion represents new federal spending replacing existing private spending, and that the study projects a net reduction in total national health expenditures. I concede this point narrowly — on paper, total spending may decrease. But the mechanism matters enormously for whether this works in practice. Achieving those savings requires every hospital and physician in America to accept Medicare-level reimbursement for all patients. Currently, many hospitals depend on higher private-insurance payments to cross-subsidize Medicare patients. A 2022 RAND Corporation study found that hospitals would face operating losses of 8-12% under universal Medicare rates [Source: RAND Hospital Financial Impact 2022]. This is not an abstract concern — it means hospital closures, particularly in rural and underserved communities. The people single-payer aims to help would be the first to lose access.\n\n**On innovation reframing: my opponent's own examples argue against single-payer.** The Germany and Switzerland comparison actually undermines the single-payer case entirely. Neither country has single-payer — both use regulated multi-payer systems with competing private insurers [Source: Commonwealth Fund Germany Profile]. If the evidence shows that universal coverage plus innovation is achievable through regulated multi-payer systems, why take the vastly more disruptive single-payer path? My opponent tries to claim we agree on fundamentals — but the difference between single-payer and regulated multi-payer is not an "implementation detail." It is the difference between eliminating an entire industry overnight and reforming it incrementally.\n\n**On wait times and funding adequacy: this is the core vulnerability of single-payer that my opponent cannot resolve.** My opponent says the solution is to "fund the system adequately." This assumes perpetual political will to fund healthcare at sufficient levels through every administration, every recession, every competing budget priority. But every single-payer system in the world has faced exactly this pressure, and patients bore the cost. In a multi-payer system, competitive pressure from insurers creates a structural incentive to maintain access — it does not depend on any government's budget priorities in any given year.\n\nThe path to universal coverage in America runs through building on what works — expanding public options, regulating insurers, filling coverage gaps — not through dismantling the entire system and hoping the replacement works as designed. Reform should be urgent, pragmatic, and reversible. Single-payer is urgent and irreversible. I'll take the path that helps 27 million uninsured Americans without gambling the care of the 300 million who are already covered.`,
    citations: [
      { id: "RAND Hospital Financial Impact 2022", url: "https://www.rand.org/pubs/research_reports/RR4394.html", type: "web" },
      { id: "Commonwealth Fund Germany Profile", url: "https://www.commonwealthfund.org/international-health-policy-center/countries/germany", type: "web" },
    ]
  },
  {
    side: "pro", phase: "closing",
    text: `My opponent has been a formidable advocate, and I want to acknowledge where this debate has genuinely narrowed. We agree that universal coverage is necessary, that administrative waste must be reduced, and that innovation must be preserved. The implementation risk my opponent raises — particularly the RAND data on hospital operating losses under Medicare rates — is a serious concern that any honest single-payer advocate must address rather than dismiss.\n\nBut here is what this debate has revealed: my opponent's own preferred solution proves my fundamental point. Germany and Switzerland achieved universal coverage not through free markets, but through heavy regulation, individual mandates, community rating, and standardized benefits — the exact mechanisms that American opponents of healthcare reform have fought against for decades. If my opponent is arguing for the German model, then we agree that the current American system is fundamentally broken and requires transformative structural reform. The remaining question is how much transformation.\n\nI believe the evidence favors going further, for three reasons my opponent has not successfully countered. First, the administrative savings from single-payer are real, massive, and documented — $350 billion annually that a multi-payer system, no matter how well regulated, cannot fully capture because it preserves the fragmentation that generates the waste [Source: JAMA Administrative Costs 2023]. Second, the innovation argument, while genuinely the strongest case against single-payer, misidentifies the engine of American biomedical innovation: it is publicly funded basic research, not unregulated drug pricing, that drives breakthrough science [Source: NIH Budget Overview 2024]. Third, the moral urgency is not an abstraction — twenty-seven million Americans are uninsured tonight, and sixty-six thousand will die this year from causes attributable to lack of coverage.\n\nMy opponent asks us to choose the cautious path. But caution has a cost too. Every year we delay universal coverage, thousands die and millions go bankrupt from medical debt. The multi-payer path my opponent favors is not wrong — but it is slower, captures fewer savings, and has been politically impossible in the American context for decades. Single-payer is not a gamble. It is what every other developed nation figured out long ago. It is time for the United States to join them.`,
    citations: [
      { id: "JAMA Administrative Costs 2023", url: "https://jamanetwork.com/journals/jama/article-abstract/2785479", type: "web" },
      { id: "NIH Budget Overview 2024", url: "https://www.nih.gov/about-nih/what-we-do/budget", type: "web" },
    ]
  },
  {
    side: "con", phase: "closing",
    text: `My opponent closes with moral urgency, and that urgency is real. People are dying because they lack coverage, and people are going bankrupt from medical debt. This is not acceptable, and I have never argued otherwise.\n\nBut moral urgency does not excuse strategic recklessness. My opponent dismisses implementation concerns as secondary to the goal — but implementation is where healthcare reform lives or dies. The Affordable Care Act's rollout nearly collapsed over a website. The VA system — the closest thing the US has to government-run healthcare — has faced decades of documented access failures. These are not hypotheticals. They are the track record of American government managing healthcare delivery.\n\nHere is what this debate has actually shown. My opponent's strongest argument — administrative savings — is real but overstated as a case for single-payer specifically. A well-regulated multi-payer system captures the majority of those savings (Germany spends 12% on administration versus America's 34%) without requiring the elimination of an entire industry and the assumption of $4.5 trillion in annual federal obligations. My opponent's moral argument is powerful but applies equally to any path to universal coverage, not single-payer specifically. And my opponent's weakest moment was dismissing the implementation question as a matter of "competent governance" — precisely the assumption that has failed repeatedly in American healthcare policy.\n\nThe Germany model is not my consolation prize — it is the empirically superior path. It achieves 99.9% coverage. It preserves innovation. It maintains competitive pressure on insurers to deliver quality care. And critically, it is achievable incrementally — through expanding public options, tightening insurer regulations, and filling coverage gaps — without betting the entire healthcare system on a single, irreversible transformation that has never been attempted at American scale.\n\nReform should be urgent. Reform should be universal. But reform should also be reversible and resilient. Single-payer offers urgency at the cost of resilience. The multi-payer path offers both — and the evidence from every successful multi-payer system in the world proves it works. Let us choose the path that actually reaches the destination, not the one that sounds most dramatic.`,
    citations: []
  },
];

const MOCK_SCORES = {
  pro: { logic: 4, evidence: 5, refutation: 4, steelman: 5 },
  con: { logic: 5, evidence: 4, refutation: 5, steelman: 4 },
};

function CitationBadge({ citation, isExpanded, onClick }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer border ${isExpanded ? "bg-emerald-700/50 text-emerald-200 border-emerald-500/50" : "bg-emerald-900/40 text-emerald-300 hover:bg-emerald-800/50 border-emerald-700/30"}`}
    >
      🌐 {citation.id.length > 35 ? citation.id.slice(0, 35) + "..." : citation.id}
    </button>
  );
}

function StreamingText({ text, speed = 5, onComplete }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idx = useRef(0);
  useEffect(() => {
    idx.current = 0; setDisplayed(""); setDone(false);
    const iv = setInterval(() => {
      idx.current += 4;
      if (idx.current >= text.length) { setDisplayed(text); setDone(true); clearInterval(iv); onComplete?.(); }
      else setDisplayed(text.slice(0, idx.current));
    }, speed);
    return () => clearInterval(iv);
  }, [text]);
  return <span>{displayed}{!done && <span className="animate-pulse text-blue-400">▌</span>}</span>;
}

function ScoreBar({ label, proScore, conScore, weight }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label} <span className="text-gray-600">({weight})</span></span>
        <span className="font-mono"><span className="text-blue-400">{proScore}</span> vs <span className="text-red-400">{conScore}</span></span>
      </div>
      <div className="flex gap-1 h-2.5 rounded">
        <div className="flex-1 bg-gray-800 rounded-l overflow-hidden flex justify-end">
          <div className="bg-blue-500/80 transition-all duration-1000" style={{ width: `${proScore * 20}%` }} />
        </div>
        <div className="flex-1 bg-gray-800 rounded-r overflow-hidden">
          <div className="bg-red-500/80 transition-all duration-1000" style={{ width: `${conScore * 20}%` }} />
        </div>
      </div>
    </div>
  );
}

function StrategicAnalysisPanel({ content, side }) {
  const [expanded, setExpanded] = useState(false);
  const color = side === "pro" ? "blue" : "red";
  return (
    <div className={`mt-2 border border-${color}-900/30 rounded-lg overflow-hidden`}>
      <button onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-xs bg-gray-900/60 hover:bg-gray-800/60 transition-colors text-${color}-400`}
      >
        <span>🧠</span>
        <span>{expanded ? "Hide" : "Show"} strategic analysis</span>
        <span className="ml-auto text-gray-600">{expanded ? "▼" : "▶"}</span>
      </button>
      {expanded && (
        <div className="px-3 py-2 text-xs text-gray-400 font-mono leading-relaxed whitespace-pre-line bg-gray-950/50">
          {content}
        </div>
      )}
    </div>
  );
}

function ResearchAnimation({ onComplete }) {
  const [visIdx, setVisIdx] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (visIdx < MOCK_RESEARCH_QUERIES.length) {
      const t = setTimeout(() => setVisIdx(i => i + 1), 600);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => { setDone(true); onComplete?.(); }, 500);
      return () => clearTimeout(t);
    }
  }, [visIdx]);
  return (
    <div className="max-w-lg mx-auto space-y-2">
      {MOCK_RESEARCH_QUERIES.slice(0, visIdx).map((q, i) => (
        <div key={i} className="flex items-center gap-3 text-xs">
          <span className="text-purple-400">🔍</span>
          <span className="text-gray-400 flex-1">{q.query}</span>
          <span className="text-emerald-400 font-mono">{q.results}</span>
        </div>
      ))}
      {!done && visIdx < MOCK_RESEARCH_QUERIES.length && (
        <div className="flex items-center gap-2 text-xs text-gray-600"><span className="animate-spin">⏳</span> Loading...</div>
      )}
      {done && <div className="text-xs text-emerald-400 font-medium mt-2">✓ Both agents have consulted all research — shared evidence pool active</div>}
    </div>
  );
}

function ArgumentCard({ turn, expandedCitation, setExpandedCitation }) {
  const renderText = (text, citations) => {
    return text.split(/(\[Source: [^\]]+\])/).map((part, j) => {
      const match = part.match(/\[Source: ([^\]]+)\]/);
      if (match) {
        const c = citations.find(c => c.id === match[1]);
        if (c) return <CitationBadge key={j} citation={c} isExpanded={expandedCitation === c.id} onClick={() => setExpandedCitation(expandedCitation === c.id ? null : c.id)} />;
        return <span key={j} className="text-emerald-400 text-xs">[{match[1]}]</span>;
      }
      if (part.startsWith("**") && part.endsWith("**")) return <strong key={j} className="text-gray-200">{part.slice(2, -2)}</strong>;
      return <span key={j}>{part}</span>;
    });
  };
  const expandedCit = turn.citations?.find(c => c.id === expandedCitation);
  return (
    <div className="mb-4">
      <div className="text-sm leading-relaxed text-gray-300 whitespace-pre-line">{renderText(turn.text, turn.citations || [])}</div>
      {expandedCit && (
        <div className="mt-2 p-3 bg-gray-800/80 rounded-lg border border-gray-700/50 text-xs">
          <div className="font-medium text-emerald-400 mb-1">🌐 {expandedCit.id}</div>
          <a href={expandedCit.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">{expandedCit.url}</a>
          <div className="text-gray-500 mt-1">Click to verify source. Citation matched from research documents.</div>
        </div>
      )}
    </div>
  );
}

export default function DebateMeBro() {
  const [screen, setScreen] = useState("home");
  const [topic, setTopic] = useState("");
  const [activePhase, setActivePhase] = useState("research");
  const [currentTurnIdx, setCurrentTurnIdx] = useState(-1);
  const [completedTurns, setCompletedTurns] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [researchDone, setResearchDone] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [expandedCitation, setExpandedCitation] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [phaseTransition, setPhaseTransition] = useState(null);
  const [internalPhasesDone, setInternalPhasesDone] = useState({ eval_opening: false, eval_full: false });

  const startDebate = () => {
    if (!topic.trim()) return;
    setScreen("debate");
    setActivePhase("research");
    setCurrentTurnIdx(-1);
    setCompletedTurns([]);
    setStreaming(false);
    setResearchDone(false);
    setShowResults(false);
    setUserVote(null);
    setInternalPhasesDone({ eval_opening: false, eval_full: false });
  };

  const advanceToNextTurn = () => {
    const nextIdx = currentTurnIdx + 1;
    if (nextIdx < MOCK_TURNS.length) {
      const nextTurn = MOCK_TURNS[nextIdx];
      if (nextTurn.phase !== (currentTurnIdx >= 0 ? MOCK_TURNS[currentTurnIdx].phase : null)) {
        const prevPhase = currentTurnIdx >= 0 ? MOCK_TURNS[currentTurnIdx].phase : "opening";
        if (prevPhase === "opening" && nextTurn.phase === "rebuttal") {
          setPhaseTransition("eval_opening");
          setTimeout(() => {
            setActivePhase("eval_opening");
            setPhaseTransition(null);
            setInternalPhasesDone(p => ({ ...p, eval_opening: true }));
            setTimeout(() => {
              setActivePhase("rebuttal");
              setCurrentTurnIdx(nextIdx);
              setStreaming(true);
            }, 2500);
          }, 800);
          return;
        }
        if (prevPhase === "rebuttal" && nextTurn.phase === "closing") {
          setPhaseTransition("eval_full");
          setTimeout(() => {
            setActivePhase("eval_full");
            setPhaseTransition(null);
            setInternalPhasesDone(p => ({ ...p, eval_full: true }));
            setTimeout(() => {
              setActivePhase("closing");
              setCurrentTurnIdx(nextIdx);
              setStreaming(true);
            }, 2500);
          }, 800);
          return;
        }
        setPhaseTransition(nextTurn.phase);
        setTimeout(() => {
          setActivePhase(nextTurn.phase);
          setPhaseTransition(null);
          setCurrentTurnIdx(nextIdx);
          setStreaming(true);
        }, 800);
      } else {
        setCurrentTurnIdx(nextIdx);
        setStreaming(true);
      }
    } else {
      setPhaseTransition("judging");
      setTimeout(() => { setActivePhase("judging"); setPhaseTransition(null); setShowResults(true); setStreaming(false); }, 1000);
    }
  };

  const onResearchComplete = () => {
    setResearchDone(true);
    setTimeout(() => { setActivePhase("opening"); setCurrentTurnIdx(0); setStreaming(true); }, 800);
  };

  const onTurnComplete = () => {
    setCompletedTurns(p => [...p, MOCK_TURNS[currentTurnIdx]]);
    setStreaming(false);
    setTimeout(advanceToNextTurn, 500);
  };

  const currentTurn = currentTurnIdx >= 0 ? MOCK_TURNS[currentTurnIdx] : null;
  const proTurnsForPhase = completedTurns.filter(t => t.side === "pro" && t.phase === activePhase);
  const conTurnsForPhase = completedTurns.filter(t => t.side === "con" && t.phase === activePhase);
  const isProStreaming = streaming && currentTurn?.side === "pro" && currentTurn?.phase === activePhase;
  const isConStreaming = streaming && currentTurn?.side === "con" && currentTurn?.phase === activePhase;

  const internalMessages = {
    eval_opening: "Both agents are analyzing the opponent's opening argument and preparing rebuttal strategy...",
    eval_full: "Both agents are reflecting on all arguments before delivering closing statements...",
  };

  if (screen === "home") {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
        <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">🎯 DebateMeBro</span>
          <div className="flex items-center gap-3">
            <button className="text-sm text-gray-400 hover:text-white transition-colors">My Debates</button>
            <button className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors">Sign In</button>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent">See Both Sides. For Real.</h1>
          <p className="text-gray-400 text-lg mb-8 max-w-lg">Two AI agents research, argue, and steelman both sides of any topic — scored by judges on logic, evidence, and intellectual honesty.</p>
          <div className="w-full max-w-xl">
            <div className="relative">
              <input type="text" value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && startDebate()}
                placeholder="Enter a debate topic..." className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-4 text-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all" />
              <button onClick={startDebate} className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors">Debate It →</button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {["Should the US adopt universal healthcare?", "Is remote work better than in-office?", "Should AI-generated art be copyrightable?"].map(s => (
                <button key={s} onClick={() => setTopic(s)} className="text-xs text-gray-500 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full hover:text-gray-300 hover:border-gray-600 transition-colors">{s}</button>
              ))}
            </div>
          </div>
          <div className="mt-10 w-full max-w-xl">
            <div className="text-xs text-gray-600 mb-3 uppercase tracking-wider">How it works</div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              {["🔍 Research", "📖 Opening", "🧠 Eval", "⚔️ Rebuttal", "🧠 Eval", "🏁 Closing", "📊 Judging"].map((s, i) => (
                <div key={i} className="flex items-center gap-1"><span>{s}</span>{i < 6 && <span className="text-gray-700 ml-1">→</span>}</div>
              ))}
            </div>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-8 text-center">
            {[
              { icon: "🔍", title: "Deep Research", desc: "Both sides see all evidence — shared facts, competing arguments" },
              { icon: "⚖️", title: "Steelmanned", desc: "Each side represents the other at its strongest before rebutting" },
              { icon: "📊", title: "Rubric-Scored", desc: "Transparent judging across 4 criteria with visible reasoning" },
            ].map(f => (
              <div key={f.title}><div className="text-2xl mb-2">{f.icon}</div><div className="font-medium text-sm mb-1">{f.title}</div><div className="text-xs text-gray-500">{f.desc}</div></div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <button onClick={() => setScreen("home")} className="flex items-center gap-2 hover:opacity-80"><span className="text-lg font-bold">🎯 DebateMeBro</span></button>
        <div className="flex-1 text-center px-4"><span className="text-sm text-gray-400 font-medium">{topic}</span></div>
        {(streaming || activePhase === "research" || activePhase.startsWith("eval")) && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Live</span>
        )}
      </header>

      <div className="px-4 py-2 bg-gray-900/30 border-b border-gray-800 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <span className="text-gray-500"><strong className="text-blue-400">PRO:</strong> {PRO_POSITION.slice(0, 80)}...</span>
        </div>
        <div className="text-gray-700">vs</div>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          <span className="text-gray-500"><strong className="text-red-400">CON:</strong> {CON_POSITION.slice(0, 80)}...</span>
        </div>
      </div>

      <div className="flex items-center gap-0.5 px-4 py-2 bg-gray-900/50 border-b border-gray-800 overflow-x-auto">
        {PHASES.map((phase, i) => {
          const isActive = activePhase === phase.id;
          const isComplete = phase.id === "research" ? researchDone :
            phase.id === "judging" ? showResults :
            phase.id === "eval_opening" ? internalPhasesDone.eval_opening :
            phase.id === "eval_full" ? internalPhasesDone.eval_full :
            completedTurns.some(t => t.phase === phase.id);
          return (
            <div key={phase.id} className="flex items-center">
              <button onClick={() => { if (isComplete || isActive) setActivePhase(phase.id); }}
                className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-all whitespace-nowrap ${isActive ? "bg-gray-700 text-white" : isComplete ? "text-emerald-400 hover:bg-gray-800 cursor-pointer" : "text-gray-600 cursor-default"} ${phase.internal ? "italic" : ""}`}
              >
                {isComplete && !isActive ? "✓" : phase.icon} {phase.label}
              </button>
              {i < PHASES.length - 1 && <span className="text-gray-700 mx-0.5">›</span>}
            </div>
          );
        })}
      </div>

      {phaseTransition && (
        <div className="px-4 py-3 bg-purple-900/20 border-b border-purple-800/30 text-center">
          <span className="text-sm text-purple-300 animate-pulse">{internalMessages[phaseTransition] || `Moving to ${PHASES.find(p => p.id === phaseTransition)?.label}...`}</span>
        </div>
      )}

      <main className="flex-1 flex overflow-hidden">
        {activePhase === "research" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <h3 className="text-sm font-semibold text-gray-300 mb-1">🔍 Research Consultation</h3>
            <p className="text-xs text-gray-500 mb-6">Both agents receive the complete research — Pro and Con — to build strategy from shared facts</p>
            <ResearchAnimation onComplete={onResearchComplete} />
          </div>
        )}

        {(activePhase === "eval_opening" || activePhase === "eval_full") && (
          <div className="flex-1 flex flex-col p-6">
            <div className="text-center mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-1">🧠 {activePhase === "eval_opening" ? "Evaluating Opponent's Opening" : "Reflecting on Full Debate"}</h3>
              <p className="text-xs text-gray-500">{internalMessages[activePhase]}</p>
              <div className="mt-3 flex justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">P</div>
                  <span className="text-xs text-blue-400 font-medium">{MOCK_PERSONAS.pro.name}'s Analysis</span>
                </div>
                <StrategicAnalysisPanel content={activePhase === "eval_opening" ? MOCK_STRATEGIC_ANALYSIS.pro_eval : MOCK_STRATEGIC_ANALYSIS.pro_research} side="pro" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold">C</div>
                  <span className="text-xs text-red-400 font-medium">{MOCK_PERSONAS.con.name}'s Analysis</span>
                </div>
                <StrategicAnalysisPanel content={activePhase === "eval_opening" ? MOCK_STRATEGIC_ANALYSIS.con_eval : MOCK_STRATEGIC_ANALYSIS.con_research} side="con" />
              </div>
            </div>
          </div>
        )}

        {activePhase === "judging" && showResults && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-200 mb-1">📊 Judging Results</h3>
              <p className="text-xs text-gray-500 mb-6">3 AI judges with position-swapped verification. 2/3 judges consistent.</p>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-4"><span className="text-blue-400 font-medium">← Pro ({MOCK_PERSONAS.pro.name})</span><span className="text-red-400 font-medium">Con ({MOCK_PERSONAS.con.name}) →</span></div>
                  <ScoreBar label="Logical Validity" weight="30%" proScore={MOCK_SCORES.pro.logic} conScore={MOCK_SCORES.con.logic} />
                  <ScoreBar label="Evidence Quality" weight="25%" proScore={MOCK_SCORES.pro.evidence} conScore={MOCK_SCORES.con.evidence} />
                  <ScoreBar label="Refutation Strength" weight="25%" proScore={MOCK_SCORES.pro.refutation} conScore={MOCK_SCORES.con.refutation} />
                  <ScoreBar label="Steelmanning Quality" weight="20%" proScore={MOCK_SCORES.pro.steelman} conScore={MOCK_SCORES.con.steelman} />
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Weighted Total</span>
                      <span className="font-mono"><span className="text-blue-400">{(4*.3+5*.25+4*.25+5*.2).toFixed(1)}</span> vs <span className="text-red-400">{(5*.3+4*.25+5*.25+4*.2).toFixed(1)}</span></span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">Your Vote</div>
                  <div className="flex gap-3 mb-4">
                    <button onClick={() => setUserVote("pro")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${userVote === "pro" ? "bg-blue-600 text-white ring-2 ring-blue-400/30" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>👍 Pro Wins</button>
                    <button onClick={() => setUserVote("con")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${userVote === "con" ? "bg-red-600 text-white ring-2 ring-red-400/30" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>👍 Con Wins</button>
                  </div>
                  {userVote && <div className="text-xs text-gray-500 p-3 bg-gray-800/50 rounded-lg mb-3"><div className="font-medium text-gray-300 mb-1">Vote recorded!</div>Human votes: 47% Pro · 53% Con (23 total)<br />Weighting: 60% AI judges · 40% human votes</div>}
                  <div className="p-3 bg-gray-800/50 rounded-lg mb-3">
                    <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">AI Judges Verdict</div>
                    <div className="text-sm text-gray-300"><strong className="text-yellow-400">Extremely close.</strong> Pro excelled at evidence use and steelmanning. Con demonstrated stronger logical structure and refutation. Position-swap check: 2/3 judges consistent.</div>
                  </div>
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Logic Judge Reasoning</div>
                    <div className="text-xs text-gray-400 leading-relaxed">Con's reframing of Pro's Germany/Switzerland examples to undermine the single-payer case was the strongest logical move. Pro's identification that the Mercatus study supports their position was effective evidence use but required the judges to verify the claim independently.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {["opening", "rebuttal", "closing"].includes(activePhase) && (
          <>
            <div className="flex-1 border-r border-gray-800 overflow-y-auto p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">P</div>
                <div><div className="text-sm font-semibold text-blue-400">{MOCK_PERSONAS.pro.name}</div><div className="text-xs text-gray-500">{MOCK_PERSONAS.pro.role}</div></div>
              </div>
              {proTurnsForPhase.map((turn, i) => <ArgumentCard key={i} turn={turn} expandedCitation={expandedCitation} setExpandedCitation={setExpandedCitation} />)}
              {isProStreaming && <div className="text-sm leading-relaxed text-gray-300"><StreamingText text={currentTurn.text.replace(/\[Source: [^\]]+\]/g, "").replace(/\*\*/g, "")} speed={4} onComplete={onTurnComplete} /></div>}
              {!isProStreaming && proTurnsForPhase.length === 0 && <div className="text-gray-600 text-sm italic flex items-center gap-2"><span className="animate-pulse">⏳</span> Preparing {activePhase}...</div>}
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-sm font-bold">C</div>
                <div><div className="text-sm font-semibold text-red-400">{MOCK_PERSONAS.con.name}</div><div className="text-xs text-gray-500">{MOCK_PERSONAS.con.role}</div></div>
              </div>
              {conTurnsForPhase.map((turn, i) => <ArgumentCard key={i} turn={turn} expandedCitation={expandedCitation} setExpandedCitation={setExpandedCitation} />)}
              {isConStreaming && <div className="text-sm leading-relaxed text-gray-300"><StreamingText text={currentTurn.text.replace(/\[Source: [^\]]+\]/g, "").replace(/\*\*/g, "")} speed={4} onComplete={onTurnComplete} /></div>}
              {!isConStreaming && conTurnsForPhase.length === 0 && <div className="text-gray-600 text-sm italic flex items-center gap-2"><span className="animate-pulse">⏳</span> Waiting for Pro...</div>}
            </div>
          </>
        )}
      </main>

      <div className="border-t border-gray-800 px-4 py-2 bg-gray-900/50 flex items-center justify-between">
        <div className="text-xs text-gray-500">{PHASES.find(p => p.id === activePhase)?.icon} {PHASES.find(p => p.id === activePhase)?.internal ? "Internal evaluation phase" : PHASES.find(p => p.id === activePhase)?.label}</div>
        {completedTurns.length > 0 && <span className="text-xs text-gray-600">{completedTurns.length}/{MOCK_TURNS.length} arguments delivered</span>}
      </div>
    </div>
  );
}
