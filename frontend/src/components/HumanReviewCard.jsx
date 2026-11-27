import { useState } from "react";
import { Check, X, Send } from "lucide-react";
import Button from "./ui/Button";
import ConfirmDialog from "./ui/ConfirmDialog";
import Panel from "./ui/Panel";

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
      <Panel
        tone="ember"
        eyebrow="Your decision"
        title="Review the proposed patch"
        meta="Nothing is pushed to GitHub until you approve."
        bodyClassName="p-6 space-y-6"
      >
        <label className="block">
          <span className="eyebrow">Feedback for another pass (optional)</span>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRetry()}
              placeholder="Handle the empty-input case too"
              className="field-box flex-1"
              disabled={loading}
            />
            <Button variant="secondary" size="md" icon={Send} onClick={handleRetry} disabled={loading || !feedback.trim()}>
              Retry
            </Button>
          </div>
        </label>

        <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-6">
          <Button icon={Check} onClick={() => setShowApproveConfirm(true)} loading={loading}>
            Approve and draft PR
          </Button>
          <Button variant="outline" icon={X} onClick={onReject} loading={loading}>
            Reject
          </Button>
        </div>
      </Panel>

      <ConfirmDialog
        isOpen={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={handleApprove}
        title="Approve and open a draft PR?"
        description="The patch is applied, pushed to a new branch, and opened as a draft pull request on GitHub."
        confirmText="Create draft PR"
        variant="primary"
        loading={loading}
      />
    </>
  );
};

export default HumanReviewCard;
