"use client";
import { DebateTurn, Persona } from "@/lib/store";
import { StreamingText } from "./StreamingText";

interface Props {
  turn: DebateTurn;
  persona: Persona | null;
  isStreaming: boolean;
}

export function ArgumentCard({ turn, persona, isStreaming }: Props) {
  const isPro = turn.side === "pro";
  const borderLeft = isPro ? "border-l-4 border-pro" : "border-l-4 border-con";
  const titleColor = isPro ? "text-pro" : "text-con";

  return (
    <div className={`mb-8 p-8 rounded-none bg-surface-container ${borderLeft} transition-all duration-500 group relative overflow-hidden`}>
      <div className="flex items-center gap-5 mb-6 relative z-10">
        <div className={`w-14 h-14 rounded-none flex items-center justify-center text-xl font-black ${isPro ? "bg-pro/20 text-pro" : "bg-con/20 text-con"}`}>
          {isPro ? "P" : "C"}
        </div>
        <div>
          <div className={`text-xl font-black ${titleColor} drop-shadow-sm`}>
            {persona?.name || (isPro ? "Pro Agent" : "Con Agent")}
          </div>
          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mt-1">{persona?.role || "Synthesizing..."}</div>
        </div>
      </div>

      <div className="relative z-10 font-body">
        <StreamingText
          text={turn.text}
          citations={turn.citations || []}
          isStreaming={isStreaming}
          side={turn.side}
        />
      </div>
    </div>
  );
}
