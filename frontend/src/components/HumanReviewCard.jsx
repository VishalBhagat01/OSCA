import { useState } from "react";
import {
  CheckCircle2,
  RotateCcw,
  XCircle,
  MessageSquare,
  Sparkles,
  AlertCircle,
  GitPullRequest,
  ShieldAlert,
} from "lucide-react";
import Button from "./ui/Button";
import ConfirmDialog from "./ui/ConfirmDialog";

const PROMPT_PRESETS = [
  "Raise ValueError instead of returning None",
  "Add regression test cases for edge values",
  "Preserve existing method signature and structure",
  "Fix error handling and return clean error messages",
];

export const HumanReviewCard = ({
  run,
  onApprove,
  onReject,
  onRetry,
  loading = false,
}) => {
  const [feedback, setFeedback] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Confirmation modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  if (run?.status !== "awaiting_approval") return null;

  const handleRetry = () => {
    if (!feedback.trim()) {
      setErrorMsg("Please provide feedback instructions before retrying.");
      return;
    }
    setErrorMsg("");
    onRetry(feedback.trim());
  };

  const handleAddPreset = (preset) => {
    setFeedback((prev) => (prev ? `${prev}\n• ${preset}` : `• ${preset}`));
    setErrorMsg("");
  };

  const handleConfirmApprove = () => {
    setShowApproveModal(false);
    // Pass feedback or reviewNotes
    const finalNotes = (reviewNotes || feedback || "").trim();
    onApprove(finalNotes);
  };

  const handleConfirmReject = () => {
    setShowRejectModal(false);
    onReject();
  };

  return (
    <>
      <div className="rounded-2xl border border-violet-500/40 bg-zinc-900/90 p-5 sm:p-7 shadow-2xl backdrop-blur-xl transition-all">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30">
              <MessageSquare className="h-5 w-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Human Review Required
                </h2>
                <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-violet-300 border border-violet-500/30 animate-pulse">
                  Awaiting Input
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Review the proposed patch below. Approve to draft a PR, reject, or provide feedback instructions to iterate.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Feedback & Agent Instructions</span>
              <span className="text-[11px] font-normal text-violet-400">
                (Required for Retry)
              </span>
            </label>
          </div>

          <textarea
            rows={3}
            value={feedback}
            disabled={loading}
            onChange={(e) => {
              setFeedback(e.target.value);
              if (e.target.value.trim()) setErrorMsg("");
            }}
            placeholder="Instruct the agent on what to change, fix, or add in the next iteration..."
            className="w-full rounded-xl border border-zinc-700/80 bg-zinc-950/80 px-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 disabled:opacity-50"
          />

          {/* Quick Prompt Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-violet-400" />
              Quick Suggestions:
            </span>
            {PROMPT_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                disabled={loading}
                onClick={() => handleAddPreset(preset)}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-[11px] text-zinc-400 transition hover:border-violet-500/40 hover:bg-violet-950/20 hover:text-violet-200 disabled:opacity-50"
              >
                + {preset}
              </button>
            ))}
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 flex flex-wrap items-center gap-3">
          {/* Retry with Feedback */}
          <Button
            variant="primary"
            size="md"
            icon={RotateCcw}
            loading={loading}
            onClick={handleRetry}
            disabled={loading || !feedback.trim()}
            className="bg-violet-600 hover:bg-violet-500 border-violet-500/30 shadow-violet-950/40"
          >
            Retry with Feedback
          </Button>

          {/* Approve Button - opens confirmation */}
          <Button
            variant="success"
            size="md"
            icon={CheckCircle2}
            loading={loading}
            disabled={loading}
            onClick={() => {
              setReviewNotes(feedback);
              setShowApproveModal(true);
            }}
          >
            Approve & Draft PR...
          </Button>

          {/* Reject Button - opens confirmation */}
          <Button
            variant="danger"
            size="md"
            icon={XCircle}
            loading={loading}
            disabled={loading}
            onClick={() => setShowRejectModal(true)}
          >
            Reject Run...
          </Button>
        </div>
      </div>

      {/* Confirmation Safeguard for Approve & Draft PR */}
      <ConfirmDialog
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={handleConfirmApprove}
        title="Confirm Solution Approval"
        description="Are you sure you want to approve this patch? Sentra AI will generate PR metadata and create a Draft Pull Request on GitHub for repository review."
        confirmText="Yes, Approve & Create PR"
        variant="success"
        loading={loading}
      >
        <div className="space-y-3 pt-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-zinc-300 font-semibold">
              <GitPullRequest className="h-4 w-4 text-emerald-400" />
              <span>Target: GitHub Draft PR</span>
            </div>
            <p className="text-zinc-400">
              Target Branch: <span className="font-mono text-zinc-300">sentra/fix-issue-{run.issue?.number}</span>
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300">
              Reviewer Notes (Optional)
            </label>
            <input
              type="text"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add optional notes for the PR description..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </ConfirmDialog>

      {/* Confirmation Safeguard for Reject */}
      <ConfirmDialog
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleConfirmReject}
        title="Reject Proposed Solution?"
        description="This will permanently mark the run as rejected and prevent automated PR creation. You will still be able to review this run in your history."
        confirmText="Yes, Reject Run"
        variant="danger"
        loading={loading}
      >
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
          <span>This action cannot be undone. To continue work, you will need to trigger a new run.</span>
        </div>
      </ConfirmDialog>
    </>
  );
};

export default HumanReviewCard;