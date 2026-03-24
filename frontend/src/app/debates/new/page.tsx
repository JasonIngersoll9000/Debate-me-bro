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
    <div className="min-h-screen bg-surface text-on-surface font-sans relative overflow-hidden">

      {/* Header */}
      <header className="relative z-10 border-b border-outline-variant bg-black/40 backdrop-blur-3xl px-8 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-none bg-pro flex items-center justify-center">
            <span className="text-[#00195b] font-bold text-sm">🎯</span>
          </div>
          <span className="text-xl font-black tracking-tighter text-on-surface">
            DebateMeBro
          </span>
        </Link>
        <div className="text-sm text-on-surface-variant">Custom Topic</div>
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
                className={`w-10 h-10 rounded-none flex items-center justify-center text-sm font-black transition-all ${
                  step === s.id
                    ? "bg-pro text-[#00195b]"
                    : (["input", "research", "upload"].indexOf(step) > i)
                    ? "bg-surface-bright text-on-surface border border-outline-variant"
                    : "bg-surface-high text-on-surface-variant border border-outline-variant"
                }`}
              >
                {["input", "research", "upload"].indexOf(step) > i ? "✓" : s.num}
              </div>
              <span className={`text-sm font-medium ${step === s.id ? "text-on-surface" : "text-on-surface-variant"}`}>
                {s.label}
              </span>
              {i < 2 && <div className="w-12 h-px bg-outline-variant" />}
            </div>
          ))}
        </div>

        {/* Step 1: Enter resolution */}
        {step === "input" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-black text-on-surface mb-2">Create a Custom Debate</h1>
              <p className="text-on-surface-variant">Enter any resolution. Our AI will analyze it and generate research prompts for both sides.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">Debate Resolution</label>
                <input
                  type="text"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  placeholder="e.g. Should the US ban TikTok?"
                  className="w-full px-5 py-4 bg-surface-container border border-outline-variant rounded-none text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-pro text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">Additional Context (optional)</label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Any specific angle, framing, or context you want the debate to focus on..."
                  rows={3}
                  className="w-full px-5 py-4 bg-surface-container border border-outline-variant rounded-none text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-pro"
                />
              </div>

              {error && (
                <div className="p-4 rounded-none bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!resolution.trim() || loading}
                className="px-8 py-4 bg-pro text-[#00195b] rounded-none font-bold text-lg transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
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
              <h1 className="text-3xl font-black text-on-surface mb-3">Research Prompts</h1>
              <p className="text-on-surface-variant leading-relaxed max-w-2xl">
                We&apos;ve analyzed your topic. Follow the steps below to gather deep research for both sides, then upload the results to start your debate.
              </p>
            </div>

            {/* How-to Steps */}
            <div className="rounded-none bg-surface-container border border-outline-variant p-6">
              <div className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-4">How It Works</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { num: "1", icon: "📋", title: "Copy a prompt below", desc: "Each prompt is tailored to research one side of the debate" },
                  { num: "2", icon: "🤖", title: "Paste into an AI tool", desc: "Use Claude, ChatGPT, or any AI to generate deep research" },
                  { num: "3", icon: "📤", title: "Upload the results", desc: "Save as Markdown and upload in the next step" },
                ].map((s) => (
                  <div key={s.num} className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-none bg-pro/20 border border-pro/30 flex items-center justify-center text-sm font-black text-pro shrink-0">
                      {s.num}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-on-surface mb-0.5">{s.title}</div>
                      <div className="text-xs text-on-surface-variant leading-snug">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Position Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-none bg-surface-container border-l-4 border-pro p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-none bg-pro/20 flex items-center justify-center text-xs font-black text-pro">P</div>
                  <span className="text-xs font-black text-pro uppercase tracking-widest">Pro Position</span>
                </div>
                <textarea
                  aria-label="Pro position"
                  value={analysis.pro_position}
                  onChange={(e) => setAnalysis({ ...analysis, pro_position: e.target.value })}
                  rows={8}
                  className="w-full bg-black/20 text-lg text-on-surface border border-pro/15 rounded-none px-5 py-4 focus:outline-none focus:border-pro resize-vertical leading-relaxed"
                />
              </div>
              <div className="rounded-none bg-surface-container border-l-4 border-con p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-none bg-con/20 flex items-center justify-center text-xs font-black text-con">C</div>
                  <span className="text-xs font-black text-con uppercase tracking-widest">Con Position</span>
                </div>
                <textarea
                  aria-label="Con position"
                  value={analysis.con_position}
                  onChange={(e) => setAnalysis({ ...analysis, con_position: e.target.value })}
                  rows={8}
                  className="w-full bg-black/20 text-lg text-on-surface border border-con/15 rounded-none px-5 py-4 focus:outline-none focus:border-con resize-vertical leading-relaxed"
                />
              </div>
            </div>

            {/* Pro Prompt Card */}
            <div className="rounded-none bg-surface-container border-l-4 border-pro overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-pro/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-none bg-pro/15 flex items-center justify-center">
                    <span className="text-pro text-sm">📋</span>
                  </div>
                  <div>
                    <div className="text-sm font-black text-pro">PRO Research Prompt</div>
                    <div className="text-[11px] text-on-surface-variant">Copy and paste into ChatGPT, Claude, or Gemini</div>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(analysis.pro_prompt, "pro")}
                  className={`px-5 py-2.5 rounded-none text-sm font-bold transition-all shrink-0 ${
                    proCopied
                      ? "bg-pro/20 border border-pro/30 text-pro"
                      : "bg-pro/20 border border-pro/30 text-pro hover:bg-pro/30"
                  }`}
                >
                  {proCopied ? "✓ Copied!" : "Copy to Clipboard"}
                </button>
              </div>
              <div className="p-6 max-h-[32rem] overflow-y-auto scrollbar-thin prose prose-invert prose-base max-w-none prose-headings:text-pro prose-headings:font-black prose-strong:text-on-surface prose-li:text-on-surface-variant prose-p:text-on-surface-variant prose-ul:list-disc prose-ol:list-decimal">
                <ReactMarkdown>{analysis.pro_prompt}</ReactMarkdown>
              </div>
            </div>

            {/* Con Prompt Card */}
            <div className="rounded-none bg-surface-container border-l-4 border-con overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-con/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-none bg-con/15 flex items-center justify-center">
                    <span className="text-con text-sm">📋</span>
                  </div>
                  <div>
                    <div className="text-sm font-black text-con">CON Research Prompt</div>
                    <div className="text-[11px] text-on-surface-variant">Copy and paste into ChatGPT, Claude, or Gemini</div>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(analysis.con_prompt, "con")}
                  className={`px-5 py-2.5 rounded-none text-sm font-bold transition-all shrink-0 ${
                    conCopied
                      ? "bg-con/20 border border-con/30 text-con"
                      : "bg-con/20 border border-con/30 text-con hover:bg-con/30"
                  }`}
                >
                  {conCopied ? "✓ Copied!" : "Copy to Clipboard"}
                </button>
              </div>
              <div className="p-6 max-h-[32rem] overflow-y-auto scrollbar-thin prose prose-invert prose-base max-w-none prose-headings:text-con prose-headings:font-black prose-strong:text-on-surface prose-li:text-on-surface-variant prose-p:text-on-surface-variant prose-ul:list-disc prose-ol:list-decimal">
                <ReactMarkdown>{analysis.con_prompt}</ReactMarkdown>
              </div>
            </div>

            {/* Internal Research Teaser */}
            <div className="rounded-none bg-surface-container border border-outline-variant p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-none bg-amber-500/15 flex items-center justify-center text-lg shrink-0">🔬</div>
              <div>
                <div className="text-sm font-bold text-amber-400">Internal AI Research — Coming Soon</div>
                <div className="text-xs text-on-surface-variant leading-relaxed">Paid members will be able to skip the manual step — our AI will automatically research both sides for you.</div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => setStep("input")}
                className="px-6 py-3 rounded-none text-sm font-bold bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-all"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep("upload")}
                className="px-8 py-3.5 bg-pro text-[#00195b] rounded-none font-bold uppercase tracking-widest transition-all flex items-center gap-2"
              >
                I&apos;ve Done My Research
                <span className="opacity-60">→</span>
                Upload Results
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Upload & Start */}
        {step === "upload" && analysis && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-black text-on-surface mb-3">Upload Research</h1>
              <p className="text-on-surface-variant leading-relaxed max-w-2xl">
                Upload or paste the Markdown research generated by your AI tool. Both Pro and Con research are required to start the debate.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pro Upload */}
              {proUploaded ? (
                <div className="rounded-none bg-pro/[0.06] border border-pro/25 p-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-none bg-pro/15 flex items-center justify-center text-3xl mx-auto">✅</div>
                  <div className="text-sm font-black text-pro uppercase tracking-widest">Pro Research Uploaded</div>
                  <p className="text-xs text-on-surface-variant">Ready for debate</p>
                </div>
              ) : (
                <div className="rounded-none bg-surface-container border-l-4 border-pro overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant bg-pro/[0.04]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-none bg-pro/20 flex items-center justify-center text-xs font-black text-pro">P</div>
                      <span className="text-sm font-black text-pro">PRO Research</span>
                    </div>
                    <div className="flex rounded-none overflow-hidden border border-outline-variant">
                      <button
                        onClick={() => setProInputMode("file")}
                        className={`px-3 py-1 text-[11px] font-bold transition-all ${proInputMode === "file" ? "bg-pro/20 text-pro" : "text-on-surface-variant hover:text-on-surface"}`}
                      >
                        File
                      </button>
                      <button
                        onClick={() => setProInputMode("paste")}
                        className={`px-3 py-1 text-[11px] font-bold transition-all ${proInputMode === "paste" ? "bg-pro/20 text-pro" : "text-on-surface-variant hover:text-on-surface"}`}
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
                      className={`p-8 text-center space-y-4 transition-all cursor-pointer border-2 border-dashed ${
                        proDragOver ? "bg-pro/10 border-pro/40" : "border-outline-variant hover:bg-surface-high"
                      }`}
                      onClick={() => proFileRef.current?.click()}
                    >
                      <div className={`w-14 h-14 rounded-none mx-auto flex items-center justify-center text-3xl transition-all ${
                        proDragOver ? "bg-pro/20 scale-110" : "bg-surface-high"
                      }`}>
                        {proDragOver ? "📥" : "📄"}
                      </div>
                      <div>
                        <p className="text-sm text-on-surface font-medium">
                          {proDragOver ? "Drop file here" : "Drag & drop your file here"}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-1">or click to browse &middot; .md, .txt, .markdown</p>
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
                        className="w-full bg-black/30 text-sm text-on-surface border border-pro/15 rounded-none px-4 py-3 focus:outline-none focus:border-pro resize-none font-mono placeholder-on-surface-variant"
                      />
                      <button
                        onClick={() => handlePasteUpload("pro")}
                        disabled={!proPasteText.trim() || uploading}
                        className="w-full px-4 py-2.5 rounded-none text-sm font-bold bg-pro/20 border border-pro/30 text-pro hover:bg-pro/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {uploading ? "Uploading..." : "Upload Pasted Content"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Con Upload */}
              {conUploaded ? (
                <div className="rounded-none bg-pro/[0.06] border border-pro/25 p-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-none bg-pro/15 flex items-center justify-center text-3xl mx-auto">✅</div>
                  <div className="text-sm font-black text-pro uppercase tracking-widest">Con Research Uploaded</div>
                  <p className="text-xs text-on-surface-variant">Ready for debate</p>
                </div>
              ) : (
                <div className="rounded-none bg-surface-container border-l-4 border-con overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant bg-con/[0.04]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-none bg-con/20 flex items-center justify-center text-xs font-black text-con">C</div>
                      <span className="text-sm font-black text-con">CON Research</span>
                    </div>
                    <div className="flex rounded-none overflow-hidden border border-outline-variant">
                      <button
                        onClick={() => setConInputMode("file")}
                        className={`px-3 py-1 text-[11px] font-bold transition-all ${conInputMode === "file" ? "bg-con/20 text-con" : "text-on-surface-variant hover:text-on-surface"}`}
                      >
                        File
                      </button>
                      <button
                        onClick={() => setConInputMode("paste")}
                        className={`px-3 py-1 text-[11px] font-bold transition-all ${conInputMode === "paste" ? "bg-con/20 text-con" : "text-on-surface-variant hover:text-on-surface"}`}
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
                      className={`p-8 text-center space-y-4 transition-all cursor-pointer border-2 border-dashed ${
                        conDragOver ? "bg-con/10 border-con/40" : "border-outline-variant hover:bg-surface-high"
                      }`}
                      onClick={() => conFileRef.current?.click()}
                    >
                      <div className={`w-14 h-14 rounded-none mx-auto flex items-center justify-center text-3xl transition-all ${
                        conDragOver ? "bg-con/20 scale-110" : "bg-surface-high"
                      }`}>
                        {conDragOver ? "📥" : "📄"}
                      </div>
                      <div>
                        <p className="text-sm text-on-surface font-medium">
                          {conDragOver ? "Drop file here" : "Drag & drop your file here"}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-1">or click to browse &middot; .md, .txt, .markdown</p>
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
                        className="w-full bg-black/30 text-sm text-on-surface border border-con/15 rounded-none px-4 py-3 focus:outline-none focus:border-con resize-none font-mono placeholder-on-surface-variant"
                      />
                      <button
                        onClick={() => handlePasteUpload("con")}
                        disabled={!conPasteText.trim() || uploading}
                        className="w-full px-4 py-2.5 rounded-none text-sm font-bold bg-con/20 border border-con/30 text-con hover:bg-con/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {uploading ? "Uploading..." : "Upload Pasted Content"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 rounded-none bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => setStep("research")}
                className="px-6 py-3 rounded-none text-sm font-bold bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-all"
              >
                ← Back to Prompts
              </button>
              <button
                onClick={handleStartDebate}
                disabled={!proUploaded || !conUploaded}
                className="px-8 py-4 bg-pro text-[#00195b] rounded-none font-bold text-lg uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 rounded-none border-2 border-pro border-t-transparent animate-spin" />
      </div>
    }>
      <NewDebatePageInner />
    </Suspense>
  );
}
