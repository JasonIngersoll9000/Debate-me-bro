"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [topic, setTopic] = useState("");
  const router = useRouter();

  const handleStartDebate = (selectedTopic?: string) => {
    const topicToUse = selectedTopic || topic;
    if (!topicToUse.trim()) return;

    // TODO(#9): Wire this up to the actual debate creation and streaming endpoints.
    // For now, we simulate navigating to the debate route with the topic via query params.
    console.log("Starting debate for topic:", topicToUse);
    router.push(`/debates/placeholder?topic=${encodeURIComponent(topicToUse)}`);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight">🎯 DebateMeBro</span>
        <div className="flex items-center gap-3">
          <button className="text-sm text-gray-400 hover:text-white transition-colors" aria-label="My Debates">
            My Debates
          </button>
          <button className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors" aria-label="Sign In">
            Sign In
          </button>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent">
          See Both Sides. For Real.
        </h1>
        <p className="text-gray-400 text-lg mb-8 max-w-lg">
          Two AI agents research, argue, and steelman both sides of any topic — scored by judges on logic, evidence, and intellectual honesty.
        </p>
        <div className="w-full max-w-xl">
          <div className="relative">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStartDebate()}
              placeholder="Enter a debate topic..."
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-4 text-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all"
              aria-label="Debate topic input"
            />
            <button
              onClick={() => handleStartDebate()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors"
              aria-label="Start Debate"
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
                onClick={() => {
                  setTopic(s);
                  handleStartDebate(s);
                }}
                className="text-xs text-gray-500 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full hover:text-gray-300 hover:border-gray-600 transition-colors"
                aria-label={`Preset topic: ${s}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-12 w-full max-w-lg">
          <div className="text-xs text-gray-600 mb-3 uppercase tracking-wider">How it works</div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            {["🔍 Research", "📖 Opening", "⚔️ Rebuttal", "🏁 Closing", "📊 Judging"].map((step, i) => (
              <div key={i} className="flex items-center gap-1">
                <span>{step}</span>
                {i < 4 && <span className="text-gray-700 ml-2">→</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 grid grid-cols-3 gap-8 text-center">
          {[
            { icon: "🔍", title: "Real Research", desc: "Evidence from real sources, not hallucinations" },
            { icon: "⚖️", title: "Steelmanned", desc: "Each side represents the other at its strongest" },
            { icon: "📊", title: "Rubric-Scored", desc: "Transparent judging across 4 criteria" },
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
