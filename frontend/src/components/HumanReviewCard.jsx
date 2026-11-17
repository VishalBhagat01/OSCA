import { useState } from "react";
import { UserCheck, MessageSquare, ThumbsUp, ThumbsDown, RotateCw, Send, AlertCircle } from "lucide-react";
import Button from "./ui/Button";
import ConfirmDialog from "./ui/ConfirmDialog";

const HumanReviewCard = ({ run, onApprove, onReject, onRetry, loading = false }) => {
  const [feedback, setFeedback] = useState("");
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  if (!run || run.status !== "awaiting_approval") return null;

  const handleRetry = () => {
    if (!feedback.trim()) return;
    onRetry(feedback.trim());
    setFeedback("");
  };

  const handleApprove = () => {
    onApprove(reviewNotes.trim());
    setShowApproveConfirm(false);
    setReviewNotes("");
  };

  return (
    <>
      <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-orange-500/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/15">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#E8E8E3]">
              Human Review Required
            </h3>
            <p className="text-[11px] text-[#737370]">
              Review the proposed patch and take action
            </p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Feedback for retry */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#A8A8A0] flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-orange-500" />
              Feedback for retry (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g. Handle edge case for empty input..."
                className="flex-1 rounded-xl border border-white/8 bg-[#0A0A0A] px-3 py-2 text-sm text-[#E8E8E3] placeholder-[#525250] outline-none focus:border-orange-500/40 transition"
                disabled={loading}
              />
              <Button
                variant="secondary"
                size="sm"
                icon={Send}
                onClick={handleRetry}
                disabled={loading || !feedback.trim()}
              >
                Retry
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-3 border-t border-white/6">
            <Button
              variant="primary"
              size="sm"
              icon={ThumbsUp}
              onClick={() => setShowApproveConfirm(true)}
              loading={loading}
            >
              Approve & Draft PR
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={ThumbsDown}
              onClick={onReject}
              loading={loading}
            >
              Reject
            </Button>
          </div>
        </div>
      </div>

      {/* Approve Confirmation */}
      <ConfirmDialog
        isOpen={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={handleApprove}
        title="Approve & Create Draft PR?"
        description="This will apply the patch, push it to a new branch, and open a draft Pull Request on GitHub."
        confirmText="Yes, Create Draft PR"
        variant="primary"
        loading={loading}
      />
    </>
  );
};

export default HumanReviewCard;