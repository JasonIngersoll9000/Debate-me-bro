"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchDebates, DebateSummary } from "@/lib/api";
import HistoryCard from "@/components/dashboard/HistoryCard";

export default function DashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [debates, setDebates] = useState<DebateSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const loadDebates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDebates();
      setDebates(data);
    } catch {
      setError("Failed to load debate history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("user_email");
    if (!token) {
      router.push("/auth");
      return;
    }
    setIsLoggedIn(true);
    setUserEmail(email);

    loadDebates();
  }, [router, loadDebates]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_email");
    router.push("/");
  };

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative font-sans overflow-hidden">

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
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-con flex items-center justify-center text-xs font-black text-[#4a0004] uppercase">
              {userEmail?.[0] || "U"}
            </div>
            <span className="text-sm text-on-surface-variant hidden sm:inline">{userEmail}</span>
            <button onClick={handleLogout} className="text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors ml-2">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 px-6 py-12 max-w-5xl mx-auto w-full">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-on-surface mb-2">My Debates</h1>
          <p className="text-on-surface-variant">Your debate history and voting record</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Link href="/" className="group p-6 rounded-none bg-surface-container border-l-2 border-pro border border-outline-variant hover:bg-surface-high transition-all">
            <div className="text-2xl mb-3">💡</div>
            <div className="text-sm font-black text-on-surface mb-1">New Debate</div>
            <div className="text-xs text-on-surface-variant">Pick a topic and start</div>
          </Link>
          <Link href="/browse" className="group p-6 rounded-none bg-surface-container border-l-2 border-con border border-outline-variant hover:bg-surface-high transition-all">
            <div className="text-2xl mb-3">🌐</div>
            <div className="text-sm font-black text-on-surface mb-1">Browse All</div>
            <div className="text-xs text-on-surface-variant">Explore public debates</div>
          </Link>
          <div className="p-6 rounded-none bg-surface-container border border-outline-variant">
            <div className="text-2xl mb-3">📊</div>
            <div className="text-sm font-black text-on-surface mb-1">{isLoading ? "..." : debates.length}</div>
            <div className="text-xs text-on-surface-variant">Debates Watched</div>
          </div>
          <div className="p-6 rounded-none bg-surface-container border border-outline-variant">
            <div className="text-2xl mb-3">🗳️</div>
            <div className="text-sm font-black text-on-surface mb-1">Coming Soon</div>
            <div className="text-xs text-on-surface-variant">Votes Cast</div>
          </div>
        </div>

        {/* Debate History */}
        <div>
          <h2 className="text-lg font-black text-on-surface mb-6 uppercase tracking-widest">Recent Debates</h2>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-surface-container border border-outline-variant rounded-none p-6 h-32" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-con/10 border border-con/30 rounded-none">
              <p className="text-con mb-4">{error}</p>
              <button
                onClick={loadDebates}
                className="px-6 py-2 bg-con/20 text-con rounded-none hover:bg-con/30 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : debates.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4 opacity-30">🎯</div>
              <p className="text-on-surface-variant text-lg mb-6">No debates yet. Start your first one!</p>
              <Link href="/" className="inline-block bg-pro text-[#00195b] rounded-none uppercase tracking-widest px-6 py-3 font-bold transition-all">
                Start a Debate →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {debates.map((debate) => (
                <HistoryCard key={debate.id} debate={debate} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
