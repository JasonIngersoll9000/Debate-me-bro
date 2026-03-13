import { DebateTurn, Persona } from "./store";

export const MOCK_PERSONAS: { pro: Persona; con: Persona } = {
  pro: { name: "Dr. Amara Osei", role: "Public Health Policy Researcher" },
  con: { name: "Dr. James Whitfield", role: "Health Systems Economist" },
};

export interface ResearchSection {
  title: string;
  keyStats: string[];
  sources: string[];
}

export const MOCK_PRO_RESEARCH: ResearchSection[] = [
  {
    title: "Administrative Waste: The Trillion-Dollar Anchor",
    keyStats: [
      "$812B/yr in admin costs — 34.2% of spending (vs Canada's 17%)",
      "$600B+ in potential savings by matching Canadian admin levels",
      "Medicare overhead: ~2% vs private insurance: 12–17%",
      "39 prior authorizations per physician per week, 13 hours of admin time",
    ],
    sources: [
      "Himmelstein, Campbell & Woolhandler, Annals of Internal Medicine, 2020",
      "Shrank, Rogstad & Parekh, JAMA, 2019",
      "McKinsey/JAMA, 2021 — $265B in achievable admin savings",
    ],
  },
  {
    title: "The Systematic Evidence for Savings",
    keyStats: [
      "22 economic models analyzed: 19/22 (86%) predict first-year savings",
      "All 22 predict long-term savings; median savings 3.46%",
      "CBO: 4/5 single-payer options reduce national health spending",
      "Mercatus Center (Koch-funded): total spending declines by $2T over decade",
    ],
    sources: [
      "Cai et al., PLOS Medicine, 2020 — systematic review",
      "CBO Working Papers 2020–2022",
      "Galvani et al., The Lancet, 2020 — 13.1% spending reduction",
    ],
  },
  {
    title: "The Human Cost of the Status Quo",
    keyStats: [
      "622,534 Americans died in 2019 who would have survived with peer-nation mortality rates",
      "27 million uninsured; 23% of insured are functionally underinsured",
      "$194B in medical debt in active collection",
      "62% of personal bankruptcies have a medical cause",
    ],
    sources: [
      "Commonwealth Fund, 2024 — US ranks last among wealthy democracies",
      "KFF Uninsured in America, 2024",
      "Galvani et al., The Lancet — 68,000+ preventable deaths/year",
    ],
  },
  {
    title: "International Success Stories",
    keyStats: [
      "Taiwan 1995: admin costs fell from 25% to 2%, 99% coverage in 1 year",
      "UK NHS: £0 at point of use, universal from 1948",
      "Canada: universal coverage, lower per-capita spending than US",
      "Top 4 nations in 2024 Healthcare Innovation Index all have universal coverage",
    ],
    sources: [
      "WHO Taiwan Health System Transition",
      "OECD Health Statistics, 2024",
      "FREOPP World Index of Healthcare Innovation, 2024",
    ],
  },
];

export const MOCK_CON_RESEARCH: ResearchSection[] = [
  {
    title: "US Pricing Fuels Global Innovation",
    keyStats: [
      "US firms: 55% of global biopharma R&D (up from 33% in 1990)",
      "US produces 47% of new treatments globally; Europe just 22%",
      "Private R&D grows 8x for every increase in NIH funding",
      "Price controls could reduce innovation by 29–60% (Becker Friedman Institute)",
    ],
    sources: [
      "ITIF, 2025, citing Chandra et al., Nature Reviews Drug Discovery",
      "Congressional Budget Office, 2021",
      "Goldman & Lakdawalla, Brookings/USC Schaeffer, 2018",
    ],
  },
  {
    title: "The Market Failure Is Actually Regulatory Failure",
    keyStats: [
      "35 states have certificate-of-need laws blocking healthcare competition",
      "90% of hospital markets are 'highly concentrated' per FTC/DOJ",
      "Median drug approval cost: $985M; timeline: 10–15 years",
      "Surgery Center of Oklahoma: knee replacement $15,550, 0.00% infection rate",
    ],
    sources: [
      "Mitchell, Mercatus Center, 2021 — 128 assessments",
      "Brot-Goldberg et al., University of Chicago, 2024",
      "Society of Actuaries, 2020 — DPC shows 40.5% lower ED use",
    ],
  },
  {
    title: "Government Healthcare Track Record",
    keyStats: [
      "Medicare 1967 projection: $12B by 1990. Actual: $110B — 817% overrun",
      "VA Phoenix: actual waits 115 days vs reported 24 days",
      "Healthcare.gov: $93.7M budget → $1.7B — 18x cost overrun",
      "Vermont abandoned single-payer: would have increased budget by 45%",
    ],
    sources: [
      "Blahous, Mercatus Center, 2018 — $32.6T in new federal costs",
      "VA Inspector General, 2014",
      "GAO, 2025 — $162B in improper payments, FY2024",
    ],
  },
  {
    title: "Multi-Payer Systems Prove a Better Path",
    keyStats: [
      "Switzerland: #1 in 2024 Healthcare Innovation Index, universal via private insurance",
      "Germany: 0% wait 4+ months for surgery (vs 18% Canada, 12% UK)",
      "Netherlands: admin costs just 2.7% with managed competition",
      "Singapore: outstanding outcomes at 4–5% of GDP",
    ],
    sources: [
      "FREOPP World Index of Healthcare Innovation, 2024",
      "Tuohy, JAMA, 2019 — 86–87% satisfaction in multi-payer vs 75–76% single-payer",
      "Haseltine, Brookings, 2013 — Singapore healthcare model",
    ],
  },
];

