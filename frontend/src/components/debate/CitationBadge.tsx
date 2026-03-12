"use client";
import { Citation } from "@/lib/store";

interface Props {
  citationId: string;
  citations: Citation[];
  isExpanded: boolean;
  onClick: () => void;
}

export function CitationBadge({ citationId, citations, isExpanded, onClick }: Props) {
  const citation = citations.find(c => c.id === citationId) || { id: citationId, url: "#" };

  // Only allow http/https URLs to prevent javascript: and data: injection
  const safeUrl = citation.url && /^https?:\/\//i.test(citation.url) ? citation.url : null;
  
  return (
    <span className="inline-block relative mx-1 align-baseline z-30">
      <button 
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-black tracking-widest transition-all cursor-pointer border shadow-sm uppercase
          ${isExpanded 
            ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.3)] scale-105" 
            : "bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/30 border-white/10"}`}
        title={citation.title || citation.id}
      >
        <span className="text-emerald-400 text-[10px]">🌐</span> 
        {citation.id.length > 30 ? citation.id.slice(0, 30) + "..." : citation.id}
      </button>
      
      {isExpanded && safeUrl && (
        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-72 p-4 bg-slate-900/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 animate-in fade-in zoom-in duration-200">
          <span className="block font-bold text-emerald-400 text-sm mb-2 break-words text-center">
            <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-300 transition-colors underline decoration-emerald-500/30 underline-offset-4">
              {citation.title || citation.id}
            </a>
          </span>
          <span className="block text-gray-400 text-[11px] mt-2 font-medium text-center">Verified Source • Click link to open</span>
          
          {/* Triangle pointer border */}
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-spacing-4 border-l-8 border-r-8 border-t-8 border-transparent border-t-emerald-500/40 drop-shadow-lg"></span>
        </span>
      )}
    </span>
  );
}
