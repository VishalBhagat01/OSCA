import { useEffect } from "react";
import { useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import RunCard from "../components/RunCard";
import PlannerCard from "../components/PlannerCard";
import PatchCard from "../components/PatchCard";
import Timeline from "../components/Timeline";

import useRun from "../hooks/useRun";
import socket from "../socket";

const RunDetails = () => {
    const { id } = useParams();

    const {
        run,
        loading,
        error,
        refetch,
    } = useRun(id);

    useEffect(() => {
        const handleRunUpdate = (data) => {
            if (String(data.runId) !== String(id)) return;

            refetch();
        };

        socket.on("run:update", handleRunUpdate);

        return () => {
            socket.off("run:update", handleRunUpdate);
        };
    }, [id, refetch]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black text-white">
                <p className="text-lg text-zinc-400">
                    Loading run...
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
                        Execution details for this Open Source Agent run.
                    </p>
                </div>

                <RunCard run={run} />

                <PlannerCard
                    analysis={run.result?.analysis}
                />

                <PatchCard
                    diff={run.result?.proposed_patch?.diff}
                />

                <Timeline
                    trace={run.executionTrace || []}
                />

            </main>
        </div>
    );
};

export default RunDetails;