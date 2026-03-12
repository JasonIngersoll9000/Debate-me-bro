"use client";
import { useState } from "react";

interface Props {
  content: string;
  side: "pro" | "con";
}

export function StrategicAnalysisPanel({ content, side }: Props) {
  const [expanded, setExpanded] = useState(false);
  
  const bgClass = side === "pro" ? "bg-cyan-900/20" : "bg-fuchsia-900/20";
  const borderClass = side === "pro" ? "border-cyan-500/30" : "border-fuchsia-500/30";
  const hoverClass = side === "pro" ? "hover:bg-cyan-900/40" : "hover:bg-fuchsia-900/40";
  const textClass = side === "pro" ? "text-cyan-400" : "text-fuchsia-400";
  const shadowClass = side === "pro" ? "shadow-[0_0_15px_rgba(6,182,212,0.1)]" : "shadow-[0_0_15px_rgba(217,70,239,0.1)]";

  return (
    <div className={`mt-6 border ${borderClass} rounded-2xl overflow-hidden backdrop-blur-3xl shadow-lg transition-all duration-300 ${shadowClass}`}>
      <button 
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-black uppercase tracking-widest ${bgClass} ${hoverClass} transition-colors ${textClass}`}
      >
        <span className="text-xl">🧠</span>
        <span>{expanded ? "Hide" : "Show"} strategic analysis</span>
        <span className="ml-auto opacity-80">{expanded ? "▼" : "▶"}</span>
      </button>
      {expanded && (
        <div className="px-5 py-5 text-sm text-gray-400 font-mono leading-relaxed whitespace-pre-wrap bg-slate-950/90 shadow-inner max-h-96 overflow-y-auto border-t border-white/5">
          {content || <span className="text-gray-600 italic animate-pulse">Computing strategy...</span>}
        </div>
      )}
    </div>
  );
}
