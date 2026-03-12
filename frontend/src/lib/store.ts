export interface DebateState {
  topicId: string | null;
  topicTitle: string;
  activePhase: string;
  setTopic: (id: string, title: string) => void;
  setActivePhase: (phase: string) => void;
  reset: () => void;
}

import { create } from "zustand";

export const useDebateStore = create<DebateState>((set) => ({
  topicId: null,
  topicTitle: "",
  activePhase: "research",
  
  setTopic: (id: string, title: string) => set({ topicId: id, topicTitle: title }),
  setActivePhase: (phase: string) => set({ activePhase: phase }),
  
  reset: () => set({
    topicId: null,
    topicTitle: "",
    activePhase: "research",
  }),
}));
