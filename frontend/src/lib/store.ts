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
  expertise_areas?: string[];
  core_values?: string[];
  rhetorical_approach?: string;
}

export interface EvidenceArgument {
  title: string;
  key_stats?: string[];
  sources?: string[];
}

export interface EvidenceBundle {
  proArguments: EvidenceArgument[];
  conArguments: EvidenceArgument[];
  citations: Record<string, { title: string; url?: string; author?: string; year?: string; finding?: string }>;
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

export interface JudgingScores {
  pro: { logic: number; evidence: number; refutation: number; steelman: number; weighted_total?: number };
  con: { logic: number; evidence: number; refutation: number; steelman: number; weighted_total?: number };
}

export interface JudgeResult {
  judge_name?: string;
  pro_score?: number;
  con_score?: number;
  winner?: string;
  overall_winner?: string;
  winner_explanation?: string;
  reasoning?: string;
  pro_strongest_move?: string;
  con_strongest_move?: string;
  pro_weakest_move?: string;
  con_weakest_move?: string;
}

export interface JudgingResults {
  winner: string;
  scores: JudgingScores;
  judges?: JudgeResult[];
  summary?: string;
}

export interface TopicMeta {
  resolution: string;
  proPosition: string;
  conPosition: string;
}

export interface DebateState {
  topicId: string | null;
  topicTitle: string;
  topicMeta: TopicMeta | null;
  activePhase: string;
  debateTurns: DebateTurn[];
  internalAnalysis: Record<string, Record<"pro" | "con", string>>;
  completedPhases: string[];
  isStreaming: boolean;
  proPersona: Persona | null;
  conPersona: Persona | null;
  judgingResults: JudgingResults | null;
  evidenceBundle: EvidenceBundle | null;
  isFromCache: boolean;
  
  setTopic: (id: string, title: string) => void;
  setTopicMeta: (meta: TopicMeta) => void;
  setActivePhase: (phase: string) => void;
  setPersonas: (pro: Persona, con: Persona) => void;
  addTurn: (turn: DebateTurn) => void;
  appendStreamToken: (side: "pro" | "con", phase: string, token: string) => void;
  appendInternalAnalysis: (phase: string, side: "pro" | "con", token: string) => void;
  markPhaseComplete: (phase: string) => void;
  setStreaming: (isStreaming: boolean) => void;
  setJudgingResults: (results: JudgingResults) => void;
  setEvidenceBundle: (bundle: EvidenceBundle) => void;
  setIsFromCache: (cached: boolean) => void;
  reset: () => void;
}

export const useDebateStore = create<DebateState>((set) => ({
  topicId: null,
  topicTitle: "",
  topicMeta: null,
  activePhase: "research",
  debateTurns: [],
  internalAnalysis: {},
  completedPhases: [],
  isStreaming: false,
  proPersona: null,
  conPersona: null,
  judgingResults: null,
  evidenceBundle: null,
  isFromCache: false,
  
  setTopic: (id, title) => set({ topicId: id, topicTitle: title }),
  
  setTopicMeta: (meta) => set({ topicMeta: meta }),
  
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
  
  setJudgingResults: (results) => set({ judgingResults: results }),
  
  setEvidenceBundle: (bundle) => set({ evidenceBundle: bundle }),
  
  setIsFromCache: (cached) => set({ isFromCache: cached }),
  
  reset: () => set({
    topicId: null,
    topicTitle: "",
    topicMeta: null,
    activePhase: "research",
    debateTurns: [],
    internalAnalysis: {},
    completedPhases: [],
    isStreaming: false,
    proPersona: null,
    conPersona: null,
    judgingResults: null,
    evidenceBundle: null,
    isFromCache: false,
  }),
}));
