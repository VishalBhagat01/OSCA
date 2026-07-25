import { useState } from "react";
import { CheckCircle2, RotateCcw, XCircle, MessageSquare, Loader2, Sparkles, AlertCircle } from "lucide-react";

const PROMPT_PRESETS = [
    "Raise ValueError instead of returning None",
    "Add regression test cases for edge values",
    "Preserve existing method signature and structure",
    "Fix error handling and return clean error messages"
];

const HumanReviewCard = ({
    run,
    onApprove,
    onReject,
    onRetry,
    loading = false,
}) => {
    const [feedback, setFeedback] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    if (run.status !== "awaiting_approval") return null;

    const handleRetry = () => {
        if (!feedback.trim()) {
            setErrorMsg("Please provide feedback instructions before retrying.");
            return;
        }
        setErrorMsg("");
        onRetry(feedback);
    };

    const handleAddPreset = (preset) => {
        setFeedback((prev) => (prev ? `${prev}\n• ${preset}` : `• ${preset}`));
        setErrorMsg("");
    };

    return (
        <div className="rounded-2xl border border-violet-500/30 bg-zinc-900/80 p-6 shadow-xl backdrop-blur transition-all">
            <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-500/20 p-2.5 text-violet-400">
                    <MessageSquare className="h-6 w-6" />
                </div>

                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-white">
                            Human Review Required
                        </h2>
                        <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-semibold text-violet-300 border border-violet-500/30">
                            Awaiting Input
                        </span>
                    </div>

                    <p className="text-sm text-zinc-400">
                        Review the proposed patch or provide feedback instructions to retry the agent.
                    </p>
                </div>
            </div>

            <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                        <span>Human Feedback & Retry Instructions</span>
                        <span className="text-xs font-normal text-violet-400">(Required for Retry)</span>
                    </label>
                </div>

                <textarea
                    rows={4}
                    value={feedback}
                    disabled={loading}
                    onChange={(e) => {
                        setFeedback(e.target.value);
                        if (e.target.value.trim()) setErrorMsg("");
                    }}
                    placeholder="Provide specific feedback or prompt instructions for the agent..."
                    className="w-full rounded-xl border border-zinc-700 bg-black/80 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                />

                {/* Preset Chips */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-violet-400" />
                        Quick Prompts:
                    </span>
                    {PROMPT_PRESETS.map((preset, idx) => (
                        <button
                            key={idx}
                            type="button"
                            disabled={loading}
                            onClick={() => handleAddPreset(preset)}
                            className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-violet-500/50 hover:bg-violet-950/30 hover:text-violet-200 disabled:opacity-50"
                        >
                            + {preset}
                        </button>
                    ))}
                </div>

                {errorMsg && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
                <button
                    onClick={handleRetry}
                    disabled={loading || !feedback.trim()}
                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Retrying with Prompt...
                        </>
                    ) : (
                        <>
                            <RotateCcw className="h-4 w-4" />
                            Retry with Feedback
                        </>
                    )}
                </button>

                <button
                    onClick={onApprove}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500 disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <CheckCircle2 className="h-4 w-4" />
                    )}
                    Approve Patch
                </button>

                <button
                    onClick={onReject}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl border border-red-700/60 bg-red-950/30 px-5 py-2.5 font-semibold text-red-400 transition hover:bg-red-900/40 disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <XCircle className="h-4 w-4" />
                    )}
                    Reject
                </button>
            </div>
        </div>
    );
};

export default HumanReviewCard;