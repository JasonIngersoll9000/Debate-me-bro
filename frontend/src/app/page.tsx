"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchPresetTopics, PresetTopic } from "@/lib/api";
import { useDebateStore } from "@/lib/store";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [presets, setPresets] = useState<PresetTopic[]>([]);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const setStoreTopic = useDebateStore((state) => state.setTopic);

  useEffect(() => {
    fetchPresetTopics()
      .then((data) => {
        setPresets(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load preset topics:", err);
        setLoading(false);
      });
  }, []);

  const handleStartDebate = (selectedTopic?: PresetTopic | string) => {
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
    <div className="min-h-screen bg-slate-950 text-gray-100 flex flex-col relative font-sans overflow-hidden">
      {/* Dynamic Animated Background Orbs */}
      <div className="absolute top-0 right-0 left-0 h-screen pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] bg-fuchsia-600/20 blur-[120px] rounded-full mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]"></div>
        <div className="absolute top-[30%] -right-[15%] w-[70vw] h-[70vw] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_1s]"></div>
        <div className="absolute -bottom-[20%] left-[20%] w-[50vw] h-[50vw] bg-violet-600/20 blur-[120px] rounded-full mix-blend-screen animate-[pulse_9s_ease-in-out_infinite_2s]"></div>
      </div>

      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-3xl px-8 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.5)]">
            <span className="text-white font-bold text-sm">🎯</span>
          </div>
          <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            DebateMeBro
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-sm font-medium text-gray-300 hover:text-white transition-colors" aria-label="My Debates">
            My Debates
          </button>
          <button className="text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-2.5 rounded-full transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-105" aria-label="Sign In">
            Sign In
          </button>
        </div>
      </header>
      
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-5xl mx-auto text-center py-16 w-full">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/20 mb-10 backdrop-blur-md shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Live AI Debate Engine</span>
        </div>

        <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter text-white drop-shadow-2xl leading-tight">
          See Both Sides.<br />
          <span className="bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 bg-clip-text text-transparent drop-shadow-lg animate-[pulse_4s_ease-in-out_infinite]">
            For Real.
          </span>
        </h1>
        
        <p className="text-gray-300 text-lg md:text-2xl mb-12 max-w-3xl leading-relaxed font-light drop-shadow-md">
          Two highly-trained AI agents research, argue, and steelman <strong className="text-white font-semibold">both sides</strong> of any topic — scored transparently by an impartial judging panel.
        </p>
        
        <div className="w-full max-w-3xl mb-16 relative">
          {/* Glowing Input Container */}
          <div className="relative group rounded-[2rem] p-2 bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-3xl border border-white/30 transition-all duration-500 hover:border-cyan-500/50 hover:shadow-[0_0_50px_-10px_rgba(6,182,212,0.5)] focus-within:border-cyan-500/50 focus-within:ring-4 focus-within:ring-cyan-500/20 focus-within:shadow-[0_0_50px_-10px_rgba(6,182,212,0.5)] z-20">
            <div className="relative flex items-center w-full bg-slate-950/60 rounded-3xl overflow-hidden shadow-inner">
              <span className="pl-6 text-2xl drop-shadow-lg">💡</span>
              <input
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
          
          <div className="mt-10 relative z-20">
            <p className="text-xs text-gray-400 mb-5 font-bold uppercase tracking-widest drop-shadow-md">Or choose a preset topic</p>
            <div className="flex flex-wrap gap-4 justify-center min-h-[48px]">
              {loading ? (
                <div className="flex items-center gap-3 text-sm font-medium text-cyan-400">
                  <span className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></span>
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

        {/* How It Works - Premium Bar */}
        <div className="w-full max-w-4xl mt-12 hidden md:block">
          <div className="rounded-[2.5rem] bg-white/10 border border-white/20 p-10 backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
            <div className="flex items-center justify-between relative">
              {/* Connecting Line */}
              <div className="absolute left-[5%] right-[5%] top-1/2 h-1 bg-gradient-to-r from-blue-500/20 via-fuchsia-500/50 to-orange-500/20 -z-10 translate-y-[-50%] rounded-full"></div>
              
              {/* Steps */}
              {[
                { label: "Research", icon: "🔍", color: "text-blue-300", bg: "bg-blue-900/40", border: "border-blue-400/50", shadow: "shadow-[0_0_15px_rgba(96,165,250,0.5)]" },
                { label: "Opening", icon: "📖", color: "text-indigo-300", bg: "bg-indigo-900/40", border: "border-indigo-400/50", shadow: "shadow-[0_0_15px_rgba(129,140,248,0.5)]" },
                { label: "Eval", icon: "🧠", color: "text-purple-300", bg: "bg-purple-900/40", border: "border-purple-400/50", shadow: "shadow-[0_0_15px_rgba(192,132,252,0.5)]" },
                { label: "Rebuttal", icon: "⚔️", color: "text-fuchsia-300", bg: "bg-fuchsia-900/40", border: "border-fuchsia-400/50", shadow: "shadow-[0_0_15px_rgba(232,121,249,0.5)]" },
                { label: "Eval", icon: "🧠", color: "text-pink-300", bg: "bg-pink-900/40", border: "border-pink-400/50", shadow: "shadow-[0_0_15px_rgba(244,114,182,0.5)]" },
                { label: "Closing", icon: "🏁", color: "text-rose-300", bg: "bg-rose-900/40", border: "border-rose-400/50", shadow: "shadow-[0_0_15px_rgba(251,113,133,0.5)]" },
                { label: "Judging", icon: "📊", color: "text-orange-300", bg: "bg-orange-900/40", border: "border-orange-400/50", shadow: "shadow-[0_0_15px_rgba(251,146,60,0.5)]" }
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-4 group">
                  <div className={`w-14 h-14 rounded-2xl border-2 ${step.border} ${step.bg} flex items-center justify-center text-2xl bg-slate-900/80 backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:${step.shadow} z-10`}>
                    <span className="group-hover:animate-bounce">{step.icon}</span>
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest ${step.color} drop-shadow-md`}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Core Value Props */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {[
            { 
              icon: "🔍", 
              title: "Real Research", 
              desc: "Agents cite verifiable, factual evidence drawn directly from uploaded research bundles without hallucination.",
              color: "blue",
              gradient: "from-blue-600 to-cyan-500"
            },
            { 
              icon: "⚖️", 
              title: "Intellectually Honest", 
              desc: "Debaters are strictly prompted to steelman opponent claims before attacking, fostering rigorous discussion.",
              color: "purple",
              gradient: "from-purple-600 to-fuchsia-500"
            },
            { 
              icon: "📊", 
              title: "Rubric-Scored", 
              desc: "A panel of targeted AI judges evaluate logic, evidence, and engagement, producing transparent reasoning.",
              color: "pink",
              gradient: "from-pink-600 to-rose-500"
            },
          ].map((f) => (
            <div key={f.title} className="flex flex-col items-start text-left p-10 rounded-[2rem] bg-white/5 border border-white/20 hover:bg-white/10 backdrop-blur-xl transition-all duration-500 group hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.1)]">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${f.gradient} p-[2px] mb-8 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                <div className="w-full h-full bg-slate-950/90 rounded-[14px] flex items-center justify-center text-3xl">
                  {f.icon}
                </div>
              </div>
              <h3 className="font-black text-xl text-white mb-3 drop-shadow-sm">{f.title}</h3>
              <p className="text-base text-gray-300 leading-relaxed font-medium">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/10 bg-black/20 backdrop-blur-md text-center text-sm font-semibold text-gray-500">
        &copy; {new Date().getFullYear()} DebateMeBro. Open Source Debate Engine.
      </footer>
    </div>
  );
}
