import { History, RotateCcw, CheckCircle2, XCircle } from "lucide-react";

const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const ReviewHistoryCard = ({ reviews = [] }) => {
    if (!reviews || reviews.length === 0) return null;

    return (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-lg backdrop-blur">
            <div className="flex items-center gap-3">
                <div className="rounded-lg bg-zinc-800 p-2 text-zinc-300">
                    <History className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-white">
                        Review & Feedback History
                    </h2>
                    <p className="text-sm text-zinc-400">
                        Past human review iterations and instructions provided to the agent.
                    </p>
                </div>
            </div>

            <div className="mt-5 space-y-4">
                {reviews.map((rev, index) => {
                    const isRetry = rev.action === "retry";
                    const isApprove = rev.action === "approved";

                    return (
                        <div
                            key={index}
                            className="rounded-xl border border-zinc-800 bg-black/60 p-4 transition hover:border-zinc-700"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {isRetry ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
                                            <RotateCcw className="h-3 w-3" />
                                            Retry # {index + 1}
                                        </span>
                                    ) : isApprove ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Approved
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
                                            <XCircle className="h-3 w-3" />
                                            Rejected
                                        </span>
                                    )}

                                    <span className="text-xs text-zinc-500">
                                        Iteration {index + 1}
                                    </span>
                                </div>

                                <span className="text-xs text-zinc-500 font-mono">
                                    {formatDate(rev.timestamp)}
                                </span>
                            </div>

                            {rev.feedback && (
                                <p className="mt-3 text-sm text-zinc-200 bg-zinc-950/60 p-3 rounded-lg border border-zinc-800 font-sans">
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
