"use client";

import { Suspense, useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchPresetTopics, PresetTopic, fetchUsage, UsageInfo } from "@/lib/api";
import { useDebateStore } from "@/lib/store";

function HomeInner() {
  const [topic, setTopic] = useState("");
  const [presets, setPresets] = useState<PresetTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const topicInputRef = useRef<HTMLInputElement>(null);
  const isTypingRef = useRef(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const setStoreTopic = useDebateStore((state) => state.setTopic);
  const storeTopicTitle = useDebateStore((state) => state.topicTitle);

  const queryTopic = useMemo(() => searchParams.get("topic") || "", [searchParams]);

  const buildHomeUrlWithTopic = (t: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (t.trim()) params.set("topic", t);
    else params.delete("topic");
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  };

  const buildAuthReturnToUrl = (returnTo: string) =>
    `/auth?returnTo=${encodeURIComponent(returnTo)}`;

  useEffect(() => {
    // Check auth state
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("user_email");
    if (token) {
      setIsLoggedIn(true);
      setUserEmail(email);
      fetchUsage().then((u) => { if (u) setUsage(u); });
    }

    fetchPresetTopics()
      .then((data) => { setPresets(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Initialize from URL (?topic=...) first, then fall back to store.
    // Skip if the user is actively typing — otherwise the trimmed URL
    // value overwrites the local state and eats trailing spaces.
    if (isTypingRef.current) return;
    if (queryTopic) {
      setTopic(queryTopic);
      setStoreTopic("custom", queryTopic);
      return;
    }
    if (storeTopicTitle && storeTopicTitle !== topic) {
      setTopic(storeTopicTitle);
      const nextUrl = buildHomeUrlWithTopic(storeTopicTitle);
      router.replace(nextUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryTopic, storeTopicTitle]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_email");
    setIsLoggedIn(false);
    setUserEmail(null);
  };

  const handleStartDebate = (selectedTopic?: PresetTopic | string) => {
    // Require sign-in to debate
    if (!isLoggedIn) {
      if (typeof selectedTopic === "string") {
        const t = selectedTopic.trim();
        if (!t) return;
        const returnTo = buildHomeUrlWithTopic(t);
        router.push(buildAuthReturnToUrl(returnTo));
        return;
      }
      if (selectedTopic) {
        const returnTo = `/debates/${selectedTopic.id}`;
        router.push(buildAuthReturnToUrl(returnTo));
        return;
      }
      const t = topic.trim();
      if (!t) return;
      const returnTo = buildHomeUrlWithTopic(t);
      router.push(buildAuthReturnToUrl(returnTo));
      return;
    }

    if (typeof selectedTopic === "string") {
      if (!selectedTopic.trim()) return;
      setStoreTopic("custom", selectedTopic);
      router.push(`/debates/new?topic=${encodeURIComponent(selectedTopic)}`);
    } else if (selectedTopic) {
      setStoreTopic(selectedTopic.id, selectedTopic.title);
      router.push(`/debates/${selectedTopic.id}`);
    } else {
      if (!topic.trim()) return;
      setStoreTopic("custom", topic);
      router.push(`/debates/new?topic=${encodeURIComponent(topic)}`);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative font-sans">
      {/* Header */}
      <header className="relative z-10 border-b border-outline-variant bg-surface-low px-8 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-pro flex items-center justify-center">
            <span className="text-[#00195b] font-bold text-sm">🎯</span>
          </div>
          <span className="text-xl font-black tracking-tighter text-on-surface font-headline">
            DebateMeBro
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/browse" className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">
            Browse
          </Link>
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">
                My Debates
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-con flex items-center justify-center text-xs font-black text-[#00195b] uppercase">
                  {userEmail?.[0] || "U"}
                </div>
                <button onClick={handleLogout} className="text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <Link href="/auth" className="text-sm font-bold text-on-surface-variant hover:text-on-surface border border-outline-variant hover:border-outline px-4 py-2 rounded-none transition-colors">
              Sign In
            </Link>
          )}
        </div>
      </header>

      <main className="relative z-10 flex-1">
        {/* ═══ Hero Section ═══ */}
        <section className="flex flex-col items-center justify-center px-6 max-w-6xl mx-auto text-center pt-20 pb-16 w-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-none bg-surface-high border border-outline-variant mb-10">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-pro opacity-75" />
              <span className="relative inline-flex rounded-none h-2.5 w-2.5 bg-pro" />
            </span>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Live AI Debate Engine</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter text-on-surface leading-tight font-headline">
            See Both Sides.<br />
            <span className="text-on-surface font-headline">
              For Real.
            </span>
          </h1>

          <p className="text-on-surface-variant text-lg md:text-2xl mb-14 max-w-3xl leading-relaxed font-light font-body">
            Pick any topic. Two AI agents independently research <strong className="text-on-surface font-semibold">both sides</strong>, build their own strategies, then argue it out live — citing real sources, steelmanning opponents, and getting scored by an impartial judging panel.
          </p>

          {/* Topic Input */}
          <div className="w-full max-w-3xl mb-14 relative">
            <div className="relative group p-2 bg-surface-container border border-outline-variant transition-all duration-300 hover:border-outline focus-within:border-pro z-20">
              <div className="relative flex items-center w-full bg-surface rounded-none overflow-hidden">
                <span className="pl-6 text-2xl">💡</span>
                <input
                  ref={topicInputRef}
                  type="text"
                  value={topic}
                  onChange={(e) => {
                    const next = e.target.value;
                    isTypingRef.current = true;
                    setTopic(next);
                    setStoreTopic("custom", next);
                    router.replace(buildHomeUrlWithTopic(next));
                    // Allow URL→state sync again after React settles
                    requestAnimationFrame(() => { isTypingRef.current = false; });
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleStartDebate()}
                  placeholder="Enter any debate topic or statement..."
                  className="w-full bg-transparent pl-4 pr-44 py-6 text-xl text-on-surface placeholder-on-surface-variant focus:outline-none transition-all font-medium"
                  aria-label="Debate topic input"
                />
                <button
                  onClick={() => handleStartDebate()}
                  className="absolute right-3 top-3 bottom-3 bg-pro text-[#00195b] hover:opacity-90 px-8 rounded-none font-bold text-base transition-all"
                  aria-label="Start Debate"
                >
                  Debate It &rarr;
                </button>
              </div>
            </div>

            {!isLoggedIn && (
              <p className="text-xs text-on-surface-variant mt-3 text-center">
                <Link href="/auth" className="text-pro hover:opacity-80 font-bold transition-colors">Sign in</Link> to start debating
              </p>
            )}
            {isLoggedIn && usage && !usage.is_admin && (
              <p className="text-xs text-on-surface-variant mt-3 text-center">
                <span className={`font-bold ${usage.remaining > 0 ? "text-pro" : "text-con"}`}>
                  {usage.used} of {usage.limit}
                </span>{" "}
                debates used{usage.remaining === 0 && " — limit reached"}
              </p>
            )}
            {isLoggedIn && usage && usage.is_admin && (
              <p className="text-xs text-on-surface-variant mt-3 text-center">
                <span className="font-bold text-amber-400">Admin</span> — unlimited debates
              </p>
            )}

            {/* Preset Topics */}
            <div className="mt-10 relative z-20">
              <p className="text-xs text-on-surface-variant mb-5 font-bold uppercase tracking-widest">Or choose a preset topic</p>
              <div className="flex flex-wrap gap-4 justify-center min-h-[48px]">
                {loading ? (
                  <div className="flex items-center gap-3 text-sm font-medium text-pro">
                    <span className="w-5 h-5 border-2 border-pro/30 border-t-pro rounded-none animate-spin" />
                    Loading presets...
                  </div>
                ) : (
                  presets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleStartDebate(preset)}
                      className="text-sm font-bold text-on-surface bg-surface-container border border-outline-variant px-6 py-3 rounded-none hover:bg-surface-high hover:border-outline transition-colors"
                      aria-label={`Preset topic: ${preset.title}`}
                    >
                      {preset.title}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ What Makes This Different ═══ */}
        <section className="px-6 py-20 max-w-6xl mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-on-surface mb-4 tracking-tight font-headline">
              Not your average AI chatbot.
            </h2>
            <p className="text-on-surface-variant text-lg max-w-2xl mx-auto leading-relaxed font-body">
              Most AI tools give you one answer. We give you two experts arguing their hardest — with real sources you can verify.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "🧬",
                title: "Dynamic Personas",
                desc: "Each debate generates unique AI advocates — a health economist vs. a policy researcher, an IP attorney vs. a digital rights advocate — tailored to the specific topic and evidence.",
                accent: "border-pro",
              },
              {
                icon: "📚",
                title: "Real Research, Real Sources",
                desc: "Agents cite actual studies, reports, and data with clickable source links. Every claim is traceable. No hallucination, no hand-waving.",
                accent: "border-pro",
              },
              {
                icon: "🤝",
                title: "Steelman Requirement",
                desc: "Before attacking, each agent must restate the opponent's best argument in its strongest form. No strawmanning allowed — intellectual honesty is enforced.",
                accent: "border-pro",
              },
              {
                icon: "⚔️",
                title: "Multi-Round Structure",
                desc: "Opening → Rebuttal → Closing. Each agent sees all research, sees the opponent's arguments, and responds directly. No talking past each other.",
                accent: "border-con",
              },
              {
                icon: "📊",
                title: "Transparent Judging",
                desc: "Three specialized AI judges score Logic, Evidence, and Engagement separately. You see the rubric, the reasoning, and the scores — not a black box.",
                accent: "border-con",
              },
              {
                icon: "🗳️",
                title: "Your Vote Matters",
                desc: "After the AI judges, you cast your own vote. See how the crowd agrees or disagrees with the panel. Human judgment meets AI analysis.",
                accent: "border-con",
              },
            ].map((f) => (
              <div key={f.title} className={`group relative flex flex-col p-8 rounded-none bg-surface-container border-l-2 ${f.accent} border border-outline-variant hover:bg-surface-high transition-colors duration-300`}>
                <div className="w-14 h-14 bg-surface-high flex items-center justify-center text-2xl mb-6">
                  {f.icon}
                </div>
                <h3 className="font-black text-lg text-on-surface mb-3 font-headline">{f.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed flex-1 font-body">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ How It Works ═══ */}
        <section className="px-6 py-20 max-w-5xl mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-on-surface mb-4 tracking-tight font-headline">
              How a debate unfolds
            </h2>
            <p className="text-on-surface-variant text-lg max-w-2xl mx-auto font-body">
              Seven phases, fully automated. You watch it happen live.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { phase: "1", label: "Research", icon: "🔍", desc: "Both agents receive the complete evidence bundle — Pro and Con research. They analyze strengths, vulnerabilities, and build strategy.", bgClass: "bg-pro/10", borderClass: "border-pro/30", internal: false },
              { phase: "2", label: "Opening Arguments", icon: "📖", desc: "Each agent delivers a compelling opening statement — grounded in evidence, connected to values, streamed to you live.", bgClass: "bg-pro/10", borderClass: "border-pro/30", internal: false },
              { phase: "3", label: "Strategic Evaluation", icon: "🧠", desc: "Agents privately analyze the opponent's opening, identify weaknesses, and plan their rebuttal. Viewable via toggle.", bgClass: "bg-surface-high", borderClass: "border-outline-variant", internal: true },
              { phase: "4", label: "Rebuttals", icon: "⚔️", desc: "Steelman the opponent's best point, then dismantle their weakest. Introduce new evidence. Challenge their sources.", bgClass: "bg-con/10", borderClass: "border-con/30", internal: false },
              { phase: "5", label: "Full Debate Evaluation", icon: "🧠", desc: "Agents step back and assess the entire debate. What narrowed? What's unresolved? How to close with maximum impact.", bgClass: "bg-surface-high", borderClass: "border-outline-variant", internal: true },
              { phase: "6", label: "Closing Statements", icon: "🏁", desc: "Synthesize, don't repeat. Acknowledge the opponent. Address the hardest question. Close with impact.", bgClass: "bg-con/10", borderClass: "border-con/30", internal: false },
              { phase: "7", label: "Judging", icon: "📊", desc: "Three specialized judges (Logic, Evidence, Engagement) score independently. Position-swapped for bias detection.", bgClass: "bg-surface-high", borderClass: "border-outline-variant", internal: false },
            ].map((step) => (
              <div key={step.phase} className={`flex items-start gap-5 p-6 rounded-none transition-all hover:bg-surface-container group ${step.internal ? "opacity-60 hover:opacity-100" : ""}`}>
                <div className={`w-12 h-12 rounded-none ${step.bgClass} border ${step.borderClass} flex items-center justify-center text-xl shrink-0`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-base font-black text-on-surface font-headline">{step.label}</span>
                    {step.internal && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant bg-surface-high px-2 py-0.5 rounded-none border border-outline-variant">Internal</span>
                    )}
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed font-body">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ CTA Section ═══ */}
        <section className="px-6 py-24 max-w-4xl mx-auto w-full text-center">
          <div className="rounded-none bg-surface-container border border-outline-variant p-12 md:p-16">
            <h2 className="text-3xl md:text-5xl font-black text-on-surface mb-6 tracking-tight font-headline">
              Stop hearing one side.
            </h2>
            <p className="text-on-surface-variant text-lg max-w-xl mx-auto mb-10 leading-relaxed font-body">
              Every important topic has strong arguments on both sides. Most platforms hide that complexity. We put it front and center.
            </p>
            {isLoggedIn ? (
              <button
                onClick={() => topicInputRef.current?.focus()}
                className="px-10 py-5 bg-pro text-[#00195b] hover:opacity-90 rounded-none font-black text-lg uppercase tracking-wider transition-all"
              >
                Start a Debate →
              </button>
            ) : (
              <Link
                href="/auth"
                className="inline-block px-10 py-5 bg-pro text-[#00195b] hover:opacity-90 rounded-none font-black text-lg uppercase tracking-wider transition-all"
              >
                Create Free Account →
              </Link>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-outline-variant bg-surface-low text-center text-sm font-semibold text-on-surface-variant">
        &copy; {new Date().getFullYear()} DebateMeBro. Open Source AI Debate Engine.
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}
