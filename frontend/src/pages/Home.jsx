import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const Home = () => {
    const navigate = useNavigate();

    const [repoUrl, setRepoUrl] = useState("");
    const [issueNumber, setIssueNumber] = useState("");
    const [loading, setLoading] = useState(false);

    const analyzeIssue = async () => {
        if (!repoUrl || !issueNumber) {
            alert("Please enter Repository URL and Issue Number.");
            return;
        }

        if (!repoUrl.includes("github.com")) {
            alert("Please enter a valid GitHub repository URL.");
            return;
        }

        const issue = Number(issueNumber);

        if (isNaN(issue) || issue <= 0) {
            alert("Invalid issue number.");
            return;
        }

        try {
            setLoading(true);

            const { data } = await api.post("/runs", {
                repoUrl,
                issueNumber: issue,
            });

            navigate(`/runs/${data.runId}`);
        } catch (err) {
            console.error(err);

            alert(
                err.response?.data?.message ||
                "Failed to start analysis."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#0A0A0A] flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-2xl bg-[#0D0D0D] border border-zinc-800 rounded-2xl shadow-xl p-6 sm:p-8">

                <h1 className="text-5xl font-extrabold tracking-tight text-white text-center" style={{ fontFamily: "Satoshi, sans-serif" }}>
                    Sentra AI
                </h1>

                <p className="text-zinc-400 text-center mt-2 mb-8 py-2 " style={{ fontFamily: "Satoshi, sans-serif" }}>
                    Analyze GitHub Issues and Generate Intelligent Code Patches
                </p>

                <div className="space-y-6">

                    <div>
                        <label className="block text-zinc-300 mb-2">
                            Repository URL
                        </label>

                        <input
                            type="text"
                            disabled={loading}
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            placeholder="https://github.com/owner/repository"
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-zinc-300 mb-2">
                            Issue Number
                        </label>

                        <input
                            type="number"
                            disabled={loading}
                            value={issueNumber}
                            onChange={(e) => setIssueNumber(e.target.value)}
                            placeholder="Enter GitHub issue number"
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                        />
                    </div>

                    <button
                        disabled={loading}
                        onClick={analyzeIssue}
                        className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Analyzing..." : "Analyze Repository"}
                    </button>

                </div>

            </div>
        </div>
    );
};

export default Home;