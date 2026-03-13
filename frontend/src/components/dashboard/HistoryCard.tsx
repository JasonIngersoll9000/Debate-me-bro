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
  // Format the date to be more readable (e.g., "March 12, 2025")
  const formattedDate = new Date(debate.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link
      href={`/debates/${debate.id}?demo=${debate.status !== "completed" ? "true" : "false"}`}
      className="block group p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors mb-2">
            {debate.topic}
          </h3>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{formattedDate}</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Pro: {debate.pro_score?.toFixed(1) || "0.0"}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-fuchsia-400" />
              Con: {debate.con_score?.toFixed(1) || "0.0"}
            </span>
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
