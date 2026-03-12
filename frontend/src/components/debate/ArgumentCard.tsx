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
  const glow = isPro ? "shadow-[0_0_40px_rgba(6,182,212,0.05)] hover:shadow-[0_0_50px_rgba(6,182,212,0.15)]" : "shadow-[0_0_40px_rgba(217,70,239,0.05)] hover:shadow-[0_0_50px_rgba(217,70,239,0.15)]";
  const border = isPro ? "border-cyan-500/20 hover:border-cyan-500/40" : "border-fuchsia-500/20 hover:border-fuchsia-500/40";
  const bg = "bg-white/[0.03]";
  const iconBg = isPro ? "bg-gradient-to-br from-cyan-400 to-blue-600" : "bg-gradient-to-br from-fuchsia-400 to-purple-600";
  const iconShadow = isPro ? "shadow-[0_0_20px_rgba(6,182,212,0.5)]" : "shadow-[0_0_20px_rgba(217,70,239,0.5)]";
  const titleColor = isPro ? "text-cyan-400" : "text-fuchsia-400";
  
  return (
    <div className={`mb-8 p-8 rounded-[2rem] border ${border} ${bg} ${glow} backdrop-blur-3xl transition-all duration-500 group relative overflow-hidden`}>
      {/* Subtle corner glow */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-20 transition-opacity duration-500 group-hover:opacity-40 ${isPro ? "bg-cyan-500" : "bg-fuchsia-500"}`}></div>

      <div className="flex items-center gap-5 mb-6 relative z-10">
        <div className={`w-14 h-14 rounded-2xl ${iconBg} ${iconShadow} flex items-center justify-center text-xl font-black text-white`}>
          {isPro ? "P" : "C"}
        </div>
        <div>
          <div className={`text-xl font-black ${titleColor} drop-shadow-sm`}>
            {persona?.name || (isPro ? "Pro Agent" : "Con Agent")}
          </div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{persona?.role || "Synthesizing..."}</div>
        </div>
      </div>
      
      <div className="relative z-10">
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
