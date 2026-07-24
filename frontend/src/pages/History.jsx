import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";

import { GitBranch, Hash, CalendarDays, ChevronRight } from "lucide-react";

const formatDate = (date) => {
    if (!date) return "--";

    return new Date(date).toLocaleString();
};

const History = () => {
    const [runs, setRuns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchRuns = async () => {
            try {
                const { data } = await api.get("/runs");

                setRuns(data.runs || data);
            } catch (err) {
                console.error(err);

                setError(
                    err.response?.data?.message ||
                    "Failed to load runs."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchRuns();
    }, []);

    return (
        <>
            <Navbar />

            <div className="mx-auto max-w-7xl px-6 py-10">

                <div className="mb-8">

                    <h1 className="text-3xl font-bold text-white">
                        Run History
                    </h1>

                    <p className="mt-2 text-zinc-400">
                        View all previous executions.
                    </p>

                </div>

                {loading && (
                    <p className="text-zinc-400">
                        Loading...
                    </p>
                )}

                {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
                        {error}
                    </div>
                )}

                {!loading && runs.length === 0 && (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center">

                        <h2 className="text-xl font-semibold text-white">
                            No Runs Yet
                        </h2>

                        <p className="mt-2 text-zinc-500">
                            Analyze a GitHub issue to create your first run.
                        </p>

                    </div>
                )}

                <div className="space-y-5">

                    {runs.map((run) => (

                        <Link
                            key={run._id}
                            to={`/runs/${run._id}`}
                            className="block"
                        >

                            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition-all hover:border-blue-500/30 hover:bg-zinc-800">

                                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

                                    <div className="space-y-4">

                                        <div className="flex items-center gap-3">

                                            <GitBranch
                                                size={18}
                                                className="text-zinc-400"
                                            />

                                            <span className="font-medium text-white">
                                                {run.repository?.url || run.repoUrl}
                                            </span>

                                        </div>

                                        <div className="flex items-center gap-3">

                                            <Hash
                                                size={18}
                                                className="text-zinc-400"
                                            />

                                            <span className="text-zinc-300">
                                                Issue #{run.issue?.number || run.issueNumber}
                                            </span>

                                        </div>

                                        <div className="flex items-center gap-3">

                                            <CalendarDays
                                                size={18}
                                                className="text-zinc-400"
                                            />

                                            <span className="text-sm text-zinc-500">
                                                {formatDate(run.createdAt)}
                                            </span>

                                        </div>

                                    </div>

                                    <div className="flex items-center gap-5">

                                        <StatusBadge
                                            status={run.status}
                                        />

                                        <ChevronRight
                                            className="text-zinc-500"
                                        />

                                    </div>

                                </div>

                            </div>

                        </Link>

                    ))}

                </div>

            </div>
        </>
    );
};

export default History;