import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

import Navbar from "../components/Navbar";
import RunCard from "../components/RunCard";
import PlannerCard from "../components/PlannerCard";
import PatchCard from "../components/PatchCard";
import Timeline from "../components/Timeline";
import HumanReviewCard from "../components/HumanReviewCard";
import ActiveRunningCard from "../components/ActiveRunningCard";
import ReviewHistoryCard from "../components/ReviewHistoryCard";
import useRun from "../hooks/useRun";
import socket from "../socket";
import api from "../services/api";

const RunDetails = () => {
    const { id } = useParams();
    const [actionLoading, setActionLoading] = useState(false);

    const {
        run,
        loading,
        error,
        refetch,
    } = useRun(id);

    const approve = async () => {
        try {
            setActionLoading(true);
            await api.post(`/runs/${id}/approve`);
            toast.success("Run approved successfully!");
            refetch();
        } catch (err) {
            console.error("Failed to approve run:", err);
            toast.error(err.response?.data?.message || "Failed to approve run");
        } finally {
            setActionLoading(false);
        }
    };

    const reject = async () => {
        try {
            setActionLoading(true);
            await api.post(`/runs/${id}/reject`);
            toast.success("Run rejected");
            refetch();
        } catch (err) {
            console.error("Failed to reject run:", err);
            toast.error(err.response?.data?.message || "Failed to reject run");
        } finally {
            setActionLoading(false);
        }
    };

    const retry = async (feedback) => {
        try {
            setActionLoading(true);
            await api.post(`/runs/${id}/retry`, {
                feedback,
            });
            toast.success("Agent retry initiated with feedback!");
            refetch();
        } catch (err) {
            console.error("Failed to retry run:", err);
            toast.error(err.response?.data?.message || "Failed to initiate retry");
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        const handleRunUpdate = (data) => {
            if (String(data.runId) !== String(id)) return;

            refetch();
        };

        const handleRunEvent = (data) => {
            if (String(data.runId) !== String(id)) return;

            refetch();
        };

        socket.on("run:update", handleRunUpdate);
        socket.on("run:event", handleRunEvent);

        return () => {
            socket.off("run:update", handleRunUpdate);
            socket.off("run:event", handleRunEvent);
        };
    }, [id, refetch]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black text-white">
                <p className="text-lg text-zinc-400 animate-pulse">
                    Loading run details...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black text-white">
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
                    <p className="text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    if (!run) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black text-white">
                <p className="text-zinc-400">
                    Run not found.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">

                <div>
                    <h1 className="text-3xl font-bold">
                        Run Details
                    </h1>

                    <p className="mt-2 text-zinc-400">
                        Execution details for this Sentra AI run.
                    </p>
                </div>

                {/* Active Running State Banner when Agent is working */}
                <ActiveRunningCard run={run} />

                <RunCard run={run} />

                {/* Human Review Action Card */}
                <HumanReviewCard
                    run={run}
                    onApprove={approve}
                    onReject={reject}
                    onRetry={retry}
                    loading={actionLoading}
                />

                {/* Review & Feedback History Timeline */}
                <ReviewHistoryCard reviews={run.reviews || []} />

                <PlannerCard
                    analysis={run.result?.analysis}
                />

                <PatchCard
                    diff={run.result?.proposed_patch?.diff}
                />

                <Timeline
                    trace={run.executionTrace || []}
                    isRunning={run.status === "running" || run.status === "queued"}
                />

            </main>
        </div>
    );
};

export default RunDetails;