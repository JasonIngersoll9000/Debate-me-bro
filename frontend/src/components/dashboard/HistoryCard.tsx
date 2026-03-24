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
    ? "bg-pro/10 text-pro border-pro/30"
    : "bg-con/10 text-con border-con/30";

  return (
    <Link
      href={`/debates/${debate.id}`}
      className="block group p-6 rounded-none bg-surface-container border border-outline-variant hover:bg-surface-high hover:border-outline transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            <h3 className="text-base font-bold text-on-surface group-hover:text-pro transition-colors truncate">
              {debate.topic}
            </h3>
            {winner && (
              <span className={`shrink-0 px-2.5 py-0.5 rounded-none text-[10px] font-black uppercase border ${winnerColor}`}>
                {winner} wins
              </span>
            )}
          </div>
          {debate.resolution && (
            <p className="text-xs text-on-surface-variant mb-2 truncate">{debate.resolution}</p>
          )}
          <div className="flex items-center flex-wrap gap-4 text-xs text-on-surface-variant">
            <span>{formattedDate}</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-none bg-pro" />
              Pro: {debate.pro_score?.toFixed(1) || "0.0"}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-none bg-con" />
              Con: {debate.con_score?.toFixed(1) || "0.0"}
            </span>
            {debate.turn_count > 0 && <span>{debate.turn_count} turns</span>}
            {yourVote && (
              <span
                className={`px-2 py-0.5 rounded-none text-[10px] font-bold uppercase ${
                  yourVote === "pro"
                    ? "bg-pro/10 text-pro border border-pro/30"
                    : "bg-con/10 text-con border border-con/30"
                }`}
              >
                Voted {yourVote}
              </span>
            )}
          </div>
        </div>
        <span className="text-on-surface-variant group-hover:text-on-surface transition-colors text-sm">
          →
        </span>
      </div>
    </Link>
  );
}
