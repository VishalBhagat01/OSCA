import { useState } from "react";
import axios from "axios";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const Home = () => {
    const [repoUrl, setRepoUrl] = useState("");
    const [issueNumber, setIssueNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [runId, setRunId] = useState("");

    const analyzeIssue = async () => {
        if (!repoUrl || !issueNumber) return;

        try {
            setLoading(true);

            const payload = {
                repoUrl,
                issueNumber: Number(issueNumber),
                issueTitle: `Issue #${issueNumber}`,
            };

            const { data } = await api.post("/runs", payload);

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
        <div style={{ padding: "40px" }}>

            <h1>Open Source Agent</h1>

            <input
                placeholder="Repository URL"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
            />

            <br /><br />

            <input
                placeholder="Issue Number"
                value={issueNumber}
                onChange={(e) => setIssueNumber(e.target.value)}
            />

            <br /><br />

            <button onClick={analyzeIssue}>
                {loading ? "Analyzing..." : "Analyze"}
            </button>

            {runId && (
                <>
                    <br /><br />
                    <h3>Run Id</h3>
                    <p>{runId}</p>
                </>
            )}

        </div>
    );
};

export default Home;