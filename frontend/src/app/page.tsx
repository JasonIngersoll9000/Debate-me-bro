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
    <div className="min-h-screen bg-[#030305] text-gray-100 flex flex-col relative font-sans overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 right-0 left-0 h-screen pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#030305]/0 to-transparent blur-3xl opacity-60 mix-blend-screen"></div>
        <div className="absolute top-[20%] -right-[20%] w-[80vw] h-[80vw] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/10 via-[#030305]/0 to-transparent blur-3xl opacity-50 mix-blend-screen"></div>
      </div>

      <header className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-xl px-8 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <span className="text-white font-bold text-sm">🎯</span>
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            DebateMeBro
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-sm font-medium text-gray-400 hover:text-white transition-colors" aria-label="My Debates">
            My Debates
          </button>
          <button className="text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/5 px-5 py-2 rounded-full transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]" aria-label="Sign In">
            Sign In
          </button>
        </div>
      </header>
      
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-5xl mx-auto text-center py-16 w-full">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-10 backdrop-blur-md shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-emerald-300 uppercase tracking-widest">Live AI Debate Engine</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight text-white drop-shadow-sm leading-tight">
          See Both Sides.<br />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow-md">
            For Real.
          </span>
        </h1>
        
        <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-2xl leading-relaxed font-light">
          Two highly-trained AI agents research, argue, and steelman <strong className="text-gray-200 font-medium">both sides</strong> of any topic — scored transparently by an impartial judging panel.
        </p>
        
        <div className="w-full max-w-3xl mb-16">
          {/* Glowing Input Container */}
          <div className="relative group rounded-2xl p-1.5 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/10 transition-all duration-500 hover:border-purple-500/50 hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)] focus-within:border-purple-500/50 focus-within:ring-4 focus-within:ring-purple-500/20 focus-within:shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)]">
            <div className="relative flex items-center w-full bg-[#0a0a0f]/80 rounded-xl overflow-hidden">
              <span className="pl-6 text-gray-500 text-xl">💡</span>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStartDebate()}
                placeholder="Enter any debate topic or statement..."
                className="w-full bg-transparent pl-4 pr-40 py-5 text-lg text-white placeholder-gray-600 focus:outline-none transition-all"
                aria-label="Debate topic input"
              />
              <button
                onClick={() => handleStartDebate()}
                className="absolute right-2 top-2 bottom-2 bg-white text-black hover:bg-gray-200 px-8 rounded-lg font-bold text-sm transition-all shadow-[0_4px_14px_0_rgba(255,255,255,0.4)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.23)] hover:-translate-y-0.5"
                aria-label="Start Debate"
              >
                Debate It &rarr;
              </button>
            </div>
          </div>
          
          <div className="mt-8">
            <p className="text-xs text-gray-500 mb-4 font-medium uppercase tracking-widest">Or choose a preset topic</p>
            <div className="flex flex-wrap gap-3 justify-center min-h-[44px]">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="w-4 h-4 border-2 border-gray-600 border-t-white rounded-full animate-spin"></span>
                  Loading presets...
                </div>
              ) : (
                presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleStartDebate(preset)}
                    className="text-sm font-medium text-gray-300 bg-white/[0.03] border border-white/10 px-5 py-2.5 rounded-full hover:text-white hover:bg-white/10 hover:border-white/30 transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:-translate-y-0.5"
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
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-8 backdrop-blur-sm">
            <div className="flex items-center justify-between relative">
              {/* Connecting Line */}
              <div className="absolute left-[5%] right-[5%] top-1/2 h-0.5 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 -z-10 translate-y-[-50%]"></div>
              
              {/* Steps */}
              {[
                { label: "Research", icon: "🔍", color: "text-blue-400", bg: "bg-blue-900/20", border: "border-blue-500/30" },
                { label: "Opening", icon: "📖", color: "text-indigo-400", bg: "bg-indigo-900/20", border: "border-indigo-500/30" },
                { label: "Eval", icon: "🧠", color: "text-purple-400", bg: "bg-purple-900/20", border: "border-purple-500/30" },
                { label: "Rebuttal", icon: "⚔️", color: "text-fuchsia-400", bg: "bg-fuchsia-900/20", border: "border-fuchsia-500/30" },
                { label: "Eval", icon: "🧠", color: "text-pink-400", bg: "bg-pink-900/20", border: "border-pink-500/30" },
                { label: "Closing", icon: "🏁", color: "text-rose-400", bg: "bg-rose-900/20", border: "border-rose-500/30" },
                { label: "Judging", icon: "📊", color: "text-orange-400", bg: "bg-orange-900/20", border: "border-orange-500/30" }
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl border ${step.border} ${step.bg} flex items-center justify-center text-xl shadow-lg bg-[#0a0a0f]`}>
                    {step.icon}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${step.color}`}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Core Value Props */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {[
            { 
              icon: "🔍", 
              title: "Real Research", 
              desc: "Agents cite verifiable, factual evidence drawn directly from uploaded research bundles without hallucination.",
              color: "blue"
            },
            { 
              icon: "⚖️", 
              title: "Intellectually Honest", 
              desc: "Debaters are strictly prompted to steelman opponent claims before attacking, fostering rigorous discussion.",
              color: "purple"
            },
            { 
              icon: "📊", 
              title: "Rubric-Scored", 
              desc: "A panel of targeted AI judges evaluate logic, evidence, and engagement, producing transparent reasoning.",
              color: "pink"
            },
          ].map((f) => (
            <div key={f.title} className="flex flex-col items-start text-left p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
              <div className={`w-12 h-12 rounded-xl bg-${f.color}-500/10 border border-${f.color}-500/20 flex items-center justify-center text-2xl mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                {f.icon}
              </div>
              <h3 className="font-bold text-lg text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-white/5 text-center text-xs text-gray-600">
        &copy; {new Date().getFullYear()} DebateMeBro. Open Source Debate Engine.
      </footer>
    </div>
  );
}
