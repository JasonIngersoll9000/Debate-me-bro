"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchDebates, likeDebate, DebateSummary } from "@/lib/api";

type SortKey = "recent" | "liked";

export default function BrowsePage() {
  const [debates, setDebates] = useState<DebateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  const loadDebates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDebates();
      setDebates(data);
    } catch {
      setError("Failed to load debates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    loadDebates();
  }, [loadDebates]);

  const handleLike = async (debateId: string) => {
    if (!isLoggedIn) {
      router.push("/auth?redirect=/browse");
      return;
    }
    try {
      const result = await likeDebate(debateId);
      setDebates((prev) =>
        prev.map((d) =>
          d.id === debateId
            ? { ...d, like_count: result.like_count, user_liked: result.liked }
            : d
        )
      );
    } catch {
      // Silently fail — user sees no change
    }
  };

  const sorted = [...debates].sort((a, b) => {
    if (sortBy === "liked") return (b.like_count ?? 0) - (a.like_count ?? 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative font-sans overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] bg-purple-600/10 blur-[120px] rounded-none mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute top-[40%] -right-[15%] w-[60vw] h-[60vw] bg-blue-600/10 blur-[120px] rounded-none mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_1s]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-outline-variant bg-black/40 backdrop-blur-3xl px-8 py-5 flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-none bg-pro flex items-center justify-center">
            <span className="text-[#00195b] font-bold text-sm">🎯</span>
          </div>
          <span className="text-xl font-black tracking-tighter text-on-surface">
            DebateMeBro
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {isLoggedIn && (
            <Link href="/dashboard" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors font-medium">
              Dashboard
            </Link>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 px-6 py-12 max-w-5xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-on-surface mb-2 tracking-tight">Browse Debates</h1>
            <p className="text-on-surface-variant text-sm">All public AI debates — watch, learn, and like the best ones.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5 bg-surface-container rounded-none p-1 border border-outline-variant">
              <button
                onClick={() => setSortBy("recent")}
                className={`rounded-none border border-outline-variant uppercase tracking-widest text-xs px-4 py-2 font-bold transition-all ${
                  sortBy === "recent"
                    ? "bg-surface-bright border-outline text-on-surface"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setSortBy("liked")}
                className={`rounded-none border border-outline-variant uppercase tracking-widest text-xs px-4 py-2 font-bold transition-all ${
                  sortBy === "liked"
                    ? "bg-surface-bright border-outline text-on-surface"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Most Liked
              </button>
            </div>
            <Link
              href="/"
              className="bg-pro text-[#00195b] rounded-none uppercase tracking-widest px-6 py-3 text-xs font-black transition-all"
            >
              + New Debate
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-surface-container border border-outline-variant rounded-none p-6 h-36" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-con/10 border border-con/30 rounded-none">
            <p className="text-con mb-4">{error}</p>
            <button onClick={loadDebates} className="px-6 py-2 bg-con/20 text-con rounded-none hover:bg-con/30 transition-colors">
              Retry
            </button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-30">🌐</div>
            <p className="text-on-surface-variant text-lg mb-6">No debates yet. Be the first!</p>
            <Link href="/" className="inline-block bg-pro text-[#00195b] rounded-none uppercase tracking-widest px-6 py-3 font-bold transition-all">
              Start a Debate →
            </Link>
          </div>
        ) : (
          <div>
          <div className="space-y-4">
            {sorted.map((debate) => {
              const winner = debate.winner === "pro" ? "Pro" : debate.winner === "con" ? "Con" : null;
              const winnerColor = debate.winner === "pro"
                ? "bg-pro/10 border-pro/30 text-pro"
                : "bg-con/10 border-con/30 text-con";
              const date = new Date(debate.created_at).toLocaleDateString(undefined, {
                year: "numeric", month: "short", day: "numeric",
              });

              return (
                <div
                  key={debate.id}
                  className="group rounded-none bg-surface-container border border-outline-variant hover:bg-surface-high transition-colors duration-200"
                >
                  <div className="flex items-start gap-5 p-6">
                    <Link href={`/debates/${debate.id}`} className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-black text-on-surface group-hover:text-pro transition-colors truncate tracking-tight">
                          {debate.topic}
                        </h3>
                        {winner && (
                          <span className={`shrink-0 px-2.5 py-0.5 rounded-none text-[10px] font-black uppercase border ${winnerColor}`}>
                            {winner} wins
                          </span>
                        )}
                      </div>
                      {debate.resolution && (
                        <p className="text-sm text-on-surface-variant mb-3 line-clamp-2 leading-relaxed">{debate.resolution}</p>
                      )}
                      <div className="flex items-center flex-wrap gap-4 text-xs text-on-surface-variant">
                        <span className="font-medium">{date}</span>
                        <span className="w-px h-3 bg-outline-variant" />
                        <span className="flex items-center gap-1.5 font-mono">
                          <span className="w-2 h-2 rounded-none bg-pro" />
                          <span className="text-pro">{debate.pro_score?.toFixed(1) || "0.0"}</span>
                        </span>
                        <span className="text-on-surface-variant">vs</span>
                        <span className="flex items-center gap-1.5 font-mono">
                          <span className="w-2 h-2 rounded-none bg-con" />
                          <span className="text-con">{debate.con_score?.toFixed(1) || "0.0"}</span>
                        </span>
                        {debate.turn_count > 0 && (
                          <>
                            <span className="w-px h-3 bg-outline-variant" />
                            <span>{debate.turn_count} turns</span>
                          </>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={(e) => { e.preventDefault(); handleLike(debate.id); }}
                      className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-none transition-all duration-200 ${
                        debate.user_liked
                          ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                          : "bg-surface-high text-on-surface-variant border border-outline-variant hover:bg-pink-500/10 hover:text-pink-400 hover:border-pink-500/20"
                      }`}
                      aria-label={debate.user_liked ? "Unlike debate" : "Like debate"}
                    >
                      <span className="text-lg">{debate.user_liked ? "❤️" : "🤍"}</span>
                      <span className="text-[10px] font-bold">{debate.like_count ?? 0}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Debate Count Footer */}
          {sorted.length > 0 && (
            <div className="mt-8 text-center text-xs text-on-surface-variant font-medium">
              {sorted.length} debate{sorted.length !== 1 ? "s" : ""} total
            </div>
          )}
          </div>
        )}
      </main>
    </div>
  );
}
