"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useDebateStore, Persona, JudgeResult } from "@/lib/store";
import { useShallow } from "zustand/shallow";
import { fetchDebate, fetchDebateMode, DebateData } from "@/lib/api";
import {
  MOCK_TURNS, MOCK_PERSONAS, MOCK_STRATEGIC_ANALYSIS, MOCK_PHASE_SEQUENCE,
  MOCK_SCORES, MOCK_POSITIONS, MOCK_RESEARCH_STEPS, MOCK_JUDGE_VERDICT,
  MOCK_PRO_RESEARCH, MOCK_CON_RESEARCH,
} from "@/lib/mockDebateData";
import { PhaseNav } from "@/components/debate/PhaseNav";
import { ArgumentCard } from "@/components/debate/ArgumentCard";
import { StrategicAnalysisPanel } from "@/components/debate/StrategicAnalysisPanel";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

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

/* ─── Judge Card (expandable) ─── */
function JudgeCard({ judge }: { judge: JudgeResult }) {
  const [expanded, setExpanded] = useState(false);
  const name = judge.judge_name || "Judge";
  const proScore = judge.pro_score ?? 0;
  const conScore = judge.con_score ?? 0;
  const winner = judge.winner || judge.overall_winner || "";
  const winnerExpl = judge.winner_explanation || "";
  const reasoning = judge.reasoning || "";
  const proStrongest = judge.pro_strongest_move || "";
  const conStrongest = judge.con_strongest_move || "";
  const proWeakest = judge.pro_weakest_move || "";
  const conWeakest = judge.con_weakest_move || "";

  const iconMap: Record<string, string> = { "Logic Judge": "🧠", "Evidence Judge": "📚", "Engagement Judge": "⚔️" };
  const icon = iconMap[name] || "📋";
  const descMap: Record<string, string> = {
    "Logic Judge": "Evaluates logical validity, soundness of reasoning, and identification of fallacies",
    "Evidence Judge": "Evaluates quality of evidence, citation practices, and source credibility",
    "Engagement Judge": "Evaluates refutation strength, steelmanning quality, and direct engagement with opposing points",
  };
  const description = descMap[name] || "";
  const winnerColor = winner === "pro" ? "text-cyan-400" : winner === "con" ? "text-fuchsia-400" : "text-gray-400";
  const winnerBg = winner === "pro" ? "bg-cyan-900/30 border-cyan-500/30" : winner === "con" ? "bg-fuchsia-900/30 border-fuchsia-500/30" : "bg-gray-800/30 border-gray-500/30";

  return (
    <div className="rounded-2xl bg-white/[0.04] backdrop-blur-3xl border border-white/10 overflow-hidden transition-all hover:border-white/20">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left px-6 py-5 flex items-center gap-5 hover:bg-white/[0.02] transition-colors">
        <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center text-2xl shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-black text-white mb-0.5">{name}</div>
          {description && <div className="text-xs text-gray-400 leading-snug">{description}</div>}
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="font-mono text-sm font-black">
              <span className="text-cyan-400">{proScore}</span>
              <span className="text-gray-600 mx-1.5">vs</span>
              <span className="text-fuchsia-400">{conScore}</span>
            </div>
            {winner && (
              <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full border inline-block mt-1 ${winnerBg} ${winnerColor}`}>
                {winner === "pro" ? "Pro wins" : "Con wins"}
              </span>
            )}
          </div>
          <span className={`text-sm text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}>▼</span>
        </div>
      </button>
      {expanded && (
        <div className="px-6 pb-6 space-y-5 border-t border-white/[0.08]">
          {winnerExpl && (
            <div className="pt-5 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="text-xs font-black uppercase tracking-widest text-yellow-500/80 mb-2">Winner Explanation</div>
              <p className="text-sm text-gray-200 leading-relaxed">{winnerExpl}</p>
            </div>
          )}

          {(proStrongest || conStrongest) && (
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Strongest Moves</div>
              <div className="grid md:grid-cols-2 gap-4">
                {proStrongest && (
                  <div className="p-4 rounded-xl bg-cyan-500/[0.06] border border-cyan-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs font-black text-cyan-400">P</div>
                      <span className="text-xs font-black uppercase tracking-widest text-cyan-400">Pro</span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{proStrongest}</p>
                  </div>
                )}
                {conStrongest && (
                  <div className="p-4 rounded-xl bg-fuchsia-500/[0.06] border border-fuchsia-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-fuchsia-500/20 flex items-center justify-center text-xs font-black text-fuchsia-400">C</div>
                      <span className="text-xs font-black uppercase tracking-widest text-fuchsia-400">Con</span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{conStrongest}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {(proWeakest || conWeakest) && (
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Weakest Moves</div>
              <div className="grid md:grid-cols-2 gap-4">
                {proWeakest && (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center text-xs font-black text-cyan-500/60">P</div>
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Pro</span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">{proWeakest}</p>
                  </div>
                )}
                {conWeakest && (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-fuchsia-500/10 flex items-center justify-center text-xs font-black text-fuchsia-500/60">C</div>
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Con</span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">{conWeakest}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {reasoning && (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Full Reasoning</div>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{reasoning}</p>
            </div>
          )}
        </div>
      )}
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
  function escapeHtml(s: string): string {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Sanitize URLs to allow only http/https
  function sanitizeMdUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:" ? url : "#";
    } catch {
      return "#";
    }
  }

  // Inline formatting (bold, links) — HTML-escapes text portions and sanitizes link URLs
  function inlineFormat(text: string): string {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: string[] = [];
    let lastIndex = 0;
    let match;
    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        // `escaped` is already HTML-sanitized; bold captures from it are safe
        const escaped = escapeHtml(text.slice(lastIndex, match.index));
        parts.push(escaped.replace(/\*\*([^*]+)\*\*/g, (_, inner) => `<strong class="text-gray-200 font-bold">${inner}</strong>`));
      }
      const safeUrl = sanitizeMdUrl(match[2]);
      parts.push(
        `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 decoration-emerald-500/40 hover:decoration-emerald-400 transition-colors">${escapeHtml(match[1])}</a>`
      );
      lastIndex = linkRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      // `escaped` is already HTML-sanitized; bold captures from it are safe
      const escaped = escapeHtml(text.slice(lastIndex));
      parts.push(escaped.replace(/\*\*([^*]+)\*\*/g, (_, inner) => `<strong class="text-gray-200 font-bold">${inner}</strong>`));
    }
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
          processed = processed.slice(2);
          processed = inlineFormat(processed);
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

/* ─── Utilities ─── */
function mapPhase(bp: string): string {
  if (!bp) return "research";
  if (bp.startsWith("opening")) return "opening";
  if (bp.startsWith("rebuttal")) return "rebuttal";
  if (bp.startsWith("closing")) return "closing";
  if (bp === "research_consultation") return "research";
  return bp;
}

function normalizeScores(raw: Record<string, Record<string, number>> | undefined) {
  return {
    pro: {
      logic: raw?.pro?.logic ?? 0,
      evidence: raw?.pro?.evidence ?? 0,
      refutation: raw?.pro?.refutation ?? 0,
      steelman: raw?.pro?.steelman ?? 0,
      weighted_total: raw?.pro?.weighted_total,
    },
    con: {
      logic: raw?.con?.logic ?? 0,
      evidence: raw?.con?.evidence ?? 0,
      refutation: raw?.con?.refutation ?? 0,
      steelman: raw?.con?.steelman ?? 0,
      weighted_total: raw?.con?.weighted_total,
    },
  };
}

/* ─── Main Page ─── */
export default function DebatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isDemo = searchParams.get("demo") === "true";

  const {
    activePhase, debateTurns, internalAnalysis, isStreaming, completedPhases,
    proPersona, conPersona, judgingResults, topicMeta, isFromCache, evidenceBundle,
    setStreaming, setActivePhase, appendStreamToken, appendInternalAnalysis,
    setPersonas, markPhaseComplete, setJudgingResults, setTopicMeta, setIsFromCache,
    setTopic, setEvidenceBundle,
  } = useDebateStore(
    useShallow((state) => ({
      activePhase: state.activePhase,
      debateTurns: state.debateTurns,
      internalAnalysis: state.internalAnalysis,
      isStreaming: state.isStreaming,
      completedPhases: state.completedPhases,
      proPersona: state.proPersona,
      conPersona: state.conPersona,
      judgingResults: state.judgingResults,
      topicMeta: state.topicMeta,
      isFromCache: state.isFromCache,
      evidenceBundle: state.evidenceBundle,
      setStreaming: state.setStreaming,
      setActivePhase: state.setActivePhase,
      appendStreamToken: state.appendStreamToken,
      appendInternalAnalysis: state.appendInternalAnalysis,
      setPersonas: state.setPersonas,
      markPhaseComplete: state.markPhaseComplete,
      setJudgingResults: state.setJudgingResults,
      setTopicMeta: state.setTopicMeta,
      setIsFromCache: state.setIsFromCache,
      setTopic: state.setTopic,
      setEvidenceBundle: state.setEvidenceBundle,
    }))
  );

  const [phaseTransitionMsg, setPhaseTransitionMsg] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(isDemo);
  const [serverMode, setServerMode] = useState<"demo" | "live" | null>(null);
  const [userVote, setUserVote] = useState<"pro" | "con" | null>(null);
  const [researchStepIdx, setResearchStepIdx] = useState(0);
  const [researchReady, setResearchReady] = useState(false);
  const [docModal, setDocModal] = useState<"pro" | "con" | null>(null);
  const [personaRevealed, setPersonaRevealed] = useState(false);
  const personaRevealedRef = useRef(false);
  const [pendingPhase, setPendingPhase] = useState<string | null>(null);
  const pendingPhaseRef = useRef<string | null>(null);
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
    // Flush pending phase gate (live mode)
    if (pendingPhaseRef.current) {
      setActivePhase(pendingPhaseRef.current);
      setPendingPhase(null);
      pendingPhaseRef.current = null;
    }
    // Resume mock engine (demo mode)
    waitResolveRef.current?.();
    waitResolveRef.current = null;
  };

  // ── Mock engine ──
  const runMockDebate = useCallback(async () => {
    mockAbortRef.current = false;
    setConnectionError(null);
    setPersonas(MOCK_PERSONAS.pro, MOCK_PERSONAS.con);
    setStreaming(true);

    const wait = (ms: number) => new Promise<void>((resolve) => {
      let check: ReturnType<typeof setInterval>;
      const t = setTimeout(() => {
        clearInterval(check);
        resolve();
      }, ms);
      check = setInterval(() => {
        if (mockAbortRef.current) {
          clearTimeout(t);
          clearInterval(check);
          resolve();
        }
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

  // ── Load cached debate directly (no SSE needed) ──
  const loadCachedDebate = useCallback(async (cached: DebateData) => {
    const {
      setIsFromCache, setTopic, setTopicMeta, setPersonas, addTurn,
      markPhaseComplete, setJudgingResults, setActivePhase, setStreaming,
      appendInternalAnalysis, setEvidenceBundle,
    } = useDebateStore.getState();

    setIsFromCache(true);
    setTopic(cached.id, cached.topic);
    setTopicMeta({
      resolution: cached.resolution,
      proPosition: cached.pro_position,
      conPosition: cached.con_position,
    });

    // Set personas (include full details)
    const proP = cached.personas?.pro;
    const conP = cached.personas?.con;
    setPersonas(
      {
        name: proP?.name || "Pro Agent",
        role: proP?.identity || "AI Debater",
        expertise_areas: proP?.expertise_areas || [],
        core_values: proP?.core_values || [],
        rhetorical_approach: proP?.rhetorical_approach || "",
      },
      {
        name: conP?.name || "Con Agent",
        role: conP?.identity || "AI Debater",
        expertise_areas: conP?.expertise_areas || [],
        core_values: conP?.core_values || [],
        rhetorical_approach: conP?.rhetorical_approach || "",
      },
    );

    // Load evidence bundle if present
    if (cached.evidence) {
      setEvidenceBundle({
        proArguments: ((cached.evidence.pro_arguments || []) as string[]).map(a => ({ title: a })),
        conArguments: ((cached.evidence.con_arguments || []) as string[]).map(a => ({ title: a })),
        citations: (cached.evidence.citations || {}) as Record<string, { title: string; url?: string; author?: string; year?: string; finding?: string }>,
      });
    }

    // Load all turns into the store
    const phaseMap: Record<string, string> = {};
    for (const turn of cached.turns || []) {
      const mp = mapPhase(turn.phase);
      if (turn.is_internal) {
        // Load internal turns into internalAnalysis so eval panels display
        const side = (turn.side === "pro" || turn.side === "con") ? turn.side : "pro";
        appendInternalAnalysis(turn.phase, side, turn.text);
      } else {
        const side = turn.side as "pro" | "con";
        addTurn({ side, phase: mp, text: turn.text, citations: [] });
      }
      phaseMap[mp] = mp;
    }

    // Mark all phases complete
    for (const phase of Object.keys(phaseMap)) {
      markPhaseComplete(phase);
    }
    markPhaseComplete("research");

    // Load judging results
    if (cached.judging_results) {
      const jr = cached.judging_results;
      setJudgingResults({
        winner: jr.winner,
        scores: normalizeScores(jr.scores),
        judges: jr.judges,
        summary: jr.summary,
      });
      markPhaseComplete("judging");
    }

    // Start at research so user can browse through all phases via PhaseNav
    setActivePhase("research");

    setResearchReady(true);
    setResearchStepIdx(MOCK_RESEARCH_STEPS.length);
    setStreaming(false);
  }, [setResearchReady, setResearchStepIdx]);

  // ── Real SSE ──
  const connectSSE = useCallback(() => {
    // Close any existing connection before opening a new one to avoid duplicate events
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setConnectionError(null);
    setPersonas({ name: "Proponent Agent", role: "AI Debater" }, { name: "Opponent Agent", role: "AI Debater" });
    setStreaming(true);
    const modeParam = serverMode ? `?mode=${serverMode}` : "";
    const es = new EventSource(`${API_BASE_URL}/debates/${id}/stream${modeParam}`);
    eventSourceRef.current = es;

    // Track current and previous phase transitions for completion marking
    let lastPhaseTransition = "";
    let prevPhaseTransition = "";

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "evidence_loaded") {
        setTopic(id, data.topic || id);
        setTopicMeta({
          resolution: data.resolution || "",
          proPosition: data.pro_position || "",
          conPosition: data.con_position || "",
        });
        // Store real evidence bundle if provided
        if (data.pro_arguments || data.con_arguments) {
          setEvidenceBundle({
            proArguments: (data.pro_arguments || []).map((a: string) => ({ title: a })),
            conArguments: (data.con_arguments || []).map((a: string) => ({ title: a })),
            citations: data.citations || {},
          });
        }
        setActivePhase("research");
        setResearchReady(true);
        setResearchStepIdx(MOCK_RESEARCH_STEPS.length);
        markPhaseComplete("research");
      } else if (data.type === "personas") {
        const proP = data.pro || {};
        const conP = data.con || {};
        setPersonas(
          {
            name: proP.name || "Pro Agent",
            role: proP.identity || "AI Debater",
            expertise_areas: proP.expertise_areas || [],
            core_values: proP.core_values || [],
            rhetorical_approach: proP.rhetorical_approach || "",
          },
          {
            name: conP.name || "Con Agent",
            role: conP.identity || "AI Debater",
            expertise_areas: conP.expertise_areas || [],
            core_values: conP.core_values || [],
            rhetorical_approach: conP.rhetorical_approach || "",
          },
        );
      } else if (data.type === "internal_content") {
        // Stream internal phase thought process into store
        const side: "pro" | "con" = data.speaker === "pro" ? "pro" : "con";
        appendInternalAnalysis(data.phase, side, data.chunk || "");
      } else if (data.type === "phase_transition") {
        const mp = mapPhase(data.phase);
        // Mark the previous phase complete when a new phase starts
        if (lastPhaseTransition) {
          markPhaseComplete(mapPhase(lastPhaseTransition));
        }
        prevPhaseTransition = lastPhaseTransition;
        lastPhaseTransition = data.phase;
        setPhaseTransitionMsg(data.message);
        setStreaming(true);

        // Phase gating: for user-facing content phases, don't auto-advance
        const USER_PHASES = ["opening", "rebuttal", "closing"];
        const prevMp = prevPhaseTransition ? mapPhase(prevPhaseTransition) : "";
        // Gate the opening phase if personas haven't been acknowledged yet,
        // or gate any subsequent user phase when transitioning from another user phase.
        const gateForPersona = mp === "opening" && !personaRevealedRef.current;
        const gateForContinue = USER_PHASES.includes(mp) && prevMp && prevMp !== mp && USER_PHASES.includes(prevMp);
        if (gateForPersona || gateForContinue) {
          // Previous phase just ended, new one starting — gate it
          setPendingPhase(mp);
          pendingPhaseRef.current = mp;
          setWaitingForUser(true);
        } else {
          setActivePhase(mp);
        }

        // Mark internal phases complete immediately when they transition
        if (data.phase_type === "internal") {
          markPhaseComplete(mp);
        }
      } else if (data.type === "content") {
        setStreaming(true);
        setPhaseTransitionMsg(null);
        const mp = mapPhase(data.phase);
        const side: "pro" | "con" = data.speaker === "pro" ? "pro" : "con";
        // Always append content to the store (buffered); only advance displayed phase if not gated
        appendStreamToken(side, mp, data.chunk || "");
        if (!pendingPhaseRef.current) {
          setActivePhase(mp);
        }
        // Mark the previous phase complete if we've moved on to a different phase
        if (prevPhaseTransition && mapPhase(prevPhaseTransition) !== mp) {
          markPhaseComplete(mapPhase(prevPhaseTransition));
          prevPhaseTransition = "";
        }
      } else if (data.type === "judging_results") {
        const results = data.results || {};
        setJudgingResults({
          winner: results.winner || "",
          scores: normalizeScores(results.scores),
          judges: results.judges,
          summary: results.summary,
        });
        markPhaseComplete("judging");
      } else if (data.type === "complete") {
        // Mark all debate phases complete
        for (const p of ["research", "opening", "eval_openings", "rebuttal", "eval_full_debate", "closing"]) {
          markPhaseComplete(p);
        }
        setStreaming(false);
        setActivePhase("judging");
        setPhaseTransitionMsg(null);
        setIsFromCache(data.cached === true);
        es.close();
      } else if (data.type === "mode" && data.mode === "demo") {
        // Backend says "use demo mode" — switch to mock engine
        es.close();
        setStreaming(false);
        setIsDemoMode(true);
      } else if (data.type === "error") {
        es.close();
        setStreaming(false);
        setConnectionError(data.message || "Backend error.");
      }
    };
    es.onerror = () => {
      es.close();
      setStreaming(false);
      setConnectionError(
        "Could not connect. Make sure FastAPI is running on " + API_BASE_URL.replace("/api", "") + ".",
      );
    };
  }, [id, serverMode]);

  // ── Init: fetch server mode, check cache, then SSE or demo ──
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    // If user already triggered demo (via URL param or fallback), skip mode fetch
    if (isDemoMode) {
      setServerMode("demo");
      runMockDebate();
      return () => {
        cancelled = true;
        mockAbortRef.current = true;
        eventSourceRef.current?.close();
        useDebateStore.getState().reset();
      };
    }

    // Fetch server mode, then check cache, then connect
    fetchDebateMode().then((mode) => {
      if (cancelled) return;
      setServerMode(mode);

      if (mode === "demo") {
        // Server says demo — run mock engine directly
        setIsDemoMode(true);
        return;
      }

      // Live mode: check cache first, then SSE
      fetchDebate(id).then((cached) => {
        if (cancelled) return;
        if (cached && cached.status === "completed") {
          loadCachedDebate(cached);
        } else {
          connectSSE();
        }
      });
    });

    return () => {
      cancelled = true;
      mockAbortRef.current = true;
      eventSourceRef.current?.close();
      useDebateStore.getState().reset();
    };
  }, [id, isDemoMode]);

  const startDemoMode = () => { eventSourceRef.current?.close(); useDebateStore.getState().reset(); setConnectionError(null); setIsDemoMode(true); };

  const proSideTurns = debateTurns.filter((t) => t.side === "pro" && t.phase === activePhase);
  const conSideTurns = debateTurns.filter((t) => t.side === "con" && t.phase === activePhase);

  // Use real judging data if available, otherwise fall back to mock
  const scores = judgingResults?.scores ?? MOCK_SCORES;
  const proScores = scores.pro || MOCK_SCORES.pro;
  const conScores = scores.con || MOCK_SCORES.con;
  const proTotal = proScores.weighted_total ?? ((proScores.logic || 0) * .3 + (proScores.evidence || 0) * .25 + (proScores.refutation || 0) * .25 + (proScores.steelman || 0) * .2);
  const conTotal = conScores.weighted_total ?? ((conScores.logic || 0) * .3 + (conScores.evidence || 0) * .25 + (conScores.refutation || 0) * .25 + (conScores.steelman || 0) * .2);
  const judgeVerdict = judgingResults?.summary
    ? { summary: judgingResults.summary, reasoning: judgingResults.judges?.map(j => j.reasoning ?? "").join("\n\n") || "" }
    : MOCK_JUDGE_VERDICT;
  const rawWinner = judgingResults?.winner || (proTotal > conTotal ? "pro" : conTotal > proTotal ? "con" : "tie");
  const debateWinner = rawWinner === "pro" ? "Pro" : rawWinner === "con" ? "Con" : "Tie";
  const judges = judgingResults?.judges || [];

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
            {isDemoMode
              ? <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-900/30 px-2.5 py-1 rounded-full border border-amber-500/30">Demo</span>
              : <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest bg-sky-900/30 px-2.5 py-1 rounded-full border border-sky-500/30">Live</span>
            }
            {isFromCache && <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest bg-violet-900/30 px-2.5 py-1 rounded-full border border-violet-500/30">Cached</span>}
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
            {topicMeta?.resolution || (isDemoMode ? "Should the US adopt universal healthcare?" : `Debate: ${id}`)}
          </h1>
        </div>

        {/* ─── Persona Cards ─── */}
        {proPersona && conPersona && (() => {
          const PersonaCard = ({ persona, side, position }: { persona: Persona; side: "pro" | "con"; position: string }) => {
            const [open, setOpen] = useState(false);
            const isPro = side === "pro";
            const iconBg = isPro ? "bg-gradient-to-br from-cyan-400 to-blue-600" : "bg-gradient-to-br from-fuchsia-400 to-purple-600";
            const iconShadow = isPro ? "shadow-[0_0_20px_rgba(6,182,212,0.3)]" : "shadow-[0_0_20px_rgba(217,70,239,0.3)]";
            const borderColor = isPro ? "border-cyan-500/20" : "border-fuchsia-500/20";
            const bgColor = isPro ? "bg-cyan-950/20" : "bg-fuchsia-950/20";
            const labelColor = isPro ? "text-cyan-400" : "text-fuchsia-400";
            const tagBg = isPro ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20" : "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20";
            const align = isPro ? "text-left" : "text-right";
            return (
              <div className={`rounded-2xl border ${borderColor} ${bgColor} overflow-hidden transition-all`}>
                <button onClick={() => setOpen(!open)} className={`w-full px-5 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors ${!isPro ? "flex-row-reverse" : ""}`}>
                  <div className={`w-12 h-12 rounded-2xl ${iconBg} ${iconShadow} flex items-center justify-center text-lg font-black text-white shrink-0`}>{isPro ? "P" : "C"}</div>
                  <div className={`min-w-0 flex-1 ${align}`}>
                    <div className={`text-xs font-black uppercase tracking-widest ${labelColor} mb-0.5`}>{isPro ? "Pro" : "Con"}</div>
                    <div className="font-black text-white text-base truncate">{persona.name}</div>
                    <div className="text-sm text-gray-400 truncate">{persona.role}</div>
                  </div>
                  <span className={`text-xs text-gray-500 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}>▼</span>
                </button>
                {open && (
                  <div className={`px-5 pb-5 pt-3 border-t border-white/[0.06] space-y-3 ${align}`}>
                    {position && (
                      <div>
                        <div className={`text-xs font-black uppercase tracking-widest text-gray-500 mb-1`}>Position</div>
                        <p className="text-sm text-gray-300 leading-relaxed">{position}</p>
                      </div>
                    )}
                    {persona.expertise_areas && persona.expertise_areas.length > 0 && (
                      <div>
                        <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1.5">Expertise</div>
                        <div className={`flex flex-wrap gap-1.5 ${!isPro ? "justify-end" : ""}`}>{persona.expertise_areas.map((e, i) => <span key={i} className={`text-xs px-2.5 py-1 rounded-full border ${tagBg}`}>{e}</span>)}</div>
                      </div>
                    )}
                    {persona.core_values && persona.core_values.length > 0 && (
                      <div>
                        <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1.5">Core Values</div>
                        <div className={`flex flex-wrap gap-1.5 ${!isPro ? "justify-end" : ""}`}>{persona.core_values.map((v, i) => <span key={i} className={`text-xs px-2.5 py-1 rounded-full border ${tagBg}`}>{v}</span>)}</div>
                      </div>
                    )}
                    {persona.rhetorical_approach && (
                      <div>
                        <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Approach</div>
                        <p className="text-sm text-gray-400 leading-relaxed">{persona.rhetorical_approach}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          };
          return (
            <div className="flex items-start gap-3 px-6 py-4 bg-gradient-to-r from-cyan-950/20 via-transparent to-fuchsia-950/20">
              <div className="flex-1 min-w-0">
                <PersonaCard persona={proPersona} side="pro" position={topicMeta?.proPosition || (isDemoMode ? MOCK_POSITIONS.pro : "")} />
              </div>
              <div className="flex items-center justify-center w-10 pt-6 shrink-0">
                <span className="text-gray-600 font-black text-2xl select-none">⚡</span>
              </div>
              <div className="flex-1 min-w-0">
                <PersonaCard persona={conPersona} side="con" position={topicMeta?.conPosition || (isDemoMode ? MOCK_POSITIONS.con : "")} />
              </div>
            </div>
          );
        })()}
      </header>

      {/* ─── Persona Reveal Overlay ─── */}
      {proPersona && conPersona && !personaRevealed && !isDemoMode && !isFromCache && activePhase === "research" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="max-w-5xl w-full mx-4 animate-[fadeIn_0.5s_ease-out]">
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">⚔️</div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Meet Your Debaters</h2>
              <p className="text-sm text-gray-400 font-medium">Two AI advocates have been generated for this debate. Review their profiles, then start the debate.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Pro Persona Card */}
              <div className="p-6 rounded-[2rem] bg-gradient-to-b from-cyan-950/40 to-slate-950/80 border border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.1)] animate-[slideUp_0.6s_ease-out]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-xl font-black text-white shadow-lg">P</div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-cyan-400">Pro</div>
                    <div className="font-black text-white text-lg">{proPersona.name}</div>
                    <div className="text-xs text-gray-400">{proPersona.role}</div>
                  </div>
                </div>
                {proPersona.expertise_areas && proPersona.expertise_areas.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Expertise</div>
                    <div className="flex flex-wrap gap-1.5">{proPersona.expertise_areas.map((e, i) => <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">{e}</span>)}</div>
                  </div>
                )}
                {proPersona.core_values && proPersona.core_values.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Core Values</div>
                    <div className="flex flex-wrap gap-1.5">{proPersona.core_values.map((v, i) => <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">{v}</span>)}</div>
                  </div>
                )}
                {proPersona.rhetorical_approach && (
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Approach</div>
                    <p className="text-xs text-gray-400 leading-relaxed">{proPersona.rhetorical_approach}</p>
                  </div>
                )}
              </div>
              {/* Con Persona Card */}
              <div className="p-6 rounded-[2rem] bg-gradient-to-b from-fuchsia-950/40 to-slate-950/80 border border-fuchsia-500/20 shadow-[0_0_40px_rgba(217,70,239,0.1)] animate-[slideUp_0.6s_ease-out_0.15s_both]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-400 to-purple-600 flex items-center justify-center text-xl font-black text-white shadow-lg">C</div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-fuchsia-400">Con</div>
                    <div className="font-black text-white text-lg">{conPersona.name}</div>
                    <div className="text-xs text-gray-400">{conPersona.role}</div>
                  </div>
                </div>
                {conPersona.expertise_areas && conPersona.expertise_areas.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Expertise</div>
                    <div className="flex flex-wrap gap-1.5">{conPersona.expertise_areas.map((e, i) => <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20">{e}</span>)}</div>
                  </div>
                )}
                {conPersona.core_values && conPersona.core_values.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Core Values</div>
                    <div className="flex flex-wrap gap-1.5">{conPersona.core_values.map((v, i) => <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">{v}</span>)}</div>
                  </div>
                )}
                {conPersona.rhetorical_approach && (
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Approach</div>
                    <p className="text-xs text-gray-400 leading-relaxed">{conPersona.rhetorical_approach}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="text-center">
              <button
                onClick={() => {
                  personaRevealedRef.current = true;
                  setPersonaRevealed(true);
                  handleContinue();
                }}
                className="px-10 py-4 text-sm font-black uppercase tracking-widest bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(168,85,247,0.6)]"
              >Start Debate →</button>
            </div>
          </div>
        </div>
      )}

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
              {researchReady && (() => {
                const proResearch = evidenceBundle && !isDemoMode
                  ? evidenceBundle.proArguments.map(a => ({ title: a.title, keyStats: a.key_stats || [], sources: a.sources || [] }))
                  : MOCK_PRO_RESEARCH;
                const conResearch = evidenceBundle && !isDemoMode
                  ? evidenceBundle.conArguments.map(a => ({ title: a.title, keyStats: a.key_stats || [], sources: a.sources || [] }))
                  : MOCK_CON_RESEARCH;
                const citationCount = evidenceBundle && !isDemoMode
                  ? Object.keys(evidenceBundle.citations).length
                  : null;
                return (
                  <>
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-black text-white mb-2">📚 Evidence Bundle</h2>
                      <p className="text-sm text-gray-400 font-medium">
                        Both agents received the same research. {citationCount ? `${citationCount} sources indexed.` : "Expand any section to explore the evidence."}
                      </p>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-8">
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-sm font-black text-white">P</div>
                          <div>
                            <div className="text-xs font-black uppercase tracking-widest text-cyan-400">Pro Research</div>
                            <div className="text-xs text-gray-500">{proResearch.length} argument dimensions • {proResearch.reduce((a, s) => a + s.sources.length, 0)} sources</div>
                          </div>
                        </div>
                        <ResearchCard side="pro" sections={proResearch} />
                        <button onClick={() => setDocModal("pro")} className="mt-3 w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all">
                          📄 View Full Pro Document
                        </button>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-400 to-purple-600 flex items-center justify-center text-sm font-black text-white">C</div>
                          <div>
                            <div className="text-xs font-black uppercase tracking-widest text-fuchsia-400">Con Research</div>
                            <div className="text-xs text-gray-500">{conResearch.length} argument dimensions • {conResearch.reduce((a, s) => a + s.sources.length, 0)} sources</div>
                          </div>
                        </div>
                        <ResearchCard side="con" sections={conResearch} />
                        <button onClick={() => setDocModal("con")} className="mt-3 w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest text-fuchsia-400 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/20 transition-all">
                          📄 View Full Con Document
                        </button>
                      </div>
                    </div>

                    {/* Research Consultation — Agent Strategic Analysis */}
                    {(internalAnalysis["research_consultation"]?.pro || internalAnalysis["research_consultation"]?.con) && (
                      <div className="mt-10">
                        <div className="text-center mb-6">
                          <h3 className="text-lg font-black text-white mb-1">🧠 Agent Strategic Analysis</h3>
                          <p className="text-xs text-gray-400 font-medium">Each agent privately analyzed ALL research to plan their strategy.</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <div className="flex items-center gap-3 mb-3 ml-2">
                              <span className="text-cyan-400 font-black uppercase text-xs tracking-widest bg-cyan-900/40 px-3 py-1 rounded-full border border-cyan-500/30">{proPersona?.name || "Pro"} — Strategy</span>
                            </div>
                            <StrategicAnalysisPanel content={internalAnalysis["research_consultation"]?.pro || ""} side="pro" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-3 ml-2">
                              <span className="text-fuchsia-400 font-black uppercase text-xs tracking-widest bg-fuchsia-900/40 px-3 py-1 rounded-full border border-fuchsia-500/30">{conPersona?.name || "Con"} — Strategy</span>
                            </div>
                            <StrategicAnalysisPanel content={internalAnalysis["research_consultation"]?.con || ""} side="con" />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

            </div>
          </div>
        )}

        {/* ══ Judging ══ */}
        {activePhase === "judging" && (
          <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-black/20">
            <div className="max-w-5xl mx-auto">
              {/* Winner Banner */}
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">📊</div>
                <h2 className="text-2xl font-black text-white mb-2">Judging Results</h2>
                <div className={`inline-block px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest mt-2 ${rawWinner === "pro" ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/30" : rawWinner === "con" ? "bg-fuchsia-600/30 text-fuchsia-300 border border-fuchsia-500/30" : "bg-gray-600/30 text-gray-300 border border-gray-500/30"}`}>
                  {debateWinner} wins — {proTotal.toFixed(2)} vs {conTotal.toFixed(2)}
                </div>
              </div>

              {/* Score Overview */}
              <div className="p-8 rounded-[2rem] bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-lg mb-8">
                <div className="flex justify-between text-xs text-gray-500 mb-6">
                  <span className="text-cyan-400 font-black uppercase tracking-widest">← Pro ({proPersona?.name})</span>
                  <span className="text-fuchsia-400 font-black uppercase tracking-widest">Con ({conPersona?.name}) →</span>
                </div>
                <ScoreBar label="Logical Validity" weight="30%" proScore={proScores.logic ?? 0} conScore={conScores.logic ?? 0} />
                <ScoreBar label="Evidence Quality" weight="25%" proScore={proScores.evidence ?? 0} conScore={conScores.evidence ?? 0} />
                <ScoreBar label="Refutation Strength" weight="25%" proScore={proScores.refutation ?? 0} conScore={conScores.refutation ?? 0} />
                <ScoreBar label="Steelmanning Quality" weight="20%" proScore={proScores.steelman ?? 0} conScore={conScores.steelman ?? 0} />
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Weighted Total</span>
                    <span className="font-mono font-black text-lg">
                      <span className="text-cyan-400">{proTotal.toFixed(2)}</span>
                      <span className="text-gray-600 mx-2">vs</span>
                      <span className="text-fuchsia-400">{conTotal.toFixed(2)}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Verdict Summary */}
              <div className="p-6 rounded-[2rem] bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-lg mb-8">
                <div className="text-xs text-gray-500 mb-3 uppercase tracking-widest font-black">AI Judges Verdict</div>
                <p className="text-sm text-gray-300 leading-relaxed"><strong className="text-yellow-400">{debateWinner} wins.</strong> {judgeVerdict.summary}</p>
              </div>

              {/* Per-Judge Breakdown */}
              {judges.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-black text-white mb-4">Individual Judge Analysis</h3>
                  <div className="space-y-4">
                    {judges.map((judge, idx: number) => (
                      <JudgeCard key={idx} judge={judge} />
                    ))}
                  </div>
                </div>
              )}

              {/* Your Vote */}
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