export const MOCK_STRATEGIC_ANALYSIS: Record<string, Record<"pro" | "con", string>> = {
  eval_openings: {
    pro: `**Their strongest point:** The innovation incentive argument backed by Nature 2024 data. US genuinely does account for 36% of global biomedical R&D. This is the hardest claim to counter.\n\n**Their weakest point:** They cited Germany and Switzerland as alternatives to single-payer — but this actually undermines their own "market-based" framing since both systems are heavily regulated with individual mandates.\n\n**Rebuttal strategy:** Steelman the innovation point, then reframe. Concede US leads in R&D, but show it's driven by NIH funding, not unregulated pricing. Use their own Germany/Switzerland examples against them.`,
    con: `**Their strongest point:** The administrative waste argument ($350B/yr from JAMA) is well-sourced and specific. Hard to challenge the data directly.\n\n**Their weakest point:** They dismiss implementation concerns as "solvable by competent governance" — this is hand-waving, not evidence. The VA and ACA examples are concrete counterpoints.\n\n**Rebuttal strategy:** Steelman the admin waste point (it's real), then pivot to why single-payer isn't the only solution. Multi-payer achieves the same admin savings goal without the transition catastrophe. Use their Germany/Switzerland citation against them.`,
  },
  eval_full_debate: {
    pro: `**Strongest arguments so far:** (1) Administrative cost savings — JAMA 2023 study estimates $350B/yr in waste. Strong primary data. (2) Taiwan transition case — WHO longitudinal data shows coverage expansion + cost reduction.\n\n**Vulnerabilities:** Innovation incentive argument is genuinely strong for opponent. US does lead in pharma R&D. Need to reframe as funding-mechanism issue.\n\n**Citation plan:** Hold NIH funding data and Mercatus detailed findings for closing.`,
    con: `**Strongest arguments so far:** (1) Innovation incentives — Nature 2024 data on US share of global R&D is strong primary evidence. (2) Implementation risk — VA system failures and ACA rollout problems are concrete examples.\n\n**Vulnerabilities:** The "27 million uninsured" moral argument is hard to counter directly. Need to redirect to multi-payer alternatives.\n\n**Citation plan:** Lead with Germany/Switzerland comparison and RAND hospital impact study for closing.`,
  },
};

