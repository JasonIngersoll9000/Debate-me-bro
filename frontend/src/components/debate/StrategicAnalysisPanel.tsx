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
      return <strong key={`${keyPrefix}-b${j}`} className="font-bold text-on-surface">{seg.slice(2, -2)}</strong>;
    }
    return seg ? <span key={`${keyPrefix}-t${j}`}>{seg}</span> : null;
  }).filter(Boolean);
}

function renderMarkdownBlock(line: string, i: number): ReactNode {
  const trimmed = line.trimStart();

  if (/^-{3,}\s*$/.test(trimmed)) {
    return <hr key={`hr-${i}`} className="border-outline-variant my-4" />;
  }
  if (trimmed.startsWith("### ")) {
    return <h4 key={`h3-${i}`} className="text-base font-black text-on-surface mt-5 mb-1.5 tracking-tight">{parseBold(trimmed.slice(4), `h3-${i}`)}</h4>;
  }
  if (trimmed.startsWith("## ")) {
    return <h3 key={`h2-${i}`} className="text-lg font-black text-on-surface mt-6 mb-2 tracking-tight">{parseBold(trimmed.slice(3), `h2-${i}`)}</h3>;
  }
  if (trimmed.startsWith("# ")) {
    return <h2 key={`h1-${i}`} className="text-xl font-black text-on-surface mt-6 mb-2 tracking-tight">{parseBold(trimmed.slice(2), `h1-${i}`)}</h2>;
  }
  if (/^[-*]\s/.test(trimmed)) {
    return (
      <div key={`li-${i}`} className="flex gap-2.5 pl-2 mb-1">
        <span className="text-on-surface-variant select-none shrink-0 mt-0.5">•</span>
        <span className="text-sm text-on-surface-variant leading-relaxed">{parseBold(trimmed.slice(2), `li-${i}`)}</span>
      </div>
    );
  }
  if (/^\d+\.\s/.test(trimmed)) {
    const numMatch = trimmed.match(/^(\d+)\.\s/);
    const num = numMatch ? numMatch[1] : "";
    const rest = trimmed.replace(/^\d+\.\s/, "");
    return (
      <div key={`ol-${i}`} className="flex gap-2.5 pl-2 mb-1">
        <span className="text-on-surface-variant select-none shrink-0 mt-0.5 font-mono text-xs">{num}.</span>
        <span className="text-sm text-on-surface-variant leading-relaxed">{parseBold(rest, `ol-${i}`)}</span>
      </div>
    );
  }
  if (trimmed === "") {
    return <div key={`br-${i}`} className="h-2" />;
  }
  return <p key={`p-${i}`} className="text-sm text-on-surface-variant leading-relaxed mb-1">{parseBold(trimmed, `p-${i}`)}</p>;
}

export function StrategicAnalysisPanel({ content, side }: Props) {
  const [expanded, setExpanded] = useState(false);

  const parsed = useMemo(() => {
    if (!content) return null;
    return content.split("\n").map((line, i) => renderMarkdownBlock(line, i));
  }, [content]);

  const bgClass = side === "pro" ? "bg-pro/20" : "bg-con/20";
  const hoverClass = side === "pro" ? "hover:bg-pro/30" : "hover:bg-con/30";
  const textClass = side === "pro" ? "text-pro" : "text-con";
  const borderLeft = side === "pro" ? "border-l-2 border-pro" : "border-l-2 border-con";

  return (
    <div className={`mt-4 rounded-none overflow-hidden transition-all duration-300 ${borderLeft}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-black uppercase tracking-widest ${bgClass} ${hoverClass} transition-colors ${textClass}`}
      >
        <span className="text-lg">🧠</span>
        <span>{expanded ? "Hide" : "Show"} Strategic Analysis</span>
        <span className={`ml-auto text-xs transition-transform ${expanded ? "rotate-180" : ""}`}>▼</span>
      </button>
      {expanded && (
        <div className="px-6 py-5 bg-surface-low shadow-inner max-h-[500px] overflow-y-auto border-t border-outline-variant space-y-0.5">
          {parsed || <span className="text-on-surface-variant italic animate-pulse text-sm">Computing strategy...</span>}
        </div>
      )}
    </div>
  );
}
