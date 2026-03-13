"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useDebateStore } from "@/lib/store";
import ReactMarkdown from "react-markdown";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface TopicAnalysis {
  topic_id: string;
  resolution: string;
  pro_position: string;
  con_position: string;
  pro_dimensions: string[];
  con_dimensions: string[];
  pro_prompt: string;
  con_prompt: string;
}

type Step = "input" | "research" | "upload";

function NewDebatePageInner() {
  const [step, setStep] = useState<Step>("input");
  const [resolution, setResolution] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<TopicAnalysis | null>(null);
  const [proCopied, setProCopied] = useState(false);
  const [conCopied, setConCopied] = useState(false);
  const [proUploaded, setProUploaded] = useState(false);
  const [conUploaded, setConUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [proDragOver, setProDragOver] = useState(false);
  const [conDragOver, setConDragOver] = useState(false);
  const [proInputMode, setProInputMode] = useState<"file" | "paste">("file");
  const [conInputMode, setConInputMode] = useState<"file" | "paste">("file");
  const [proPasteText, setProPasteText] = useState("");
  const [conPasteText, setConPasteText] = useState("");
  const proFileRef = useRef<HTMLInputElement>(null);
  const conFileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const setStoreTopic = useDebateStore((state) => state.setTopic);

  useEffect(() => {
    const t = (searchParams.get("topic") || "").trim();
    if (!t) return;
    if (!resolution.trim()) {
      setResolution(t);
    }
    setStoreTopic("custom", t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleAnalyze = async () => {
    if (!resolution.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/research/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution: resolution.trim(), context: context.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed to analyze topic");
      const data: TopicAnalysis = await res.json();
      setAnalysis(data);
      setStep("research");
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, side: "pro" | "con") => {
    await navigator.clipboard.writeText(text);
    if (side === "pro") {
      setProCopied(true);
      setTimeout(() => setProCopied(false), 2000);
    } else {
      setConCopied(true);
      setTimeout(() => setConCopied(false), 2000);
    }
  };

  const handleUpload = async (side: "pro" | "con", file: File) => {
    if (!analysis) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("side", side);
      formData.append("file", file);
      const res = await fetch(`${API_BASE_URL}/api/research/upload/${analysis.topic_id}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (side === "pro") setProUploaded(true);
      if (side === "con") setConUploaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload error");
    } finally {
      setUploading(false);
    }
  };

  const handlePasteUpload = async (side: "pro" | "con") => {
    const text = side === "pro" ? proPasteText : conPasteText;
    if (!text.trim()) return;
    const file = new File([text], `${side}_research.md`, { type: "text/markdown" });
    await handleUpload(side, file);
  };

  const handleDrop = useCallback((side: "pro" | "con") => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (side === "pro") setProDragOver(false);
    else setConDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(side, file);
  }, [analysis]);

  const handleDragOver = useCallback((side: "pro" | "con") => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (side === "pro") setProDragOver(true);
    else setConDragOver(true);
  }, []);

  const handleDragLeave = useCallback((side: "pro" | "con") => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (side === "pro") setProDragOver(false);
    else setConDragOver(false);
  }, []);

  const handleStartDebate = () => {
    if (analysis) {
      router.push(`/debates/${analysis.topic_id}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 font-sans relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute top-[40%] -right-[15%] w-[60vw] h-[60vw] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-3xl px-8 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.5)]">
            <span className="text-white font-bold text-sm">🎯</span>
          </div>
          <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            DebateMeBro
          </span>
        </Link>
        <div className="text-sm text-gray-500">Custom Topic</div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Step Indicator */}
        <div className="flex items-center gap-4 mb-12">
          {[
            { id: "input", num: 1, label: "Enter Topic" },
            { id: "research", num: 2, label: "Get Research Prompts" },
            { id: "upload", num: 3, label: "Upload & Start" },
          ].map((s, i) => (
            <div key={s.id} className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all ${
                  step === s.id
                    ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                    : (["input", "research", "upload"].indexOf(step) > i)
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-white/5 text-gray-600 border border-white/10"
                }`}
              >
                {["input", "research", "upload"].indexOf(step) > i ? "✓" : s.num}
              </div>
              <span className={`text-sm font-medium ${step === s.id ? "text-white" : "text-gray-500"}`}>
                {s.label}
              </span>
              {i < 2 && <div className="w-12 h-px bg-white/10" />}
            </div>
          ))}
        </div>

        {/* Step 1: Enter resolution */}
        {step === "input" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-black text-white mb-2">Create a Custom Debate</h1>
              <p className="text-gray-500">Enter any resolution. Our AI will analyze it and generate research prompts for both sides.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Debate Resolution</label>
                <input
                  type="text"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  placeholder="e.g. Should the US ban TikTok?"
                  className="w-full px-5 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Additional Context (optional)</label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Any specific angle, framing, or context you want the debate to focus on..."
                  rows={3}
                  className="w-full px-5 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10"
                />
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!resolution.trim() || loading}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold text-lg transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Analyzing..." : "Analyze Topic →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Research Prompts */}
        {step === "research" && analysis && (
          <div className="space-y-10">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-black text-white mb-3">Research Prompts</h1>
              <p className="text-gray-400 leading-relaxed max-w-2xl">
                We&apos;ve analyzed your topic. Follow the steps below to gather deep research for both sides, then upload the results to start your debate.
              </p>
            </div>

            {/* How-to Steps */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
              <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">How It Works</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { num: "1", icon: "📋", title: "Copy a prompt below", desc: "Each prompt is tailored to research one side of the debate" },
                  { num: "2", icon: "🤖", title: "Paste into an AI tool", desc: "Use Claude, ChatGPT, or any AI to generate deep research" },
                  { num: "3", icon: "📤", title: "Upload the results", desc: "Save as Markdown and upload in the next step" },
                ].map((s) => (
                  <div key={s.num} className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center text-sm font-black text-cyan-400 shrink-0">
                      {s.num}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white mb-0.5">{s.title}</div>
                      <div className="text-xs text-gray-500 leading-snug">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Position Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl bg-gradient-to-br from-cyan-500/[0.08] to-blue-600/[0.04] border border-cyan-500/20 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs font-black text-cyan-400">P</div>
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">Pro Position</span>
                </div>
                <textarea
                  aria-label="Pro position"
                  value={analysis.pro_position}
                  onChange={(e) => setAnalysis({ ...analysis, pro_position: e.target.value })}
                  rows={8}
                  className="w-full bg-black/20 text-lg text-gray-200 border border-cyan-500/15 rounded-xl px-5 py-4 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 resize-vertical leading-relaxed"
                />
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-fuchsia-500/[0.08] to-purple-600/[0.04] border border-fuchsia-500/20 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-fuchsia-500/20 flex items-center justify-center text-xs font-black text-fuchsia-400">C</div>
                  <span className="text-xs font-black text-fuchsia-400 uppercase tracking-widest">Con Position</span>
                </div>
                <textarea
                  aria-label="Con position"
                  value={analysis.con_position}
                  onChange={(e) => setAnalysis({ ...analysis, con_position: e.target.value })}
                  rows={8}
                  className="w-full bg-black/20 text-lg text-gray-200 border border-fuchsia-500/15 rounded-xl px-5 py-4 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/20 resize-vertical leading-relaxed"
                />
              </div>
            </div>

            {/* Pro Prompt Card */}
            <div className="rounded-2xl bg-white/[0.02] border border-cyan-500/15 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-cyan-500/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                    <span className="text-cyan-400 text-sm">📋</span>
                  </div>
                  <div>
                    <div className="text-sm font-black text-cyan-400">PRO Research Prompt</div>
                    <div className="text-[11px] text-gray-500">Copy and paste into ChatGPT, Claude, or Gemini</div>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(analysis.pro_prompt, "pro")}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 ${
                    proCopied
                      ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                      : "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                  }`}
                >
                  {proCopied ? "✓ Copied!" : "Copy to Clipboard"}
                </button>
              </div>
              <div className="p-6 max-h-[32rem] overflow-y-auto scrollbar-thin prose prose-invert prose-base max-w-none prose-headings:text-cyan-300 prose-headings:font-black prose-strong:text-gray-200 prose-li:text-gray-300 prose-p:text-gray-300 prose-ul:list-disc prose-ol:list-decimal">
                <ReactMarkdown>{analysis.pro_prompt}</ReactMarkdown>
              </div>
            </div>

            {/* Con Prompt Card */}
            <div className="rounded-2xl bg-white/[0.02] border border-fuchsia-500/15 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-fuchsia-500/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-fuchsia-500/15 flex items-center justify-center">
                    <span className="text-fuchsia-400 text-sm">📋</span>
                  </div>
                  <div>
                    <div className="text-sm font-black text-fuchsia-400">CON Research Prompt</div>
                    <div className="text-[11px] text-gray-500">Copy and paste into ChatGPT, Claude, or Gemini</div>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(analysis.con_prompt, "con")}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 ${
                    conCopied
                      ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                      : "bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500/20 hover:shadow-[0_0_15px_rgba(217,70,239,0.2)]"
                  }`}
                >
                  {conCopied ? "✓ Copied!" : "Copy to Clipboard"}
                </button>
              </div>
              <div className="p-6 max-h-[32rem] overflow-y-auto scrollbar-thin prose prose-invert prose-base max-w-none prose-headings:text-fuchsia-300 prose-headings:font-black prose-strong:text-gray-200 prose-li:text-gray-300 prose-p:text-gray-300 prose-ul:list-disc prose-ol:list-decimal">
                <ReactMarkdown>{analysis.con_prompt}</ReactMarkdown>
              </div>
            </div>

            {/* Internal Research Teaser */}
            <div className="rounded-2xl bg-gradient-to-r from-amber-500/[0.06] to-orange-500/[0.04] border border-amber-500/20 p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-lg shrink-0">🔬</div>
              <div>
                <div className="text-sm font-bold text-amber-400">Internal AI Research — Coming Soon</div>
                <div className="text-xs text-gray-500 leading-relaxed">Paid members will be able to skip the manual step — our AI will automatically research both sides for you.</div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => setStep("input")}
                className="px-6 py-3 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep("upload")}
                className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] flex items-center gap-2"
              >
                I&apos;ve Done My Research
                <span className="text-white/60">→</span>
                Upload Results
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Upload & Start */}
        {step === "upload" && analysis && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-black text-white mb-3">Upload Research</h1>
              <p className="text-gray-400 leading-relaxed max-w-2xl">
                Upload or paste the Markdown research generated by your AI tool. Both Pro and Con research are required to start the debate.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pro Upload */}
              {proUploaded ? (
                <div className="rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/25 p-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-3xl mx-auto">✅</div>
                  <div className="text-sm font-black text-emerald-400 uppercase tracking-widest">Pro Research Uploaded</div>
                  <p className="text-xs text-gray-500">Ready for debate</p>
                </div>
              ) : (
                <div className="rounded-2xl bg-white/[0.02] border border-cyan-500/15 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-cyan-500/[0.04]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs font-black text-cyan-400">P</div>
                      <span className="text-sm font-black text-cyan-400">PRO Research</span>
                    </div>
                    <div className="flex rounded-lg overflow-hidden border border-white/10">
                      <button
                        onClick={() => setProInputMode("file")}
                        className={`px-3 py-1 text-[11px] font-bold transition-all ${proInputMode === "file" ? "bg-cyan-500/20 text-cyan-400" : "text-gray-500 hover:text-gray-300"}`}
                      >
                        File
                      </button>
                      <button
                        onClick={() => setProInputMode("paste")}
                        className={`px-3 py-1 text-[11px] font-bold transition-all ${proInputMode === "paste" ? "bg-cyan-500/20 text-cyan-400" : "text-gray-500 hover:text-gray-300"}`}
                      >
                        Paste
                      </button>
                    </div>
                  </div>

                  {proInputMode === "file" ? (
                    <div
                      onDragOver={handleDragOver("pro")}
                      onDragLeave={handleDragLeave("pro")}
                      onDrop={handleDrop("pro")}
                      className={`p-8 text-center space-y-4 transition-all cursor-pointer ${
                        proDragOver ? "bg-cyan-500/10 border-cyan-500/40" : "hover:bg-white/[0.02]"
                      }`}
                      onClick={() => proFileRef.current?.click()}
                    >
                      <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-3xl transition-all ${
                        proDragOver ? "bg-cyan-500/20 scale-110" : "bg-white/5"
                      }`}>
                        {proDragOver ? "📥" : "📄"}
                      </div>
                      <div>
                        <p className="text-sm text-gray-300 font-medium">
                          {proDragOver ? "Drop file here" : "Drag & drop your file here"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">or click to browse &middot; .md, .txt, .markdown</p>
                      </div>
                      <input
                        ref={proFileRef}
                        type="file"
                        accept=".md,.txt,.markdown"
                        aria-label="Upload Pro research file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload("pro", file);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      <textarea
                        value={proPasteText}
                        onChange={(e) => setProPasteText(e.target.value)}
                        placeholder="Paste your Pro research Markdown here..."
                        rows={8}
                        className="w-full bg-black/30 text-sm text-gray-300 border border-cyan-500/15 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 resize-none font-mono placeholder-gray-600"
                      />
                      <button
                        onClick={() => handlePasteUpload("pro")}
                        disabled={!proPasteText.trim() || uploading}
                        className="w-full px-4 py-2.5 rounded-xl text-sm font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {uploading ? "Uploading..." : "Upload Pasted Content"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Con Upload */}
              {conUploaded ? (
                <div className="rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/25 p-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-3xl mx-auto">✅</div>
                  <div className="text-sm font-black text-emerald-400 uppercase tracking-widest">Con Research Uploaded</div>
                  <p className="text-xs text-gray-500">Ready for debate</p>
                </div>
              ) : (
                <div className="rounded-2xl bg-white/[0.02] border border-fuchsia-500/15 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-fuchsia-500/[0.04]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-fuchsia-500/20 flex items-center justify-center text-xs font-black text-fuchsia-400">C</div>
                      <span className="text-sm font-black text-fuchsia-400">CON Research</span>
                    </div>
                    <div className="flex rounded-lg overflow-hidden border border-white/10">
                      <button
                        onClick={() => setConInputMode("file")}
                        className={`px-3 py-1 text-[11px] font-bold transition-all ${conInputMode === "file" ? "bg-fuchsia-500/20 text-fuchsia-400" : "text-gray-500 hover:text-gray-300"}`}
                      >
                        File
                      </button>
                      <button
                        onClick={() => setConInputMode("paste")}
                        className={`px-3 py-1 text-[11px] font-bold transition-all ${conInputMode === "paste" ? "bg-fuchsia-500/20 text-fuchsia-400" : "text-gray-500 hover:text-gray-300"}`}
                      >
                        Paste
                      </button>
                    </div>
                  </div>

                  {conInputMode === "file" ? (
                    <div
                      onDragOver={handleDragOver("con")}
                      onDragLeave={handleDragLeave("con")}
                      onDrop={handleDrop("con")}
                      className={`p-8 text-center space-y-4 transition-all cursor-pointer ${
                        conDragOver ? "bg-fuchsia-500/10 border-fuchsia-500/40" : "hover:bg-white/[0.02]"
                      }`}
                      onClick={() => conFileRef.current?.click()}
                    >
                      <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-3xl transition-all ${
                        conDragOver ? "bg-fuchsia-500/20 scale-110" : "bg-white/5"
                      }`}>
                        {conDragOver ? "📥" : "📄"}
                      </div>
                      <div>
                        <p className="text-sm text-gray-300 font-medium">
                          {conDragOver ? "Drop file here" : "Drag & drop your file here"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">or click to browse &middot; .md, .txt, .markdown</p>
                      </div>
                      <input
                        ref={conFileRef}
                        type="file"
                        accept=".md,.txt,.markdown"
                        aria-label="Upload Con research file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload("con", file);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      <textarea
                        value={conPasteText}
                        onChange={(e) => setConPasteText(e.target.value)}
                        placeholder="Paste your Con research Markdown here..."
                        rows={8}
                        className="w-full bg-black/30 text-sm text-gray-300 border border-fuchsia-500/15 rounded-xl px-4 py-3 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/20 resize-none font-mono placeholder-gray-600"
                      />
                      <button
                        onClick={() => handlePasteUpload("con")}
                        disabled={!conPasteText.trim() || uploading}
                        className="w-full px-4 py-2.5 rounded-xl text-sm font-bold bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {uploading ? "Uploading..." : "Upload Pasted Content"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => setStep("research")}
                className="px-6 py-3 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                ← Back to Prompts
              </button>
              <button
                onClick={handleStartDebate}
                disabled={!proUploaded || !conUploaded}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-bold text-lg transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Start Debate →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function NewDebatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    }>
      <NewDebatePageInner />
    </Suspense>
  );
}