export const MOCK_TURNS: DebateTurn[] = [
  {
    side: "pro",
    phase: "opening",
    text: `The United States spends more on healthcare than any nation on Earth — roughly $4.5 trillion annually, nearly 18% of GDP — yet ranks last among high-income nations on the Commonwealth Fund's health system performance index [Source: Commonwealth Fund Mirror Mirror 2024](https://www.commonwealthfund.org/publications/fund-reports/2024/sep/mirror-mirror-2024). This is not a system that is expensive because it is excellent. It is expensive because it is broken.

The core of the problem is administrative complexity. The US healthcare system employs more billing specialists than hospital beds. An estimated $350 billion per year is consumed by administrative waste — insurance company overhead, prior authorizations, claims processing, and the bureaucratic machinery required to maintain a fragmented multi-payer system [Source: JAMA Administrative Costs 2023](https://jamanetwork.com/journals/jama/article-abstract/2785479).

A single-payer system would consolidate this fragmentation. When Taiwan transitioned to single-payer in 1995, administrative costs fell from 25% to 2% of total health spending, and coverage was extended to 99% of the population within a single year [Source: WHO Taiwan Health System Transition](https://www.who.int/publications/i/item/taiwan-health-system). The results were not merely financial — infant mortality dropped, life expectancy rose, and patient satisfaction reached 80%.

Beyond efficiency, there is a moral imperative that we cannot afford to ignore. Today, 27 million Americans have no health insurance. Medical debt remains the leading cause of personal bankruptcy in the United States [Source: KFF Uninsured in America 2024](https://www.kff.org/uninsured/issue-brief/key-facts-2024). In the wealthiest country in human history, no one should lose their home because they got sick.`,
    citations: [
      { id: "Commonwealth Fund Mirror Mirror 2024", url: "https://www.commonwealthfund.org/publications/fund-reports/2024/sep/mirror-mirror-2024" },
      { id: "JAMA Administrative Costs 2023", url: "https://jamanetwork.com/journals/jama/article-abstract/2785479" },
      { id: "WHO Taiwan Health System Transition", url: "https://www.who.int/publications/i/item/taiwan-health-system" },
      { id: "KFF Uninsured in America 2024", url: "https://www.kff.org/uninsured/issue-brief/key-facts-2024" },
    ],
  },
  {
    side: "con",
    phase: "opening",
    text: `The American healthcare system has real problems — costs are too high, coverage gaps exist, and administrative complexity is a genuine burden. I do not dispute these facts. The question is whether replacing the entire system with a government-run single-payer model is the right solution, and the evidence strongly suggests it is not.

First, consider what the current system produces despite its flaws. The United States accounts for 36% of all global biomedical R&D output [Source: Nature Reviews Global Biomedical R&D 2024](https://www.nature.com/articles/s41573-024-biomedical-rd). Eight of the world's ten largest pharmaceutical companies are headquartered in the US or conduct the majority of their research here. This is not coincidence — it is a direct result of a pricing system that rewards the enormous financial risk of drug development.

Second, the savings promised by single-payer advocates are dramatically overstated. The Mercatus Center estimated that Medicare for All would require $32.6 trillion in new federal spending over ten years [Source: Mercatus Center Medicare for All Analysis](https://www.mercatus.org/research/working-papers/costs-national-single-payer). Achieving the projected savings requires cutting provider reimbursement to Medicare rates — a 40% pay cut for hospitals and 30% for physicians.

Third, the wait time problem is not a talking point — it is a measurable reality. In Canada, the median wait time from specialist referral to treatment is 27.7 weeks [Source: Fraser Institute Wait Times 2024](https://www.fraserinstitute.org/studies/waiting-your-turn-2024). In the UK, 7.6 million people were on NHS waiting lists as of 2023. The better path forward is a regulated multi-payer model — like Germany or Switzerland — that achieves universal coverage while preserving competition, innovation incentives, and patient choice.`,
    citations: [
      { id: "Nature Reviews Global Biomedical R&D 2024", url: "https://www.nature.com/articles/s41573-024-biomedical-rd" },
      { id: "Mercatus Center Medicare for All Analysis", url: "https://www.mercatus.org/research/working-papers/costs-national-single-payer" },
      { id: "Fraser Institute Wait Times 2024", url: "https://www.fraserinstitute.org/studies/waiting-your-turn-2024" },
    ],
  },
  {
    side: "pro",
    phase: "rebuttal",
    text: `My opponent raises three substantive challenges — innovation incentives, overstated savings, and wait times — and I want to engage with each at their strongest before explaining why they ultimately fail to defeat the case for single-payer.

**The innovation argument is the strongest case against my position, and I take it seriously.** My opponent is correct that the US accounts for 36% of global biomedical R&D, and the Nature data backing this claim is solid. However, it conflates a specific pricing model with innovation capacity itself. The National Institutes of Health already funds $47 billion annually in basic research — the foundational science on which private pharmaceutical R&D builds [Source: NIH Budget Overview 2024](https://www.nih.gov/about-nih/what-we-do/budget). Germany and Switzerland — which my opponent cites as model alternatives — rank 2nd and 3rd globally in pharmaceutical patents per capita, and neither relies on American-style unregulated pricing.

**On savings, my opponent misrepresents their own source.** The Mercatus Center's $32.6 trillion figure is new *federal* spending — it replaces existing private spending, it does not add to it. The same study found that Medicare for All would reduce total national health spending by $2 trillion over 10 years compared to the status quo [Source: Mercatus Center Detailed Findings](https://www.mercatus.org/research/working-papers/costs-national-single-payer). My opponent cited this study but omitted its central finding.

**On wait times, this is the most honest empirical challenge.** But wait times are a function of funding levels, not system architecture. The UK's NHS wait times spiked after a decade of austerity cuts — they were half as long in 2010 before budget constraints were imposed [Source: BMJ NHS Austerity Analysis](https://www.bmj.com/content/373/bmj.n1314).`,
    citations: [
      { id: "NIH Budget Overview 2024", url: "https://www.nih.gov/about-nih/what-we-do/budget" },
      { id: "Mercatus Center Detailed Findings", url: "https://www.mercatus.org/research/working-papers/costs-national-single-payer" },
      { id: "BMJ NHS Austerity Analysis", url: "https://www.bmj.com/content/373/bmj.n1314" },
    ],
  },
  {
    side: "con",
    phase: "rebuttal",
    text: `My opponent makes three sophisticated moves that deserve direct engagement: reframing innovation as about public funding rather than pricing incentives, contextualizing the Mercatus figure as replacement spending, and attributing wait times to funding levels rather than structural design. Each is partially correct — and ultimately insufficient.

**I'll steelman my opponent's strongest move: the Mercatus reframing.** My opponent is correct that the $32.6 trillion represents new federal spending replacing existing private spending, and that the study projects a net reduction in total national health expenditures. I concede this point narrowly. But achieving those savings requires every hospital and physician in America to accept Medicare-level reimbursement. A 2022 RAND Corporation study found that hospitals would face operating losses of 8-12% under universal Medicare rates [Source: RAND Hospital Financial Impact 2022](https://www.rand.org/pubs/research_reports/RR4394.html). This means hospital closures in exactly the rural and underserved communities single-payer aims to help.

**On innovation reframing: my opponent's own examples argue against single-payer.** The Germany and Switzerland comparison undermines the single-payer case entirely. Neither country has single-payer — both use regulated multi-payer systems with competing private insurers [Source: Commonwealth Fund Germany Profile](https://www.commonwealthfund.org/international-health-policy-center/countries/germany). If universal coverage plus innovation is achievable through regulated multi-payer systems, why take the vastly more disruptive single-payer path?

**On wait times and funding adequacy: this is the core vulnerability of single-payer that my opponent cannot resolve.** Every single-payer system in the world has faced budget pressure, and patients bore the cost. In a multi-payer system, competitive pressure creates a structural incentive to maintain access — it does not depend on any government's budget priorities.`,
    citations: [
      { id: "RAND Hospital Financial Impact 2022", url: "https://www.rand.org/pubs/research_reports/RR4394.html" },
      { id: "Commonwealth Fund Germany Profile", url: "https://www.commonwealthfund.org/international-health-policy-center/countries/germany" },
    ],
  },
  {
    side: "pro",
    phase: "closing",
    text: `My opponent has been a formidable advocate, and I want to acknowledge where this debate has genuinely narrowed. We agree that universal coverage is necessary, that administrative waste must be reduced, and that innovation must be preserved. The implementation risk my opponent raises is a serious concern that any honest single-payer advocate must address.

But here is what this debate has revealed: my opponent's own preferred solution proves my fundamental point. Germany and Switzerland achieved universal coverage not through free markets, but through heavy regulation — the exact mechanisms that American opponents of healthcare reform have fought against for decades.

I believe the evidence favors going further, for three reasons. First, the administrative savings from single-payer are real and massive — $350 billion annually [Source: JAMA Administrative Costs 2023](https://jamanetwork.com/journals/jama/article-abstract/2785479). Second, the innovation argument misidentifies the engine of American biomedical innovation: it is publicly funded basic research, not unregulated drug pricing [Source: NIH Budget Overview 2024](https://www.nih.gov/about-nih/what-we-do/budget). Third, the moral urgency is not an abstraction — twenty-seven million Americans are uninsured tonight, and sixty-six thousand will die this year from causes attributable to lack of coverage.

Single-payer is not a gamble. It is what every other developed nation figured out long ago. It is time for the United States to join them.`,
    citations: [
      { id: "JAMA Administrative Costs 2023", url: "https://jamanetwork.com/journals/jama/article-abstract/2785479" },
      { id: "NIH Budget Overview 2024", url: "https://www.nih.gov/about-nih/what-we-do/budget" },
    ],
  },
  {
    side: "con",
    phase: "closing",
    text: `My opponent closes with moral urgency, and that urgency is real. People are dying because they lack coverage, and people are going bankrupt from medical debt. This is not acceptable, and I have never argued otherwise.

But moral urgency does not excuse strategic recklessness. The Affordable Care Act's rollout nearly collapsed over a website. The VA system has faced decades of documented access failures. These are the track record of American government managing healthcare delivery.

My opponent's strongest argument — administrative savings — is real but overstated as a case for single-payer specifically. A well-regulated multi-payer system captures the majority of those savings without requiring the elimination of an entire industry and the assumption of $4.5 trillion in annual federal obligations.

The Germany model is not my consolation prize — it is the empirically superior path. It achieves 99.9% coverage. It preserves innovation. It maintains competitive pressure on insurers to deliver quality care. And critically, it is achievable incrementally — through expanding public options, tightening insurer regulations, and filling coverage gaps — without betting the entire healthcare system on a single, irreversible transformation.

Reform should be urgent. Reform should be universal. But reform should also be reversible and resilient. Let us choose the path that actually reaches the destination, not the one that sounds most dramatic.`,
    citations: [],
  },
];

