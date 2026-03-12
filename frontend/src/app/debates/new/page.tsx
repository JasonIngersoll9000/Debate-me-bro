"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function NewDebatePage() {
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
  const proFileRef = useRef<HTMLInputElement>(null);
  const conFileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-black text-white mb-2">Research Prompts</h1>
              <p className="text-gray-500">
                Copy these prompts into <strong className="text-cyan-400">Claude</strong> or <strong className="text-cyan-400">ChatGPT</strong> to generate deep research for each side.
                Upload the results in the next step.
              </p>
            </div>

            {/* Positions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
                <div className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-2">PRO Position</div>
                <p className="text-sm text-gray-300">{analysis.pro_position}</p>
              </div>
              <div className="p-5 rounded-2xl bg-fuchsia-500/5 border border-fuchsia-500/20">
                <div className="text-xs font-black text-fuchsia-400 uppercase tracking-widest mb-2">CON Position</div>
                <p className="text-sm text-gray-300">{analysis.con_position}</p>
              </div>
            </div>

            {/* Pro Prompt */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-cyan-400">📋 PRO Research Prompt</h2>
                <button
                  onClick={() => copyToClipboard(analysis.pro_prompt, "pro")}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all"
                >
                  {proCopied ? "✓ Copied!" : "Copy to Clipboard"}
                </button>
              </div>
              <div className="p-5 rounded-2xl bg-black/40 border border-white/10 max-h-64 overflow-y-auto">
                <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
                  {analysis.pro_prompt}
                </pre>
              </div>
            </div>

            {/* Con Prompt */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-fuchsia-400">📋 CON Research Prompt</h2>
                <button
                  onClick={() => copyToClipboard(analysis.con_prompt, "con")}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500/20 transition-all"
                >
                  {conCopied ? "✓ Copied!" : "Copy to Clipboard"}
                </button>
              </div>
              <div className="p-5 rounded-2xl bg-black/40 border border-white/10 max-h-64 overflow-y-auto">
                <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
                  {analysis.con_prompt}
                </pre>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("input")}
                className="px-6 py-3 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep("upload")}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
              >
                I&apos;ve Done My Research → Upload Results
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Upload & Start */}
        {step === "upload" && analysis && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-black text-white mb-2">Upload Research</h1>
              <p className="text-gray-500">
                Upload the Markdown research files generated by Claude or ChatGPT. Both Pro and Con research are required.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pro Upload */}
              <div className={`p-6 rounded-2xl border-2 border-dashed transition-all ${
                proUploaded
                  ? "bg-emerald-500/5 border-emerald-500/30"
                  : "bg-cyan-500/5 border-cyan-500/20 hover:border-cyan-500/40"
              }`}>
                <div className="text-center space-y-4">
                  <div className="text-4xl">{proUploaded ? "✅" : "📄"}</div>
                  <div className="text-sm font-black text-cyan-400 uppercase tracking-widest">
                    {proUploaded ? "Pro Research Uploaded" : "PRO Research"}
                  </div>
                  {!proUploaded && (
                    <>
                      <p className="text-xs text-gray-500">Upload the Markdown file from your Pro research</p>
                      <input
                        ref={proFileRef}
                        type="file"
                        accept=".md,.txt,.markdown"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload("pro", file);
                        }}
                      />
                      <button
                        onClick={() => proFileRef.current?.click()}
                        disabled={uploading}
                        className="px-6 py-3 rounded-xl text-sm font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all disabled:opacity-50"
                      >
                        {uploading ? "Uploading..." : "Choose File"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Con Upload */}
              <div className={`p-6 rounded-2xl border-2 border-dashed transition-all ${
                conUploaded
                  ? "bg-emerald-500/5 border-emerald-500/30"
                  : "bg-fuchsia-500/5 border-fuchsia-500/20 hover:border-fuchsia-500/40"
              }`}>
                <div className="text-center space-y-4">
                  <div className="text-4xl">{conUploaded ? "✅" : "📄"}</div>
                  <div className="text-sm font-black text-fuchsia-400 uppercase tracking-widest">
                    {conUploaded ? "Con Research Uploaded" : "CON Research"}
                  </div>
                  {!conUploaded && (
                    <>
                      <p className="text-xs text-gray-500">Upload the Markdown file from your Con research</p>
                      <input
                        ref={conFileRef}
                        type="file"
                        accept=".md,.txt,.markdown"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload("con", file);
                        }}
                      />
                      <button
                        onClick={() => conFileRef.current?.click()}
                        disabled={uploading}
                        className="px-6 py-3 rounded-xl text-sm font-bold bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500/20 transition-all disabled:opacity-50"
                      >
                        {uploading ? "Uploading..." : "Choose File"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
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
                🎯 Start Debate →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
