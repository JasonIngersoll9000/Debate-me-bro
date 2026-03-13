import Link from "next/link";
import { DebateSummary } from "@/lib/api";

interface HistoryCardProps {
  debate: DebateSummary;
  /**
   * Temporarily optional until Issue #14 (Human Voting) is implemented.
   */
  yourVote?: "pro" | "con"; 
}

export default function HistoryCard({ debate, yourVote }: HistoryCardProps) {
  const formattedDate = new Date(debate.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const winner = debate.winner === "pro" ? "Pro" : debate.winner === "con" ? "Con" : null;
  const winnerColor = debate.winner === "pro"
    ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
    : "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30";

  return (
    <Link
      href={`/debates/${debate.id}`}
      className="block group p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
              {debate.topic}
            </h3>
            {winner && (
              <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${winnerColor}`}>
                {winner} wins
              </span>
            )}
          </div>
          {debate.resolution && (
            <p className="text-xs text-gray-500 mb-2 truncate">{debate.resolution}</p>
          )}
          <div className="flex items-center flex-wrap gap-4 text-xs text-gray-500">
            <span>{formattedDate}</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Pro: {debate.pro_score?.toFixed(1) || "0.0"}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-fuchsia-400" />
              Con: {debate.con_score?.toFixed(1) || "0.0"}
            </span>
            {debate.turn_count > 0 && <span>{debate.turn_count} turns</span>}
            {yourVote && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  yourVote === "pro"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30"
                }`}
              >
                Voted {yourVote}
              </span>
            )}
          </div>
        </div>
        <span className="text-gray-600 group-hover:text-gray-400 transition-colors text-sm">
          →
        </span>
      </div>
    </Link>
  );
}
