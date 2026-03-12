import { create } from "zustand";

export interface Citation {
  id: string;
  url?: string;
  title?: string;
}

export interface DebateTurn {
  side: "pro" | "con";
  phase: string;
  text: string;
  citations: Citation[];
}

export interface Persona {
  name: string;
  role: string;
}

export const DEBATE_PHASES = [
  { id: "research", label: "Research", icon: "🔍", internal: false },
  { id: "opening", label: "Opening", icon: "📖", internal: false },
  { id: "eval_openings", label: "Evaluation", icon: "🧠", internal: true },
  { id: "rebuttal", label: "Rebuttal", icon: "⚔️", internal: false },
  { id: "eval_full_debate", label: "Evaluation", icon: "🧠", internal: true },
  { id: "closing", label: "Closing", icon: "🏁", internal: false },
  { id: "judging", label: "Judging", icon: "📊", internal: false },
];

export interface DebateState {
  topicId: string | null;
  topicTitle: string;
  activePhase: string;
  debateTurns: DebateTurn[];
  internalAnalysis: Record<string, Record<"pro" | "con", string>>;
  completedPhases: string[];
  isStreaming: boolean;
  proPersona: Persona | null;
  conPersona: Persona | null;
  
  setTopic: (id: string, title: string) => void;
  setActivePhase: (phase: string) => void;
  setPersonas: (pro: Persona, con: Persona) => void;
  addTurn: (turn: DebateTurn) => void;
  appendStreamToken: (side: "pro" | "con", phase: string, token: string) => void;
  appendInternalAnalysis: (phase: string, side: "pro" | "con", token: string) => void;
  markPhaseComplete: (phase: string) => void;
  setStreaming: (isStreaming: boolean) => void;
  reset: () => void;
}

export const useDebateStore = create<DebateState>((set) => ({
  topicId: null,
  topicTitle: "",
  activePhase: "research",
  debateTurns: [],
  internalAnalysis: {},
  completedPhases: [],
  isStreaming: false,
  proPersona: null,
  conPersona: null,
  
  setTopic: (id, title) => set({ topicId: id, topicTitle: title }),
  
  setActivePhase: (phase) => set({ activePhase: phase }),
  
  setPersonas: (pro, con) => set({ proPersona: pro, conPersona: con }),
  
  addTurn: (turn) => set((state) => ({ debateTurns: [...state.debateTurns, turn] })),
  
  appendStreamToken: (side, phase, token) => set((state) => {
    const turns = [...state.debateTurns];
    const idx = turns.findIndex(t => t.side === side && t.phase === phase);
    if (idx >= 0) {
      turns[idx] = { ...turns[idx], text: turns[idx].text + token };
      return { debateTurns: turns };
    } else {
      return { debateTurns: [...turns, { side, phase, text: token, citations: [] }] };
    }
  }),

  appendInternalAnalysis: (phase, side, token) => set((state) => {
    const analysis = { ...state.internalAnalysis };
    if (!analysis[phase]) analysis[phase] = { pro: "", con: "" };
    analysis[phase] = {
      ...analysis[phase],
      [side]: (analysis[phase][side] || "") + token
    };
    return { internalAnalysis: analysis };
  }),

  markPhaseComplete: (phase) => set((state) => {
    if (!state.completedPhases.includes(phase)) {
      return { completedPhases: [...state.completedPhases, phase] };
    }
    return state;
  }),
  
  setStreaming: (isStreaming) => set({ isStreaming }),
  
  reset: () => set({
    topicId: null,
    topicTitle: "",
    activePhase: "research",
    debateTurns: [],
    internalAnalysis: {},
    completedPhases: [],
    isStreaming: false,
    proPersona: null,
    conPersona: null,
  }),
}));
