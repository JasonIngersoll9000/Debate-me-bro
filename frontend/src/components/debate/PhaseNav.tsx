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
    <div className="flex items-center justify-center gap-2 px-6 py-3 bg-surface-low border-b border-outline-variant overflow-x-auto w-full z-20">
      {DEBATE_PHASES.map((phase, i) => {
        const isActive = activePhase === phase.id;
        const isComplete = completedPhases.includes(phase.id);

        return (
          <div key={phase.id} className="flex items-center shrink-0">
            <button
              onClick={() => { if (isComplete || isActive) { setActivePhase(phase.id); onManualNav?.(); } }}
              className={`flex items-center gap-2 px-4 py-2 rounded-none text-xs font-bold transition-all whitespace-nowrap border
                ${isActive ? "bg-surface-bright text-on-surface border-l-2 border-pro"
                  : isComplete ? "text-pro border-pro/30 hover:bg-surface-high cursor-pointer"
                  : "text-on-surface-variant opacity-40 border-transparent cursor-default"}
                ${phase.internal ? "italic font-semibold opacity-80" : "uppercase tracking-widest"}`}
            >
              {isComplete && !isActive ? <span className="text-pro">✓</span> : <span>{phase.icon}</span>}
              <span>{phase.label}</span>
            </button>
            {i < DEBATE_PHASES.length - 1 && <span className="text-on-surface-variant mx-2">›</span>}
          </div>
        );
      })}
    </div>
  );
}
