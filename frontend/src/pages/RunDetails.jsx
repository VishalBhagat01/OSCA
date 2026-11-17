import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  Copy,
  Check,
  RotateCw,
  Trash2,
  GitBranch,
  ExternalLink,
  Code2,
  Brain,
  ListTree,
} from "lucide-react";

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
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
        <Navbar />
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
          <RunCardSkeleton />
          <div className="rounded-2xl border border-white/6 bg-[#111111] p-8 space-y-4">
            <Skeleton className="h-6 w-60" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
        <Navbar />
        <main className="max-w-xl mx-auto w-full px-4 py-20 text-center space-y-4">
          <div className="rounded-2xl border border-red-500/20 bg-[#111111] p-8 space-y-4 shadow-2xl">
            <h2 className="text-xl font-bold text-[#E8E8E3]" style={{ fontFamily: "var(--font-serif)" }}>
              Execution Not Found
            </h2>
            <p className="text-sm text-red-300">
              {error || "The requested run ID does not exist or may have been deleted."}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link to="/history">
                <Button variant="secondary" size="sm">
                  View History
                </Button>
              </Link>
              <Link to="/">
                <Button variant="primary" size="sm">
                  Start New Run
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const proposedPatch = run.result?.proposed_patch;
  const analysis = run.result?.analysis;
  const prMetadata = run.result?.pr_metadata;
  const pullRequest = run.pullRequest;

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Breadcrumbs & Actions Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/6 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[#525250]">
              <Link
                to="/history"
                className="hover:text-[#E8E8E3] transition flex items-center gap-1 font-medium"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                History
              </Link>
              <span>/</span>
              <span className="font-mono text-[#A8A8A0]">
                run_{id?.slice(-8)}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-[#E8E8E3] tracking-tight">
                Run #{id?.slice(-6)}
              </h1>

              <StatusBadge status={run.status} size="sm" />

              {/* Copy Run ID */}
              <button
                type="button"
                onClick={copyRunId}
                className="inline-flex items-center gap-1 rounded-md border border-white/8 bg-[#111111] px-2 py-0.5 font-mono text-[11px] text-[#525250] hover:text-[#E8E8E3] transition"
                title="Copy full run ID"
              >
                {copiedId ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span>id:{id?.slice(0, 8)}...</span>
              </button>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {run.repository?.url && (
              <a
                href={run.repository.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/8 px-3 py-2 text-xs font-medium text-[#A8A8A0] hover:text-[#E8E8E3] hover:border-white/12 transition"
              >
                <GitBranch className="h-3.5 w-3.5 text-orange-500" />
                <span className="hidden md:inline">GitHub</span>
                <ExternalLink className="h-3 w-3 text-[#525250]" />
              </a>
            )}

            <Button
              variant="outline"
              size="sm"
              icon={RotateCw}
              loading={isFetching}
              onClick={() => refetch({ silent: false })}
              title="Refresh run state"
            >
              Sync
            </Button>

            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={() => setShowDeleteModal(true)}
              className="text-[#525250] hover:text-red-400 hover:bg-red-500/10"
              title="Delete run"
            />
          </div>
        </div>

        {/* Active Running State Banner */}
        <ActiveRunningCard run={run} />

        {/* Metric KPI Cards */}
        <RunCard run={run} />

        {/* Human-in-the-Loop Review Card */}
        <HumanReviewCard
          run={run}
          onApprove={approve}
          onReject={reject}
          onRetry={retry}
          loading={actionLoading}
        />

        {/* View Mode Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-white/6 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition ${
              activeTab === "all"
                ? "bg-white/8 text-[#E8E8E3]"
                : "text-[#525250] hover:text-[#A8A8A0] hover:bg-white/3"
            }`}
          >
            All Sections
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("patch")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition ${
              activeTab === "patch"
                ? "bg-white/8 text-[#E8E8E3]"
                : "text-[#525250] hover:text-[#A8A8A0] hover:bg-white/3"
            }`}
          >
            <Code2 className="h-3.5 w-3.5 text-emerald-400" />
            Patch & Verification
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("planner")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition ${
              activeTab === "planner"
                ? "bg-white/8 text-[#E8E8E3]"
                : "text-[#525250] hover:text-[#A8A8A0] hover:bg-white/3"
            }`}
          >
            <Brain className="h-3.5 w-3.5 text-amber-400" />
            Planner Analysis
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("trace")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition ${
              activeTab === "trace"
                ? "bg-white/8 text-[#E8E8E3]"
                : "text-[#525250] hover:text-[#A8A8A0] hover:bg-white/3"
            }`}
          >
            <ListTree className="h-3.5 w-3.5 text-orange-400" />
            Trace & History
          </button>
        </div>

        {/* Section: Pull Request Metadata Card */}
        {(activeTab === "all" || activeTab === "patch") && (
          <PRMetadataCard
            prMetadata={prMetadata}
            pullRequest={pullRequest}
          />
        )}

        {/* Section: Test Results & Acceptance Card */}
        {(activeTab === "all" || activeTab === "patch") && (
          <TestResultsCard proposedPatch={proposedPatch} />
        )}

        {/* Section: Synthesized Code Diff Card */}
        {(activeTab === "all" || activeTab === "patch") && (
          <PatchCard diff={proposedPatch?.diff} />
        )}

        {/* Section: Planner Analysis Card */}
        {(activeTab === "all" || activeTab === "planner") && (
          <PlannerCard analysis={analysis} />
        )}

        {/* Section: Execution Trace & Review History */}
        {(activeTab === "all" || activeTab === "trace") && (
          <div className="space-y-8">
            <Timeline
              trace={run.executionTrace || []}
              isRunning={isLive}
            />
            <ReviewHistoryCard reviews={run.reviews || []} />
          </div>
        )}
      </main>

      {/* Delete Run Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete This Execution Run?"
        description="Are you sure? All execution telemetry, diffs, and review history will be permanently deleted."
        confirmText="Yes, Delete Run"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};

export default RunDetails;