export const MOCK_SCORES = {
  pro: { logic: 4, evidence: 5, refutation: 4, steelman: 5, weighted_total: 4.45 },
  con: { logic: 5, evidence: 4, refutation: 5, steelman: 4, weighted_total: 4.55 },
};

// Phases the mock will walk through with timing (ms)
export const MOCK_PHASE_SEQUENCE = [
  { phase: "research", duration: 2500 },
  { phase: "opening", side: "pro" as const, turnIndex: 0, streamSpeed: 3 },
  { phase: "opening", side: "con" as const, turnIndex: 1, streamSpeed: 3 },
  { phase: "eval_openings", duration: 3000 },
  { phase: "rebuttal", side: "pro" as const, turnIndex: 2, streamSpeed: 2 },
  { phase: "rebuttal", side: "con" as const, turnIndex: 3, streamSpeed: 2 },
  { phase: "eval_full_debate", duration: 3000 },
  { phase: "closing", side: "pro" as const, turnIndex: 4, streamSpeed: 2 },
  { phase: "closing", side: "con" as const, turnIndex: 5, streamSpeed: 2 },
  { phase: "judging", duration: 0 },
];

export const MOCK_POSITIONS = {
  pro: "The US should implement a single-payer universal healthcare system to ensure equitable access, reduce administrative costs, and improve population health outcomes.",
  con: "The US should preserve its market-based healthcare system, which drives medical innovation, offers patient choice, and avoids the inefficiencies and rationing seen in government-run systems.",
};

export const MOCK_RESEARCH_STEPS = [
  { query: "Loading Pro + Con research documents...", results: "2 documents" },
  { query: "Building citation index...", results: "47 sources" },
  { query: "Extracting argument dimensions...", results: "8 dimensions" },
  { query: "Both agents consulting all research...", results: "shared pool" },
];

export const MOCK_JUDGE_VERDICT = {
  summary: "Pro excelled at evidence use and steelmanning. Con demonstrated stronger logical structure and refutation. Position-swap check: 2/3 judges consistent.",
  reasoning: "Con's reframing of Pro's Germany/Switzerland examples to undermine the single-payer case was the strongest logical move in the debate. Pro's identification that the Mercatus study actually supports their position was an effective evidence tactic but required independent verification. Both sides demonstrated exceptional steelmanning — each acknowledged the strongest version of their opponent's argument before responding. The debate was remarkably close, with the outcome hinging on whether one values systemic ambition (Pro) or pragmatic incrementalism (Con).",
};

