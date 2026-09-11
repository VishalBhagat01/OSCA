import { Loader2, Sparkles, MessageSquare, Clock, ArrowRight } from "lucide-react";

const ActiveRunningCard = ({ run }) => {
    if (!run || !["running", "queued", "publishing"].includes(run.status)) return null;

    const reviews = run.reviews || [];
    const retryReviews = reviews.filter((r) => r.action === "retry");
    const latestRetry = retryReviews.length > 0 ? retryReviews[retryReviews.length - 1] : null;

    const executionTrace = run.executionTrace || [];
    const latestEvent = executionTrace.length > 0 ? executionTrace[executionTrace.length - 1] : null;

    return (
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/40 bg-gradient-to-r from-violet-950/30 via-zinc-900/90 to-indigo-950/30 p-6 shadow-xl backdrop-blur">
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
            
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
                        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
                        <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-violet-300 animate-pulse" />
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-white">
                                {latestRetry ? "Agent Retrying with Human Feedback" : "Agent Execution in Progress"}
                            </h2>
                            <span className="inline-flex items-center rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-semibold text-violet-300 border border-violet-500/30 animate-pulse">
                                {run.status === "queued" ? "Queued" : run.status === "publishing" ? "Creating pull request..." : "Running..."}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-400">
                            The Sentra AI agent is actively processing codebase and generating solution.
                        </p>
                    </div>
                </div>
            </div>

            {latestRetry && (
                <div className="mt-5 rounded-xl border border-violet-500/30 bg-black/60 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-400">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Active Feedback Prompt
                    </div>
                    <p className="mt-2 text-sm italic text-zinc-200 bg-violet-950/20 p-3 rounded-lg border border-violet-800/30">
                        "{latestRetry.feedback}"
                    </p>
                </div>
            )}

            {latestEvent && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-zinc-800 bg-black/40 px-4 py-3 text-xs text-zinc-300">
                    <Clock className="h-4 w-4 text-violet-400 shrink-0" />
                    <span className="font-semibold text-zinc-400 uppercase tracking-wider">Current Node:</span>
                    <span className="font-medium text-violet-300">{latestEvent.node || "Agent"}</span>
                    <ArrowRight className="h-3 w-3 text-zinc-600 shrink-0" />
                    <span className="truncate text-zinc-300">{latestEvent.message}</span>
                </div>
            )}
        </div>
    );
};

export default ActiveRunningCard;
