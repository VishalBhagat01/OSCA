import { History, RotateCcw, CheckCircle2, XCircle } from "lucide-react";

const formatTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const ReviewHistoryCard = ({ reviews = [] }) => {
  if (!reviews || reviews.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-6 shadow-xl backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700/50">
          <History className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Human Review Iteration History
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Record of feedback iterations and decisions submitted to the agent
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {reviews.map((rev, index) => {
          const isRetry = rev.action === "retry";
          const isApprove = rev.action === "approved";

          return (
            <div
              key={index}
              className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5 transition hover:border-zinc-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isRetry ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
                      <RotateCcw className="h-3 w-3" />
                      Iteration #{index + 1}
                    </span>
                  ) : isApprove ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-300">
                      <XCircle className="h-3 w-3" />
                      Rejected
                    </span>
                  )}
                </div>

                <span className="font-mono text-xs text-zinc-500">
                  {formatTime(rev.timestamp)}
                </span>
              </div>

              {rev.feedback && (
                <p className="mt-2.5 text-xs text-zinc-300 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800 leading-relaxed font-sans">
                  "{rev.feedback}"
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReviewHistoryCard;
