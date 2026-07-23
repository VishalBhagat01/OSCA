import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import InfoCard from "../components/InfoCard";
import PlannerCard from "../components/PlannerCard";
import PatchCard from "../components/PatchCard";
import Timeline from "../components/Timeline";
import socket from "../socket";

const RunDetails = () => {
  const { id } = useParams();

  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const fetchRun = async () => {
        try {
          const { data } = await api.get(`/runs/${id}`);
          setRun(data.run);
        } catch (err) {
          console.log(err);
        } finally {
          setLoading(false);
        }
      };

      const handleRunUpdate = (data) => {

          if (data.runId !== id) return;

          fetchRun();
      };

      fetchRun();
      socket.on("run:update", handleRunUpdate);

      return () => {
          socket.off("run:update", handleRunUpdate);

      };

  }, [id]);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (!run) {
    return <h2>Run not found.</h2>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl space-y-6 p-8">
        <h1 className="text-4xl font-bold">Run Details</h1>

        <div className="grid grid-cols-3 gap-6">
          <InfoCard title="Repository" value={run.repository.url} />

          <InfoCard title="Issue" value={`#${run.issue.number}`} />

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm text-zinc-400">Status</p>

            <div className="mt-3">
              <StatusBadge status={run.status} />
            </div>
          </div>
        </div>

        <PlannerCard analysis={run.result?.analysis} />

        <PatchCard diff={run.result?.proposed_patch?.diff} />

        <Timeline trace={run.executionTrace} />
      </div>
    </div>
  );
};

export default RunDetails;
