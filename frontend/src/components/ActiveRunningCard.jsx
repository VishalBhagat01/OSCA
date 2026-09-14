import { Loader2, Sparkles, MessageSquare, ArrowRight, Terminal } from "lucide-react";

export const ActiveRunningCard = ({ run }) => {
  if (!run || !["running", "queued", "publishing"].includes(run.status)) {
    return null;
  }

  const reviews = run.reviews || [];
  const retryReviews = reviews.filter((r) => r.action === "retry");
  const latestRetry =
    retryReviews.length > 0 ? retryReviews[retryReviews.length - 1] : null;

  const executionTrace = run.executionTrace || [];
  const latestEvent =
    executionTrace.length > 0 ? executionTrace[executionTrace.length - 1] : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-zinc-900/90 to-violet-950/40 p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
      <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-violet-300 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {latestRetry
                  ? "Agent Iterating with Human Feedback"
                  : "Autonomous Execution in Progress"}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 animate-pulse">
                {run.status === "queued"
                  ? "Queued"
                  : run.status === "publishing"
                  ? "Publishing PR..."
                  : "Processing..."}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-400">
              {run.status === "publishing"
                ? "Synthesizing release metadata and creating draft pull request on GitHub."
                : "The agent is actively reasoning across files, generating patches, and verifying tests."}
            </p>
          </div>
        </div>
      </div>

      {/* Active Retry Feedback Prompt */}
      {latestRetry && (
        <div className="mt-4 rounded-xl border border-indigo-500/30 bg-black/60 p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-400">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Active Iteration Feedback:</span>
          </div>
          <p className="text-xs text-zinc-200 italic font-mono bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-900/30">
            "{latestRetry.feedback}"
          </p>
        </div>
      )}

      {/* Latest Node & Log Event */}
      {latestEvent && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-zinc-800 bg-black/50 px-3.5 py-2.5 text-xs text-zinc-300">
          <Terminal className="h-4 w-4 text-indigo-400 shrink-0" />
          <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
            Node:
          </span>
          <span className="font-mono text-indigo-300 font-medium shrink-0">
            {latestEvent.node || "Agent"}
          </span>
          <ArrowRight className="h-3 w-3 text-zinc-600 shrink-0" />
          <span className="truncate text-zinc-300">{latestEvent.message}</span>
        </div>
      )}
    </div>
  );
};

export default ActiveRunningCard;
