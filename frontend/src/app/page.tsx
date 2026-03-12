"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchPresetTopics, PresetTopic } from "@/lib/api";
import { useDebateStore } from "@/lib/store";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [presets, setPresets] = useState<PresetTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const topicInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const setStoreTopic = useDebateStore((state) => state.setTopic);

  useEffect(() => {
    // Check auth state
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("user_email");
    if (token) {
      setIsLoggedIn(true);
      setUserEmail(email);
    }

    fetchPresetTopics()
      .then((data) => { setPresets(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_email");
    setIsLoggedIn(false);
    setUserEmail(null);
  };

  const handleStartDebate = (selectedTopic?: PresetTopic | string) => {
    // Require sign-in to debate
    if (!isLoggedIn) {
      router.push("/auth");
      return;
    }

    if (typeof selectedTopic === "string") {
      if (!selectedTopic.trim()) return;
      setStoreTopic("custom", selectedTopic);
      router.push(`/debates/new?topic=${encodeURIComponent(selectedTopic)}`);
    } else if (selectedTopic) {
      setStoreTopic(selectedTopic.id, selectedTopic.title);
      router.push(`/debates/${selectedTopic.id}?demo=true`);
    } else {
      if (!topic.trim()) return;
      setStoreTopic("custom", topic);
      router.push(`/debates/new?topic=${encodeURIComponent(topic)}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 flex flex-col relative font-sans overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] bg-fuchsia-600/20 blur-[120px] rounded-full mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute top-[30%] -right-[15%] w-[70vw] h-[70vw] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_1s]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[50vw] h-[50vw] bg-violet-600/20 blur-[120px] rounded-full mix-blend-screen animate-[pulse_9s_ease-in-out_infinite_2s]" />
        <div className="absolute top-[60%] right-[10%] w-[30vw] h-[30vw] bg-cyan-600/10 blur-[100px] rounded-full mix-blend-screen animate-[pulse_12s_ease-in-out_infinite_3s]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-3xl px-8 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.5)]">
            <span className="text-white font-bold text-sm">🎯</span>
          </div>
          <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            DebateMeBro
          </span>
        </div>
        <div className="flex items-center gap-5">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                My Debates
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-xs font-black text-white uppercase">
                  {userEmail?.[0] || "U"}
                </div>
                <button onClick={handleLogout} className="text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <Link href="/auth" className="text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-2.5 rounded-full transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-105">
              Sign In
            </Link>
          )}
        </div>
      </header>

      <main className="relative z-10 flex-1">
        {/* ═══ Hero Section ═══ */}
        <section className="flex flex-col items-center justify-center px-6 max-w-6xl mx-auto text-center pt-20 pb-16 w-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/20 mb-10 backdrop-blur-md shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
            </span>
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Live AI Debate Engine</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter text-white drop-shadow-2xl leading-tight">
            See Both Sides.<br />
            <span className="bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 bg-clip-text text-transparent drop-shadow-lg animate-[pulse_4s_ease-in-out_infinite]">
              For Real.
            </span>
          </h1>

          <p className="text-gray-300 text-lg md:text-2xl mb-14 max-w-3xl leading-relaxed font-light">
            Pick any topic. Two AI agents independently research <strong className="text-white font-semibold">both sides</strong>, build their own strategies, then argue it out live — citing real sources, steelmanning opponents, and getting scored by an impartial judging panel.
          </p>

          {/* Topic Input */}
          <div className="w-full max-w-3xl mb-14 relative">
            <div className="relative group rounded-[2rem] p-2 bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-3xl border border-white/30 transition-all duration-500 hover:border-cyan-500/50 hover:shadow-[0_0_50px_-10px_rgba(6,182,212,0.5)] focus-within:border-cyan-500/50 focus-within:ring-4 focus-within:ring-cyan-500/20 focus-within:shadow-[0_0_50px_-10px_rgba(6,182,212,0.5)] z-20">
              <div className="relative flex items-center w-full bg-slate-950/60 rounded-3xl overflow-hidden shadow-inner">
                <span className="pl-6 text-2xl drop-shadow-lg">💡</span>
                <input
                  ref={topicInputRef}
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStartDebate()}
                  placeholder="Enter any debate topic or statement..."
                  className="w-full bg-transparent pl-4 pr-44 py-6 text-xl text-white placeholder-gray-400 focus:outline-none transition-all font-medium"
                  aria-label="Debate topic input"
                />
                <button
                  onClick={() => handleStartDebate()}
                  className="absolute right-3 top-3 bottom-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 px-8 rounded-2xl font-bold text-base transition-all shadow-[0_4px_20px_rgba(6,182,212,0.4)] hover:shadow-[0_8px_30px_rgba(6,182,212,0.6)] hover:-translate-y-1 active:translate-y-0"
                  aria-label="Start Debate"
                >
                  Debate It &rarr;
                </button>
              </div>
            </div>

            {!isLoggedIn && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                <Link href="/auth" className="text-cyan-500 hover:text-cyan-400 font-bold transition-colors">Sign in</Link> to start debating
              </p>
            )}

            {/* Preset Topics */}
            <div className="mt-10 relative z-20">
              <p className="text-xs text-gray-400 mb-5 font-bold uppercase tracking-widest drop-shadow-md">Or choose a preset topic</p>
              <div className="flex flex-wrap gap-4 justify-center min-h-[48px]">
                {loading ? (
                  <div className="flex items-center gap-3 text-sm font-medium text-cyan-400">
                    <span className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                    Loading presets...
                  </div>
                ) : (
                  presets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleStartDebate(preset)}
                      className="text-sm font-bold text-white bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-full hover:bg-white/20 hover:border-white/40 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:-translate-y-1"
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
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Not your average AI chatbot.
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Most AI tools give you one answer. We give you two experts arguing their hardest — with real sources you can verify.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "🧬",
                title: "Dynamic Personas",
                desc: "Each debate generates unique AI advocates — a health economist vs. a policy researcher, an IP attorney vs. a digital rights advocate — tailored to the specific topic and evidence.",
                gradient: "from-cyan-500 to-blue-600",
                border: "border-cyan-500/20",
              },
              {
                icon: "📚",
                title: "Real Research, Real Sources",
                desc: "Agents cite actual studies, reports, and data with clickable source links. Every claim is traceable. No hallucination, no hand-waving.",
                gradient: "from-blue-500 to-indigo-600",
                border: "border-blue-500/20",
              },
              {
                icon: "🤝",
                title: "Steelman Requirement",
                desc: "Before attacking, each agent must restate the opponent's best argument in its strongest form. No strawmanning allowed — intellectual honesty is enforced.",
                gradient: "from-indigo-500 to-purple-600",
                border: "border-indigo-500/20",
              },
              {
                icon: "⚔️",
                title: "Multi-Round Structure",
                desc: "Opening → Rebuttal → Closing. Each agent sees all research, sees the opponent's arguments, and responds directly. No talking past each other.",
                gradient: "from-purple-500 to-fuchsia-600",
                border: "border-purple-500/20",
              },
              {
                icon: "📊",
                title: "Transparent Judging",
                desc: "Three specialized AI judges score Logic, Evidence, and Engagement separately. You see the rubric, the reasoning, and the scores — not a black box.",
                gradient: "from-fuchsia-500 to-pink-600",
                border: "border-fuchsia-500/20",
              },
              {
                icon: "🗳️",
                title: "Your Vote Matters",
                desc: "After the AI judges, you cast your own vote. See how the crowd agrees or disagrees with the panel. Human judgment meets AI analysis.",
                gradient: "from-pink-500 to-rose-600",
                border: "border-pink-500/20",
              },
            ].map((f) => (
              <div key={f.title} className={`group relative flex flex-col p-8 rounded-3xl bg-white/[0.03] border ${f.border} hover:bg-white/[0.06] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(255,255,255,0.08)]`}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} p-[2px] mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  <div className="w-full h-full bg-slate-950/90 rounded-[14px] flex items-center justify-center text-2xl">
                    {f.icon}
                  </div>
                </div>
                <h3 className="font-black text-lg text-white mb-3">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed flex-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ How It Works ═══ */}
        <section className="px-6 py-20 max-w-5xl mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
              How a debate unfolds
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Seven phases, fully automated. You watch it happen live.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { phase: "1", label: "Research", icon: "🔍", desc: "Both agents receive the complete evidence bundle — Pro and Con research. They analyze strengths, vulnerabilities, and build strategy.", bgClass: "bg-cyan-500/10", borderClass: "border-cyan-500/20", internal: false },
              { phase: "2", label: "Opening Arguments", icon: "📖", desc: "Each agent delivers a compelling opening statement — grounded in evidence, connected to values, streamed to you live.", bgClass: "bg-blue-500/10", borderClass: "border-blue-500/20", internal: false },
              { phase: "3", label: "Strategic Evaluation", icon: "🧠", desc: "Agents privately analyze the opponent's opening, identify weaknesses, and plan their rebuttal. Viewable via toggle.", bgClass: "bg-purple-500/10", borderClass: "border-purple-500/20", internal: true },
              { phase: "4", label: "Rebuttals", icon: "⚔️", desc: "Steelman the opponent's best point, then dismantle their weakest. Introduce new evidence. Challenge their sources.", bgClass: "bg-fuchsia-500/10", borderClass: "border-fuchsia-500/20", internal: false },
              { phase: "5", label: "Full Debate Evaluation", icon: "🧠", desc: "Agents step back and assess the entire debate. What narrowed? What's unresolved? How to close with maximum impact.", bgClass: "bg-pink-500/10", borderClass: "border-pink-500/20", internal: true },
              { phase: "6", label: "Closing Statements", icon: "🏁", desc: "Synthesize, don't repeat. Acknowledge the opponent. Address the hardest question. Close with impact.", bgClass: "bg-rose-500/10", borderClass: "border-rose-500/20", internal: false },
              { phase: "7", label: "Judging", icon: "📊", desc: "Three specialized judges (Logic, Evidence, Engagement) score independently. Position-swapped for bias detection.", bgClass: "bg-amber-500/10", borderClass: "border-amber-500/20", internal: false },
            ].map((step) => (
              <div key={step.phase} className={`flex items-start gap-5 p-6 rounded-2xl transition-all hover:bg-white/[0.03] group ${step.internal ? "opacity-60 hover:opacity-100" : ""}`}>
                <div className={`w-12 h-12 rounded-2xl ${step.bgClass} border ${step.borderClass} flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-base font-black text-white">{step.label}</span>
                    {step.internal && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">Internal</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ CTA Section ═══ */}
        <section className="px-6 py-24 max-w-4xl mx-auto w-full text-center">
          <div className="rounded-[2.5rem] bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/20 p-12 md:p-16 backdrop-blur-3xl shadow-[0_8px_60px_rgba(0,0,0,0.4)]">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
              Stop hearing one side.
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Every important topic has strong arguments on both sides. Most platforms hide that complexity. We put it front and center.
            </p>
            {isLoggedIn ? (
              <button
                onClick={() => topicInputRef.current?.focus()}
                className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 rounded-2xl font-black text-lg uppercase tracking-wider transition-all shadow-[0_4px_30px_rgba(6,182,212,0.4)] hover:shadow-[0_8px_40px_rgba(6,182,212,0.6)] hover:-translate-y-1"
              >
                Start a Debate →
              </button>
            ) : (
              <Link
                href="/auth"
                className="inline-block px-10 py-5 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white hover:from-fuchsia-500 hover:to-purple-500 rounded-2xl font-black text-lg uppercase tracking-wider transition-all shadow-[0_4px_30px_rgba(217,70,239,0.3)] hover:shadow-[0_8px_40px_rgba(217,70,239,0.5)] hover:-translate-y-1"
              >
                Create Free Account →
              </Link>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/10 bg-black/20 backdrop-blur-md text-center text-sm font-semibold text-gray-500">
        &copy; {new Date().getFullYear()} DebateMeBro. Open Source AI Debate Engine.
      </footer>
    </div>
  );
}
