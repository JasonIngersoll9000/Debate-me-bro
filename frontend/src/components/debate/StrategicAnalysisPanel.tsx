"use client";
import { useState, useMemo, ReactNode } from "react";

interface Props {
  content: string;
  side: "pro" | "con";
}

function parseBold(text: string, keyPrefix: string): ReactNode[] {
  const segments = text.split(/(\*\*.*?\*\*)/g);
  return segments.map((seg, j) => {
    if (seg.startsWith("**") && seg.endsWith("**")) {
      return <strong key={`${keyPrefix}-b${j}`} className="font-bold text-white">{seg.slice(2, -2)}</strong>;
    }
    return seg ? <span key={`${keyPrefix}-t${j}`}>{seg}</span> : null;
  }).filter(Boolean);
}

function renderMarkdownBlock(line: string, i: number): ReactNode {
  const trimmed = line.trimStart();

  if (/^-{3,}\s*$/.test(trimmed)) {
    return <hr key={`hr-${i}`} className="border-white/10 my-4" />;
  }
  if (trimmed.startsWith("### ")) {
    return <h4 key={`h3-${i}`} className="text-base font-black text-white mt-5 mb-1.5 tracking-tight">{parseBold(trimmed.slice(4), `h3-${i}`)}</h4>;
  }
  if (trimmed.startsWith("## ")) {
    return <h3 key={`h2-${i}`} className="text-lg font-black text-white mt-6 mb-2 tracking-tight">{parseBold(trimmed.slice(3), `h2-${i}`)}</h3>;
  }
  if (trimmed.startsWith("# ")) {
    return <h2 key={`h1-${i}`} className="text-xl font-black text-white mt-6 mb-2 tracking-tight">{parseBold(trimmed.slice(2), `h1-${i}`)}</h2>;
  }
  if (/^[-*]\s/.test(trimmed)) {
    return (
      <div key={`li-${i}`} className="flex gap-2.5 pl-2 mb-1">
        <span className="text-gray-500 select-none shrink-0 mt-0.5">•</span>
        <span className="text-sm text-gray-300 leading-relaxed">{parseBold(trimmed.slice(2), `li-${i}`)}</span>
      </div>
    );
  }
  if (/^\d+\.\s/.test(trimmed)) {
    const numMatch = trimmed.match(/^(\d+)\.\s/);
    const num = numMatch ? numMatch[1] : "";
    const rest = trimmed.replace(/^\d+\.\s/, "");
    return (
      <div key={`ol-${i}`} className="flex gap-2.5 pl-2 mb-1">
        <span className="text-gray-500 select-none shrink-0 mt-0.5 font-mono text-xs">{num}.</span>
        <span className="text-sm text-gray-300 leading-relaxed">{parseBold(rest, `ol-${i}`)}</span>
      </div>
    );
  }
  if (trimmed === "") {
    return <div key={`br-${i}`} className="h-2" />;
  }
  return <p key={`p-${i}`} className="text-sm text-gray-300 leading-relaxed mb-1">{parseBold(trimmed, `p-${i}`)}</p>;
}

export function StrategicAnalysisPanel({ content, side }: Props) {
  const [expanded, setExpanded] = useState(false);

  const parsed = useMemo(() => {
    if (!content) return null;
    return content.split("\n").map((line, i) => renderMarkdownBlock(line, i));
  }, [content]);

  const bgClass = side === "pro" ? "bg-cyan-900/20" : "bg-fuchsia-900/20";
  const borderClass = side === "pro" ? "border-cyan-500/30" : "border-fuchsia-500/30";
  const hoverClass = side === "pro" ? "hover:bg-cyan-900/40" : "hover:bg-fuchsia-900/40";
  const textClass = side === "pro" ? "text-cyan-400" : "text-fuchsia-400";
  const shadowClass = side === "pro" ? "shadow-[0_0_15px_rgba(6,182,212,0.1)]" : "shadow-[0_0_15px_rgba(217,70,239,0.1)]";

  return (
    <div className={`mt-4 border ${borderClass} rounded-2xl overflow-hidden backdrop-blur-3xl shadow-lg transition-all duration-300 ${shadowClass}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-black uppercase tracking-widest ${bgClass} ${hoverClass} transition-colors ${textClass}`}
      >
        <span className="text-lg">🧠</span>
        <span>{expanded ? "Hide" : "Show"} Strategic Analysis</span>
        <span className={`ml-auto text-xs transition-transform ${expanded ? "rotate-180" : ""}`}>▼</span>
      </button>
      {expanded && (
        <div className="px-6 py-5 bg-slate-950/80 shadow-inner max-h-[500px] overflow-y-auto border-t border-white/5 space-y-0.5">
          {parsed || <span className="text-gray-500 italic animate-pulse text-sm">Computing strategy...</span>}
        </div>
      )}
    </div>
  );
}
