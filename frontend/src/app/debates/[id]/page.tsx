"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useDebateStore } from "@/lib/store";
import { useShallow } from "zustand/shallow";
import {
  MOCK_TURNS, MOCK_PERSONAS, MOCK_STRATEGIC_ANALYSIS, MOCK_PHASE_SEQUENCE,
  MOCK_SCORES, MOCK_POSITIONS, MOCK_RESEARCH_STEPS, MOCK_JUDGE_VERDICT,
  MOCK_PRO_RESEARCH, MOCK_CON_RESEARCH,
} from "@/lib/mockDebateData";
import { PhaseNav } from "@/components/debate/PhaseNav";
import { ArgumentCard } from "@/components/debate/ArgumentCard";
import { StrategicAnalysisPanel } from "@/components/debate/StrategicAnalysisPanel";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/* ─── SSE Message types ─── */
type SSEMessage = {
  type: "phase_transition" | "content" | "complete" | "error";
  phase?: string;
  message?: string;
  speaker?: string;
  phase_type?: string;
  chunk?: string;
};

/* ─── Score Bar ─── */
function ScoreBar({ label, weight, proScore, conScore }: { label: string; weight: string; proScore: number; conScore: number }) {
  return (
    <div className="mb-5">
      <div className="flex justify-between text-xs mb-2">
        <span className="text-gray-400 font-bold uppercase tracking-widest">{label} <span className="text-gray-600">({weight})</span></span>
        <span className="font-mono font-black"><span className="text-cyan-400">{proScore}</span> vs <span className="text-fuchsia-400">{conScore}</span></span>
      </div>
      <div className="flex gap-1 h-3 rounded-full overflow-hidden">
        <div className="flex-1 bg-slate-800 rounded-l-full overflow-hidden flex justify-end">
          <div className="bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-1000 rounded-l-full" style={{ width: `${proScore * 20}%` }} />
        </div>
        <div className="flex-1 bg-slate-800 rounded-r-full overflow-hidden">
          <div className="bg-gradient-to-r from-fuchsia-400 to-fuchsia-600 transition-all duration-1000 rounded-r-full" style={{ width: `${conScore * 20}%` }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Research Document Modal ─── */
function ResearchDocModal({ side, onClose }: { side: "pro" | "con"; onClose: () => void }) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const isPro = side === "pro";

  useEffect(() => {
    fetch(`/evidence/healthcare/${side}_research.md`)
      .then((r) => r.text())
      .then((text) => { setContent(text); setLoading(false); })
      .catch(() => { setContent("Failed to load document."); setLoading(false); });
  }, [side]);

  // Escape HTML special characters to prevent XSS
  const escapeHtml = (str: string): string =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  // Only allow http/https URLs; fall back to "#" for anything else
  const sanitizeUrl = (url: string): string =>
    /^https?:\/\//i.test(url) ? url : "#";

  // Inline formatting (bold, links) — escapes plain text, sanitizes link URLs
  function inlineFormat(text: string): string {
    const parts: string[] = [];
    const pattern = /(\[([^\]]*)\]\(([^)]*)\))|(\*\*([^*]*)\*\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      parts.push(escapeHtml(text.slice(lastIndex, match.index)));
      if (match[1]) {
        // Link: [text](url)
        const linkText = escapeHtml(match[2]);
        const url = escapeHtml(sanitizeUrl(match[3]));
        parts.push(`<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 decoration-emerald-500/40 hover:decoration-emerald-400 transition-colors">${linkText}</a>`);
      } else if (match[4]) {
        // Bold: **text**
        parts.push(`<strong class="text-gray-200 font-bold">${escapeHtml(match[5])}</strong>`);
      }
      lastIndex = match.index + match[0].length;
    }
    parts.push(escapeHtml(text.slice(lastIndex)));
    return parts.join("");
  }

  // Simple markdown → HTML converter
  const renderMarkdown = (md: string) => {
    return md
      .split("\n")
      .map((line) => {
        // Headings
        if (line.startsWith("### ")) return `<h3 class="text-base font-bold text-gray-200 mt-6 mb-2">${escapeHtml(line.slice(4))}</h3>`;
        if (line.startsWith("## ")) return `<h2 class="text-lg font-black text-white mt-10 mb-3 pb-2 border-b border-white/10">${escapeHtml(line.slice(3))}</h2>`;
        if (line.startsWith("# ")) return `<h1 class="text-2xl font-black text-white mt-8 mb-4">${escapeHtml(line.slice(2))}</h1>`;
        if (line.startsWith("---")) return `<hr class="border-white/10 my-8" />`;
        if (line.trim() === "") return `<div class="h-3"></div>`;

        // List items
        let processed = line;
        if (processed.startsWith("- ")) {
          processed = inlineFormat(processed.slice(2));
          return `<div class="flex items-start gap-2 mb-2 ml-1"><span class="text-emerald-500 mt-1 shrink-0">•</span><span class="text-sm text-gray-400 leading-relaxed">${processed}</span></div>`;
        }

        // Regular paragraphs
        processed = inlineFormat(processed);
        return `<p class="text-sm text-gray-400 leading-relaxed mb-3">${processed}</p>`;
      })
      .join("\n");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-8 pb-8 px-4 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

      {/* Modal container */}
      <div
        className={`relative w-full max-w-6xl max-h-full rounded-3xl border-2 shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden ${
          isPro ? "border-cyan-500/30 bg-[#0a0f1a]" : "border-fuchsia-500/30 bg-[#0a0f1a]"
        }`}
      >
        {/* Sticky Header */}
        <div className={`px-6 lg:px-8 py-4 border-b flex items-center justify-between shrink-0 ${
          isPro ? "border-cyan-500/20 bg-cyan-950/40" : "border-fuchsia-500/20 bg-fuchsia-950/40"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-lg ${
              isPro ? "bg-gradient-to-br from-cyan-400 to-blue-600" : "bg-gradient-to-br from-fuchsia-400 to-purple-600"
            }`}>{isPro ? "P" : "C"}</div>
            <div>
              <div className={`text-sm font-black uppercase tracking-widest ${isPro ? "text-cyan-400" : "text-fuchsia-400"}`}>
                {isPro ? "Pro" : "Con"} Research Document
              </div>
              <div className="text-xs text-gray-500 font-mono">healthcare/{side}_research.md</div>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all text-lg font-bold cursor-pointer ${
              isPro
                ? "bg-cyan-500/10 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30"
                : "bg-fuchsia-500/10 hover:bg-fuchsia-500/30 text-fuchsia-400 border border-fuchsia-500/30"
            }`}
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
            </div>
          ) : (
            <div
              className="max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 lg:px-8 py-3 border-t flex items-center justify-between shrink-0 ${
          isPro ? "border-cyan-500/10 bg-cyan-950/20" : "border-fuchsia-500/10 bg-fuchsia-950/20"
        }`}>
          <span className="text-xs text-gray-600">{content.split("\n").length} lines • {(content.length / 1024).toFixed(0)} KB</span>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
            className="px-5 py-2 text-xs font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl border border-white/10 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Research Card ─── */
function ResearchCard({ side, sections }: { side: "pro" | "con"; sections: typeof MOCK_PRO_RESEARCH }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const isPro = side === "pro";
  const accentText = isPro ? "text-cyan-400" : "text-fuchsia-400";
  const accentBorder = isPro ? "border-cyan-500/20" : "border-fuchsia-500/20";
  const accentBg = isPro ? "bg-cyan-500/5" : "bg-fuchsia-500/5";
  const dotColor = isPro ? "bg-cyan-400" : "bg-fuchsia-400";

  return (
    <div className="space-y-3">
      {sections.map((section, i) => (
        <div key={i} className={`rounded-2xl border ${accentBorder} ${accentBg} backdrop-blur-xl overflow-hidden transition-all`}>
          <button onClick={() => setExpanded(expanded === i ? null : i)} className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
            <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
            <span className="font-bold text-sm text-gray-200 flex-1">{section.title}</span>
            <span className="text-gray-500 text-xs">{section.keyStats.length} key stats</span>
            <span className={`text-xs transition-transform ${expanded === i ? "rotate-180" : ""}`}>▼</span>
          </button>
          {expanded === i && (
            <div className="px-5 pb-5 space-y-3 border-t border-white/[0.04]">
              <div className="pt-4 space-y-2">
                {section.keyStats.map((stat, j) => (
                  <div key={j} className="flex items-start gap-2 text-sm">
                    <span className={`${accentText} mt-0.5 shrink-0`}>→</span>
                    <span className="text-gray-300">{stat}</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-white/[0.04]">
                <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Sources</div>
                {section.sources.map((src, j) => (
                  <div key={j} className="text-xs text-gray-500 flex gap-2 mb-1">
                    <span className="text-emerald-600">📄</span>
                    <span>{src}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ─── */
export default function DebatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isDemo = searchParams.get("demo") === "true";

  const {
    activePhase, debateTurns, internalAnalysis, isStreaming, completedPhases,
    proPersona, conPersona,
    setStreaming, setActivePhase, appendStreamToken, appendInternalAnalysis,
    setPersonas, markPhaseComplete,
  } = useDebateStore(
    useShallow((state) => ({
      activePhase: state.activePhase,
      debateTurns: state.debateTurns,
      internalAnalysis: state.internalAnalysis,
      isStreaming: state.isStreaming,
      completedPhases: state.completedPhases,
      proPersona: state.proPersona,
      conPersona: state.conPersona,
      setStreaming: state.setStreaming,
      setActivePhase: state.setActivePhase,
      appendStreamToken: state.appendStreamToken,
      appendInternalAnalysis: state.appendInternalAnalysis,
      setPersonas: state.setPersonas,
      markPhaseComplete: state.markPhaseComplete,
    }))
  );

  const [phaseTransitionMsg, setPhaseTransitionMsg] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(isDemo);
  const [userVote, setUserVote] = useState<"pro" | "con" | null>(null);
  const [researchStepIdx, setResearchStepIdx] = useState(0);
  const [researchReady, setResearchReady] = useState(false);
  const [docModal, setDocModal] = useState<"pro" | "con" | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const mockAbortRef = useRef(false);

  // ── Pause / Continue ──
  const waitResolveRef = useRef<(() => void) | null>(null);
  const [waitingForUser, setWaitingForUser] = useState(false);

  const waitForUser = (): Promise<void> => new Promise((resolve) => {
    setWaitingForUser(true);
    waitResolveRef.current = resolve;
  });

  const handleContinue = () => {
    setWaitingForUser(false);
    waitResolveRef.current?.();
    waitResolveRef.current = null;
  };

  const mapPhase = (bp: string) => {
    if (!bp) return "research";
    if (bp.startsWith("opening")) return "opening";
    if (bp.startsWith("rebuttal")) return "rebuttal";
    if (bp.startsWith("closing")) return "closing";
    if (bp === "research_consultation") return "research";
    return bp;
  };

  // ── Mock engine ──
  const runMockDebate = useCallback(async () => {
    mockAbortRef.current = false;
    setConnectionError(null);
    setPersonas(MOCK_PERSONAS.pro, MOCK_PERSONAS.con);
    setStreaming(true);

    const wait = (ms: number) => new Promise<void>((resolve) => {
      const t = setTimeout(resolve, ms);
      const check = setInterval(() => {
        if (mockAbortRef.current) { clearTimeout(t); clearInterval(check); resolve(); }
      }, 100);
    });

    for (const step of MOCK_PHASE_SEQUENCE) {
      if (mockAbortRef.current) break;
      setActivePhase(step.phase);

      if (step.phase === "research") {
        setPhaseTransitionMsg("Loading research documents and building citation index...");
        for (let i = 0; i < MOCK_RESEARCH_STEPS.length; i++) {
          if (mockAbortRef.current) break;
          setResearchStepIdx(i + 1);
          await wait(600);
        }
        setPhaseTransitionMsg(null);
        setResearchReady(true);
        markPhaseComplete("research");
        setStreaming(false);
        await waitForUser();
        setStreaming(true);
        continue;
      }

      if (step.phase === "eval_openings" || step.phase === "eval_full_debate") {
        setPhaseTransitionMsg(
          step.phase === "eval_openings"
            ? "Both agents analyzing opponent's opening argument..."
            : "Both agents reflecting on all arguments before closing..."
        );
        await wait(800);
        setPhaseTransitionMsg(null);

        const analysis = MOCK_STRATEGIC_ANALYSIS[step.phase];
        if (analysis) {
          for (const side of ["pro", "con"] as const) {
            const text = analysis[side];
            const chunkSize = 20;
            for (let i = 0; i < text.length; i += chunkSize) {
              if (mockAbortRef.current) break;
              appendInternalAnalysis(step.phase, side, text.slice(i, i + chunkSize));
              await wait(15);
            }
          }
        }
        markPhaseComplete(step.phase);
        setStreaming(false);
        await waitForUser();
        setStreaming(true);
        continue;
      }

      if (step.phase === "judging") {
        setPhaseTransitionMsg("AI judging panel evaluating debate...");
        await wait(2000);
        setPhaseTransitionMsg(null);
        setStreaming(false);
        markPhaseComplete("judging");
        break;
      }

      if (step.turnIndex !== undefined) {
        const turn = MOCK_TURNS[step.turnIndex];
        if (!turn) continue;

        setPhaseTransitionMsg(`${turn.side === "pro" ? MOCK_PERSONAS.pro.name : MOCK_PERSONAS.con.name} presenting ${step.phase}...`);
        await wait(600);
        setPhaseTransitionMsg(null);

        const text = turn.text;
        const chunkSize = 8;
        for (let i = 0; i < text.length; i += chunkSize) {
          if (mockAbortRef.current) break;
          appendStreamToken(turn.side, turn.phase, text.slice(i, i + chunkSize));
          await wait(step.streamSpeed || 3);
        }

        const storeState = useDebateStore.getState();
        if (turn.citations.length > 0) {
          useDebateStore.setState({
            debateTurns: storeState.debateTurns.map((t) =>
              t.side === turn.side && t.phase === turn.phase
                ? { ...t, citations: turn.citations } : t
            ),
          });
        }

        const currentIdx = MOCK_PHASE_SEQUENCE.indexOf(step);
        const nextStep = MOCK_PHASE_SEQUENCE[currentIdx + 1];
        const isLastTurnInPhase = !nextStep || nextStep.phase !== step.phase;

        if (isLastTurnInPhase) {
          markPhaseComplete(step.phase);
          setStreaming(false);
          await waitForUser();
          setStreaming(true);
        } else {
          await wait(300);
        }
      }
    }
    setStreaming(false);
  }, []);

  // ── Real SSE ──
  const connectSSE = useCallback(() => {
    setConnectionError(null);
    setPersonas({ name: "Proponent Agent", role: "AI Debater" }, { name: "Opponent Agent", role: "AI Debater" });
    const es = new EventSource(`${API_BASE_URL}/debates/${id}/stream`);
    eventSourceRef.current = es;
    es.onmessage = (event) => {
      let data: SSEMessage;
      try {
        data = JSON.parse(event.data) as SSEMessage;
      } catch {
        // Ignore non-JSON messages (keepalive pings, partial frames, etc.)
        return;
      }
      if (data.type === "phase_transition") { setActivePhase(mapPhase(data.phase ?? "")); setPhaseTransitionMsg(data.message ?? null); setStreaming(true); }
      else if (data.type === "content") {
        setStreaming(true); setPhaseTransitionMsg(null);
        const mp = mapPhase(data.phase ?? ""); const side: "pro" | "con" = data.speaker === "pro" ? "pro" : "con";
        if (data.phase_type === "internal") { setActivePhase(mp); appendInternalAnalysis(mp, side, data.chunk ?? ""); }
        else { setActivePhase(mp); appendStreamToken(side, mp, data.chunk ?? ""); }
      }
      else if (data.type === "complete") { setStreaming(false); setActivePhase("judging"); setPhaseTransitionMsg(null); es.close(); }
      else if (data.type === "error") { es.close(); setStreaming(false); setConnectionError(data.message ?? "Backend error."); }
    };
    es.onerror = () => { es.close(); setStreaming(false); setConnectionError("Could not connect. Make sure FastAPI is running on " + API_BASE_URL.replace("/api", "") + "."); };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (isDemoMode) { runMockDebate(); } else { connectSSE(); }
    return () => { mockAbortRef.current = true; eventSourceRef.current?.close(); useDebateStore.getState().reset(); };
  }, [id, isDemoMode]);

  const startDemoMode = () => { eventSourceRef.current?.close(); useDebateStore.getState().reset(); setConnectionError(null); setIsDemoMode(true); };

  const proSideTurns = debateTurns.filter((t) => t.side === "pro" && t.phase === activePhase);
  const conSideTurns = debateTurns.filter((t) => t.side === "con" && t.phase === activePhase);
  const proTotal = MOCK_SCORES.pro.logic * .3 + MOCK_SCORES.pro.evidence * .25 + MOCK_SCORES.pro.refutation * .25 + MOCK_SCORES.pro.steelman * .2;
  const conTotal = MOCK_SCORES.con.logic * .3 + MOCK_SCORES.con.evidence * .25 + MOCK_SCORES.con.refutation * .25 + MOCK_SCORES.con.steelman * .2;

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 flex flex-col relative overflow-hidden">
      {/* Background Meshes */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-fuchsia-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: "8s" }} />
      <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[150px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: "10s" }} />
      <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-violet-600/20 rounded-full blur-[100px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: "12s" }} />

      {/* ─── Header ─── */}
      <header className="relative z-30 border-b border-white/[0.06]">
        {/* Top bar */}
        <div className="px-6 py-3 flex items-center justify-between bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-fuchsia-950/30 backdrop-blur-3xl">
          <a href="/" className="hover:opacity-80 transition-opacity">
            <span className="text-lg font-black tracking-tighter bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">DebateMeBro</span>
          </a>
          <div className="flex items-center gap-3">
            {isDemoMode && <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-900/30 px-2.5 py-1 rounded-full border border-amber-500/30">Demo</span>}
            {isStreaming ? (
              <span className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-900/30 px-2.5 py-1 rounded-full border border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.2)]">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" /> Live
              </span>
            ) : (
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                {completedPhases.includes("judging") ? "Complete" : "Paused"}
              </span>
            )}
          </div>
        </div>

        {/* Topic title */}
        <div className="px-6 py-4 text-center bg-black/30 backdrop-blur-xl">
          <h1 className="text-lg lg:text-xl font-black text-white tracking-tight">
            {isDemoMode ? "Should the US adopt universal healthcare?" : `Debate: ${id}`}
          </h1>
        </div>

        {/* ─── Persona Cards ─── */}
        {proPersona && conPersona && (
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-4 bg-gradient-to-r from-cyan-950/20 via-transparent to-fuchsia-950/20">
            {/* Pro persona */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-lg font-black text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0">P</div>
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-0.5">Pro</div>
                <div className="font-bold text-white text-sm truncate">{proPersona.name}</div>
                <div className="text-xs text-gray-500 truncate">{proPersona.role}</div>
                {isDemoMode && <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed hidden lg:block">{MOCK_POSITIONS.pro}</p>}
              </div>
            </div>

            <div className="text-gray-600 font-black text-2xl select-none">⚡</div>

            {/* Con persona */}
            <div className="flex items-center gap-4 justify-end text-right">
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-widest text-fuchsia-400 mb-0.5">Con</div>
                <div className="font-bold text-white text-sm truncate">{conPersona.name}</div>
                <div className="text-xs text-gray-500 truncate">{conPersona.role}</div>
                {isDemoMode && <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed hidden lg:block">{MOCK_POSITIONS.con}</p>}
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-400 to-purple-600 flex items-center justify-center text-lg font-black text-white shadow-[0_0_20px_rgba(217,70,239,0.3)] shrink-0">C</div>
            </div>
          </div>
        )}
      </header>

      <PhaseNav />

      {/* ─── Error ─── */}
      {connectionError && (
        <div className="px-6 py-4 bg-red-950/50 border-b border-red-500/30 backdrop-blur-xl relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <span className="text-sm font-bold text-red-300">⚠️ {connectionError}</span>
          <div className="flex gap-3">
            <button onClick={connectSSE} className="px-4 py-1.5 text-xs font-black uppercase tracking-widest bg-red-600/40 hover:bg-red-600/60 text-red-200 rounded-full border border-red-500/40 transition-all">Retry</button>
            <button onClick={startDemoMode} className="px-4 py-1.5 text-xs font-black uppercase tracking-widest bg-amber-600/40 hover:bg-amber-600/60 text-amber-200 rounded-full border border-amber-500/40 transition-all">Run Demo</button>
          </div>
        </div>
      )}

      {/* ─── Phase Transition ─── */}
      {phaseTransitionMsg && (
        <div className="px-6 py-3 bg-purple-900/40 border-b border-purple-500/30 text-center backdrop-blur-xl relative z-10 shadow-[0_4px_20px_rgba(168,85,247,0.15)] flex justify-center items-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
          <span className="text-sm font-bold text-purple-300 tracking-wider uppercase">{phaseTransitionMsg}</span>
        </div>
      )}

      {/* ─── Continue Button ─── */}
      {waitingForUser && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <button onClick={handleContinue}
            className="px-8 py-4 text-sm font-black uppercase tracking-widest bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(168,85,247,0.6)]"
          >Continue →</button>
        </div>
      )}

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex overflow-hidden relative z-10">

        {/* ══ Research Phase ══ */}
        {activePhase === "research" && (
          <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-black/20">
            <div className="max-w-6xl mx-auto">
              {/* Loading steps */}
              {!researchReady && (
                <div className="text-center mb-8">
                  <div className="text-5xl mb-4">🔍</div>
                  <h2 className="text-2xl font-black text-white mb-2">Research Phase</h2>
                  <p className="text-gray-400 font-medium mb-6">Both AI Agents receive the complete research — Pro and Con — to build strategy from shared facts.</p>
                  <div className="max-w-md mx-auto space-y-3 text-left">
                    {MOCK_RESEARCH_STEPS.slice(0, researchStepIdx).map((step, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-purple-400">🔍</span>
                        <span className="text-gray-300 flex-1">{step.query}</span>
                        <span className="text-emerald-400 font-mono font-bold text-xs">{step.results}</span>
                      </div>
                    ))}
                    {researchStepIdx < MOCK_RESEARCH_STEPS.length && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 p-3"><span className="animate-spin">⏳</span> Loading...</div>
                    )}
                  </div>
                </div>
              )}

              {/* Research content — visible once loaded */}
              {researchReady && (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-white mb-2">📚 Evidence Bundle</h2>
                    <p className="text-sm text-gray-400 font-medium">Both agents received the same research. Expand any section to explore the evidence.</p>
                  </div>
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-sm font-black text-white">P</div>
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest text-cyan-400">Pro Research</div>
                          <div className="text-xs text-gray-500">{MOCK_PRO_RESEARCH.length} argument dimensions • {MOCK_PRO_RESEARCH.reduce((a, s) => a + s.sources.length, 0)} sources</div>
                        </div>
                      </div>
                      <ResearchCard side="pro" sections={MOCK_PRO_RESEARCH} />
                      <button onClick={() => setDocModal("pro")} className="mt-3 w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all">
                        📄 View Full Pro Document
                      </button>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-400 to-purple-600 flex items-center justify-center text-sm font-black text-white">C</div>
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest text-fuchsia-400">Con Research</div>
                          <div className="text-xs text-gray-500">{MOCK_CON_RESEARCH.length} argument dimensions • {MOCK_CON_RESEARCH.reduce((a, s) => a + s.sources.length, 0)} sources</div>
                        </div>
                      </div>
                      <ResearchCard side="con" sections={MOCK_CON_RESEARCH} />
                      <button onClick={() => setDocModal("con")} className="mt-3 w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest text-fuchsia-400 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/20 transition-all">
                        📄 View Full Con Document
                      </button>
                    </div>
                  </div>
                </>
              )}


            </div>
          </div>
        )}

        {/* ══ Judging ══ */}
        {activePhase === "judging" && (
          <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-black/20">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">📊</div>
                <h2 className="text-2xl font-black text-white mb-2">Judging Results</h2>
                <p className="text-sm text-gray-400 font-medium">3 AI judges with position-swapped verification. 2/3 judges consistent.</p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                <div className="p-8 rounded-[2rem] bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-lg">
                  <div className="flex justify-between text-xs text-gray-500 mb-6">
                    <span className="text-cyan-400 font-black uppercase tracking-widest">← Pro ({proPersona?.name})</span>
                    <span className="text-fuchsia-400 font-black uppercase tracking-widest">Con ({conPersona?.name}) →</span>
                  </div>
                  <ScoreBar label="Logical Validity" weight="30%" proScore={MOCK_SCORES.pro.logic} conScore={MOCK_SCORES.con.logic} />
                  <ScoreBar label="Evidence Quality" weight="25%" proScore={MOCK_SCORES.pro.evidence} conScore={MOCK_SCORES.con.evidence} />
                  <ScoreBar label="Refutation Strength" weight="25%" proScore={MOCK_SCORES.pro.refutation} conScore={MOCK_SCORES.con.refutation} />
                  <ScoreBar label="Steelmanning Quality" weight="20%" proScore={MOCK_SCORES.pro.steelman} conScore={MOCK_SCORES.con.steelman} />
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Weighted Total</span>
                      <span className="font-mono font-black text-lg">
                        <span className="text-cyan-400">{proTotal.toFixed(1)}</span>
                        <span className="text-gray-600 mx-2">vs</span>
                        <span className="text-fuchsia-400">{conTotal.toFixed(1)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-[2rem] bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-lg">
                    <div className="text-xs text-gray-500 mb-4 uppercase tracking-widest font-black">Your Vote</div>
                    <div className="flex gap-3 mb-4">
                      <button onClick={() => setUserVote("pro")} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${userVote === "pro" ? "bg-cyan-600 text-white ring-2 ring-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.3)]" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"}`}>👍 Pro Wins</button>
                      <button onClick={() => setUserVote("con")} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${userVote === "con" ? "bg-fuchsia-600 text-white ring-2 ring-fuchsia-400/40 shadow-[0_0_20px_rgba(217,70,239,0.3)]" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"}`}>👍 Con Wins</button>
                    </div>
                    {userVote && (
                      <div className="text-xs text-gray-400 p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="font-black text-emerald-400 mb-1">Vote recorded!</div>
                        Human votes: 47% Pro · 53% Con (23 total)<br />Weighting: 60% AI judges · 40% human votes
                      </div>
                    )}
                  </div>
                  <div className="p-6 rounded-[2rem] bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-lg">
                    <div className="text-xs text-gray-500 mb-3 uppercase tracking-widest font-black">AI Judges Verdict</div>
                    <p className="text-sm text-gray-300 leading-relaxed"><strong className="text-yellow-400">Extremely close.</strong> {MOCK_JUDGE_VERDICT.summary}</p>
                  </div>
                  <div className="p-6 rounded-[2rem] bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-lg">
                    <div className="text-xs text-gray-500 mb-3 uppercase tracking-widest font-black">Judge Reasoning</div>
                    <p className="text-xs text-gray-400 leading-relaxed">{MOCK_JUDGE_VERDICT.reasoning}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ Internal Eval ══ */}
        {["eval_openings", "eval_full_debate"].includes(activePhase) && (
          <div className="flex-1 overflow-y-auto p-12 bg-black/20">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-10">
                <h3 className="text-2xl font-black text-white mb-2">🧠 {activePhase === "eval_openings" ? "Evaluating Opening Arguments" : "Evaluating Full Debate"}</h3>
                <p className="text-sm text-gray-400 font-medium">Both agents are privately analyzing the preceding arguments to plan their next moves.</p>
                {isStreaming && <div className="mt-4 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" /></div>}
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center gap-3 mb-3 ml-2">
                    <span className="text-cyan-400 font-black uppercase text-xs tracking-widest bg-cyan-900/40 px-3 py-1 rounded-full border border-cyan-500/30">{proPersona?.name || "Pro"} — Analysis</span>
                  </div>
                  <StrategicAnalysisPanel content={internalAnalysis[activePhase]?.pro || ""} side="pro" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-3 ml-2">
                    <span className="text-fuchsia-400 font-black uppercase text-xs tracking-widest bg-fuchsia-900/40 px-3 py-1 rounded-full border border-fuchsia-500/30">{conPersona?.name || "Con"} — Analysis</span>
                  </div>
                  <StrategicAnalysisPanel content={internalAnalysis[activePhase]?.con || ""} side="con" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ Argument Phases ══ */}
        {["opening", "rebuttal", "closing"].includes(activePhase) && (
          <>
            <div className="flex-1 border-r border-cyan-900/30 overflow-y-auto p-8 lg:p-12 relative bg-gradient-to-b from-cyan-950/20 to-transparent">
              {proSideTurns.map((turn, i) => (
                <ArgumentCard key={i} turn={turn} persona={proPersona} isStreaming={isStreaming && i === proSideTurns.length - 1} />
              ))}
              {proSideTurns.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-cyan-500/40">
                  <span className="text-4xl mb-4 opacity-50">⏳</span>
                  <p className="text-xs font-black uppercase tracking-widest opacity-70">Awaiting Pro...</p>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-8 lg:p-12 relative bg-gradient-to-b from-fuchsia-950/20 to-transparent">
              {conSideTurns.map((turn, i) => (
                <ArgumentCard key={i} turn={turn} persona={conPersona} isStreaming={isStreaming && i === conSideTurns.length - 1} />
              ))}
              {conSideTurns.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-fuchsia-500/40">
                  <span className="text-4xl mb-4 opacity-50">⏳</span>
                  <p className="text-xs font-black uppercase tracking-widest opacity-70">Awaiting Con...</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* ─── Full Document Modal (root level for proper z-index) ─── */}
      {docModal && <ResearchDocModal side={docModal} onClose={() => setDocModal(null)} />}
    </div>
  );
}
