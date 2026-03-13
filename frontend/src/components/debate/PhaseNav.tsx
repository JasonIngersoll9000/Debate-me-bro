"use client";
import { useShallow } from "zustand/shallow";
import { useDebateStore, DEBATE_PHASES } from "@/lib/store";

export function PhaseNav({ onManualNav }: { onManualNav?: () => void } = {}) {
  const { activePhase, completedPhases, setActivePhase } = useDebateStore(
    useShallow((state) => ({
      activePhase: state.activePhase,
      completedPhases: state.completedPhases,
      setActivePhase: state.setActivePhase,
    }))
  );

  return (
    <div className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-950/80 via-slate-900/60 to-slate-950/80 backdrop-blur-3xl border-b border-white/[0.06] overflow-x-auto w-full z-20">
      {DEBATE_PHASES.map((phase, i) => {
        const isActive = activePhase === phase.id;
        const isComplete = completedPhases.includes(phase.id);
        
        return (
          <div key={phase.id} className="flex items-center shrink-0">
            <button
              onClick={() => { if (isComplete || isActive) { setActivePhase(phase.id); onManualNav?.(); } }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border
                ${isActive ? "bg-white/10 text-white border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-105" 
                  : isComplete ? "text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10 cursor-pointer" 
                  : "text-gray-600 border-transparent cursor-default"} 
                ${phase.internal ? "italic font-semibold opacity-80" : "uppercase tracking-widest"}`}
            >
              {isComplete && !isActive ? <span className="text-cyan-300">✓</span> : <span>{phase.icon}</span>}
              <span>{phase.label}</span>
            </button>
            {i < DEBATE_PHASES.length - 1 && <span className="text-gray-700 mx-2">›</span>}
          </div>
        );
      })}
    </div>
  );
}
