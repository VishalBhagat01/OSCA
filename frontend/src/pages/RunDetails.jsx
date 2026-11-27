import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ChevronLeft, Copy, Check, RotateCw, Trash2, ExternalLink } from "lucide-react";

import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { Skeleton, RunCardSkeleton } from "../components/ui/Skeleton";

import RunCard from "../components/RunCard";
import PlannerCard from "../components/PlannerCard";
import PatchCard from "../components/PatchCard";
import Timeline from "../components/Timeline";
import HumanReviewCard from "../components/HumanReviewCard";
import ActiveRunningCard from "../components/ActiveRunningCard";
import ReviewHistoryCard from "../components/ReviewHistoryCard";
import TestResultsCard from "../components/TestResultsCard";
import PRMetadataCard from "../components/PRMetadataCard";

import useRun from "../hooks/useRun";
import socket from "../socket";
import runService from "../services/runService";

const Shell = ({ children, narrow = false }) => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <main className={`mx-auto w-full flex-1 px-5 sm:px-8 ${narrow ? "max-w-xl py-24" : "max-w-7xl space-y-6 py-12"}`}>
      {children}
    </main>
  </div>
);

export const RunDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const { run, loading, isFetching, error, refetch } = useRun(id);

  // Approve action
  const approve = async (reviewNotes = "") => {
    try {
      setActionLoading(true);
      await runService.approveRun(id, { reviewNotes, asDraft: true });
      toast.success("Solution approved! Creating Draft Pull Request on GitHub...");
      refetch({ silent: true });
    } catch (err) {
      console.error("[RunDetails] Approve run error:", err);
      toast.error(err.response?.data?.message || "Failed to approve run");
    } finally {
      setActionLoading(false);
    }
  };

  // Reject action
  const reject = async () => {
    try {
      setActionLoading(true);
      await runService.rejectRun(id);
      toast.success("Run marked as rejected");
      refetch({ silent: true });
    } catch (err) {
      console.error("[RunDetails] Reject run error:", err);
      toast.error(err.response?.data?.message || "Failed to reject run");
    } finally {
      setActionLoading(false);
    }
  };

  // Retry action
  const retry = async (feedback) => {
    try {
      setActionLoading(true);
      await runService.retryRun(id, { feedback });
      toast.success("Agent iteration initiated with your instructions!");
      refetch({ silent: true });
    } catch (err) {
      console.error("[RunDetails] Retry run error:", err);
      toast.error(err.response?.data?.message || "Failed to initiate retry");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete run action
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await runService.deleteRun(id);
      toast.success("Run deleted successfully");
      navigate("/history");
    } catch (err) {
      console.error("[RunDetails] Delete run error:", err);
      toast.error(err.response?.data?.message || "Failed to delete run");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Copy Run ID
  const copyRunId = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(true);
      toast.success("Run ID copied to clipboard");
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      toast.error("Failed to copy Run ID");
    }
  };

  // Socket listener for real-time trace updates and status changes
  useEffect(() => {
    const handleRunUpdate = (data) => {
      if (String(data.runId) !== String(id)) return;
      refetch({ silent: true });
    };

    const handleRunEvent = (data) => {
      if (String(data.runId) !== String(id)) return;
      refetch({ silent: true });
    };

    socket.on("run:update", handleRunUpdate);
    socket.on("run:event", handleRunEvent);

    return () => {
      socket.off("run:update", handleRunUpdate);
      socket.off("run:event", handleRunEvent);
    };
  }, [id, refetch]);

  const isLive = useMemo(() => {
    return ["running", "queued", "publishing"].includes(run?.status);
  }, [run?.status]);

  if (loading) {
    return (
      <Shell>
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-12 w-2/3" />
        <RunCardSkeleton />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </Shell>
    );
  }

  if (error || !run) {
    return (
      <Shell narrow>
        <div className="space-y-6 text-center">
          <p className="eyebrow">404</p>
          <h2 className="font-display text-5xl font-light text-bone">Run not found</h2>
          <p className="text-sm text-bone-2">
            {error || "This run does not exist, or it was deleted."}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link to="/history">
              <Button variant="secondary" size="sm">History</Button>
            </Link>
            <Link to="/">
              <Button size="sm">New run</Button>
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  const proposedPatch = run.result?.proposed_patch;
  const analysis = run.result?.analysis;
  const prMetadata = run.result?.pr_metadata;
  const pullRequest = run.pullRequest;
  const repoPath = (run.repository?.url || run.repoUrl || "").replace("https://github.com/", "");
  const issueNo = run.issue?.number || run.issueNumber;

  const TABS = [
    { id: "all", label: "Overview" },
    { id: "patch", label: "Patch and checks" },
    { id: "planner", label: "Plan" },
    { id: "trace", label: "Trace" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-10 px-5 py-12 sm:px-8">
        <header className="rise space-y-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-mono text-[11px] text-bone-3">
            <Link to="/history" className="inline-flex items-center gap-1 transition-colors hover:text-bone">
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              History
            </Link>
            <span aria-hidden>/</span>
            <span className="text-bone-2">run_{id?.slice(-8)}</span>
          </nav>

          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <StatusBadge status={run.status} />
                <button
                  type="button"
                  onClick={copyRunId}
                  className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[11px] text-bone-3 transition-colors hover:text-bone"
                  title="Copy full run ID"
                >
                  {copiedId ? <Check className="h-3 w-3 text-verdigris" /> : <Copy className="h-3 w-3" />}
                  {id?.slice(0, 8)}
                </button>
              </div>
              <h1 className="max-w-4xl font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] font-light text-bone">
                <span className="text-ember tabular-nums">#{issueNo}</span>{" "}
                {run.issue?.title || "Untitled issue"}
              </h1>
              <p className="font-mono text-[13px] text-bone-3">{repoPath}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {run.repository?.url && (
                <a
                  href={run.repository.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rule-strong px-3.5 text-[13px] text-bone-2 transition hover:border-bone-3 hover:text-bone"
                >
                  Repository
                  <ExternalLink className="h-3 w-3 text-bone-3" aria-hidden />
                </a>
              )}
              <Button variant="outline" size="sm" icon={RotateCw} loading={isFetching} onClick={() => refetch({ silent: false })}>
                Sync
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={() => setShowDeleteModal(true)}
                className="hover:!bg-madder/10 hover:!text-madder"
                aria-label="Delete run"
              />
            </div>
          </div>
        </header>

        <ActiveRunningCard run={run} />
        <RunCard run={run} />
        <HumanReviewCard run={run} onApprove={approve} onReject={reject} onRetry={retry} loading={actionLoading} />

        <div role="tablist" aria-label="Run sections" className="-mb-2 flex items-center gap-7 overflow-x-auto border-b border-rule">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
              className={`-mb-px cursor-pointer border-b py-3 text-[13px] font-medium whitespace-nowrap transition-colors ${
                activeTab === t.id ? "border-ember text-bone" : "border-transparent text-bone-3 hover:text-bone"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {(activeTab === "all" || activeTab === "patch") && (
          <>
            <PRMetadataCard prMetadata={prMetadata} pullRequest={pullRequest} />
            <TestResultsCard proposedPatch={proposedPatch} />
            <PatchCard diff={proposedPatch?.diff} />
          </>
        )}

        {(activeTab === "all" || activeTab === "planner") && <PlannerCard analysis={analysis} />}

        {(activeTab === "all" || activeTab === "trace") && (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <Timeline trace={run.executionTrace || []} isRunning={isLive} />
            <ReviewHistoryCard reviews={run.reviews || []} />
          </div>
        )}
      </main>

      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete this run?"
        description="Its telemetry, diffs and review history will be removed for good."
        confirmText="Delete run"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};

export default RunDetails;
