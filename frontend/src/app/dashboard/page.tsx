"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("user_email");
    if (!token) {
      router.push("/auth");
      return;
    }
    setIsLoggedIn(true);
    setUserEmail(email);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_email");
    router.push("/");
  };

  // Placeholder debate history — will be populated from API later
  const pastDebates = [
    { id: "healthcare", topic: "Should the US adopt universal healthcare?", date: "2025-03-12", proScore: 4.3, conScore: 3.8, yourVote: "pro" as const },
  ];

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 flex flex-col relative font-sans overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute top-[40%] -right-[15%] w-[60vw] h-[60vw] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_1s]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-3xl px-8 py-5 flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.5)] group-hover:shadow-[0_0_30px_rgba(56,189,248,0.7)] transition-shadow">
            <span className="text-white font-bold text-sm">🎯</span>
          </div>
          <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            DebateMeBro
          </span>
        </Link>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-xs font-black text-white uppercase">
              {userEmail?.[0] || "U"}
            </div>
            <span className="text-sm text-gray-400 hidden sm:inline">{userEmail}</span>
            <button onClick={handleLogout} className="text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors ml-2">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 px-6 py-12 max-w-5xl mx-auto w-full">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">My Debates</h1>
          <p className="text-gray-500">Your debate history and voting record</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Link href="/" className="group p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 hover:border-cyan-500/40 transition-all hover:-translate-y-1">
            <div className="text-2xl mb-3">💡</div>
            <div className="text-sm font-black text-white mb-1">New Debate</div>
            <div className="text-xs text-gray-500">Pick a topic and start</div>
          </Link>
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-2xl mb-3">📊</div>
            <div className="text-sm font-black text-white mb-1">{pastDebates.length}</div>
            <div className="text-xs text-gray-500">Debates Watched</div>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-2xl mb-3">🗳️</div>
            <div className="text-sm font-black text-white mb-1">{pastDebates.filter(d => d.yourVote).length}</div>
            <div className="text-xs text-gray-500">Votes Cast</div>
          </div>
        </div>

        {/* Debate History */}
        <div>
          <h2 className="text-lg font-black text-white mb-6 uppercase tracking-widest">Recent Debates</h2>
          {pastDebates.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4 opacity-30">🎯</div>
              <p className="text-gray-500 text-lg mb-6">No debates yet. Start your first one!</p>
              <Link href="/" className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                Start a Debate →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {pastDebates.map((debate) => (
                <Link
                  key={debate.id}
                  href={`/debates/${debate.id}?demo=true`}
                  className="block group p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors mb-2">
                        {debate.topic}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{debate.date}</span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          Pro: {debate.proScore}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-fuchsia-400" />
                          Con: {debate.conScore}
                        </span>
                        {debate.yourVote && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            debate.yourVote === "pro"
                              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                              : "bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30"
                          }`}>
                            Voted {debate.yourVote}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-600 group-hover:text-gray-400 transition-colors text-sm">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
