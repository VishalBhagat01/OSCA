import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  GitBranch,
  Hash,
  Terminal,
  Cpu,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react";
import runService from "../services/runService";
import Navbar from "../components/Navbar";
import Button from "../components/ui/Button";
import StatusBadge from "../components/StatusBadge";

const PRESET_ISSUES = [
  {
    name: "Flask Fix",
    repo: "https://github.com/pallets/flask",
    issue: 5120,
    desc: "CLI runner error handling",
  },
  {
    name: "Requests Bug",
    repo: "https://github.com/psf/requests",
    issue: 6042,
    desc: "Header encoding normalization",
  },
  {
    name: "FastAPI Param",
    repo: "https://github.com/fastapi/fastapi",
    issue: 9241,
    desc: "Query validation edge case",
  },
];

export const Home = () => {
  const navigate = useNavigate();

  const [repoUrl, setRepoUrl] = useState("");
  const [issueNumber, setIssueNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentRuns, setRecentRuns] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    let active = true;
    runService
      .getRuns()
      .then((allRuns) => {
        if (active) {
          setRecentRuns(allRuns.slice(0, 3));
        }
      })
      .catch(() => {
        // Silently ignore if backend is not reachable for recent runs
      })
      .finally(() => {
        if (active) setLoadingRecent(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();

    const trimmedUrl = repoUrl.trim();
    const issueNum = Number(issueNumber);

    if (!trimmedUrl) {
      toast.error("Please provide a GitHub repository URL");
      return;
    }

    if (!trimmedUrl.includes("github.com")) {
      toast.error("Repository URL must be a valid GitHub repository");
      return;
    }

    if (!issueNumber || isNaN(issueNum) || issueNum <= 0) {
      toast.error("Please provide a valid positive issue number");
      return;
    }

    try {
      setLoading(true);
      const data = await runService.createRun({
        repoUrl: trimmedUrl,
        issueNumber: issueNum,
      });

      toast.success("Analysis initiated! Redirecting to live execution...");
      navigate(`/runs/${data.runId}`);
    } catch (err) {
      console.error("[Home] Create run error:", err);
      toast.error(
        err.response?.data?.message || "Failed to start analysis run."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectPreset = (preset) => {
    setRepoUrl(preset.repo);
    setIssueNumber(String(preset.issue));
    toast.success(`Loaded preset: ${preset.name}`);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-14">
        {/* Hero Section */}
        <section className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/8 px-3.5 py-1 text-xs font-medium text-orange-400">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span>Autonomous Software Engineering Agent</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#E8E8E3] tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Resolve GitHub issues{" "}
            <span className="text-orange-500">autonomously.</span>
          </h1>

          <p className="text-sm sm:text-base text-[#737370] max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
            Sentra AI reads your repository code, plans a fix, generates verified patches,
            runs tests, and drafts pull requests — with human-in-the-loop safeguards.
          </p>
        </section>

        {/* Form Container */}
        <section className="max-w-2xl mx-auto w-full">
          <div className="rounded-2xl border border-white/8 bg-[#111111] p-6 sm:p-8 shadow-2xl shadow-black/40 space-y-6">
            <form onSubmit={handleAnalyze} className="space-y-5">
              {/* Repository Input */}
              <div className="space-y-2">
                <label className="flex items-center justify-between text-xs font-medium text-[#A8A8A0] uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5 text-orange-500" />
                    GitHub Repository
                  </span>
                  <span className="text-[11px] font-normal text-[#525250] lowercase normal-case">
                    https://github.com/owner/repo
                  </span>
                </label>
                <input
                  type="text"
                  disabled={loading}
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/facebook/react"
                  className="w-full rounded-xl border border-white/8 bg-[#0A0A0A] px-4 py-3 text-sm text-[#E8E8E3] placeholder-[#525250] transition focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 outline-none disabled:opacity-50"
                />
              </div>

              {/* Issue Number Input */}
              <div className="space-y-2">
                <label className="flex items-center justify-between text-xs font-medium text-[#A8A8A0] uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-orange-500" />
                    Issue Number
                  </span>
                  <span className="text-[11px] font-normal text-[#525250] lowercase normal-case">
                    Numeric ID on GitHub
                  </span>
                </label>
                <input
                  type="number"
                  disabled={loading}
                  value={issueNumber}
                  onChange={(e) => setIssueNumber(e.target.value)}
                  placeholder="e.g. 28140"
                  className="w-full rounded-xl border border-white/8 bg-[#0A0A0A] px-4 py-3 text-sm text-[#E8E8E3] placeholder-[#525250] transition focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 outline-none disabled:opacity-50"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full glow-orange"
                icon={ArrowRight}
              >
                {loading ? "Starting Analysis..." : "Launch Analysis"}
              </Button>
            </form>

            {/* Quick Preset Chips */}
            <div className="pt-5 border-t border-white/6 space-y-3">
              <span className="text-xs font-medium text-[#525250]">
                Quick test examples
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PRESET_ISSUES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={loading}
                    onClick={() => selectPreset(preset)}
                    className="text-left rounded-xl border border-white/6 bg-[#0A0A0A]/60 p-3 transition hover:border-orange-500/30 hover:bg-white/3 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#A8A8A0] group-hover:text-orange-400 transition">
                        {preset.name}
                      </span>
                      <ArrowUpRight className="h-3 w-3 text-[#525250] group-hover:text-orange-500 transition" />
                    </div>
                    <p className="text-[11px] text-[#525250] truncate mt-1">
                      #{preset.issue} · {preset.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Feature Pillars */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/6 bg-[#111111] p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/15">
              <Cpu className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-[#E8E8E3]">
              Agent Graph Architecture
            </h2>
            <p className="text-[13px] text-[#737370] leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
              Multi-node LangGraph pipeline coordinates repository indexing, planner reasoning, patch generation, and test execution.
            </p>
          </div>

          <div className="rounded-2xl border border-white/6 bg-[#111111] p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/15">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-[#E8E8E3]">
              Automated Test Verification
            </h2>
            <p className="text-[13px] text-[#737370] leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
              Validates patches in isolated environments, running regression suites and acceptance criteria before any human review.
            </p>
          </div>

          <div className="rounded-2xl border border-white/6 bg-[#111111] p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/15">
              <Terminal className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-[#E8E8E3]">
              Human-in-the-Loop Control
            </h2>
            <p className="text-[13px] text-[#737370] leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
              Review diffs, provide natural language feedback for retries, or approve and draft a pull request directly to GitHub.
            </p>
          </div>
        </section>

        {/* Recent Runs Preview */}
        {!loadingRecent && recentRuns.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-white/6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#A8A8A0]">
                Recent Executions
              </h2>
              <Link
                to="/history"
                className="text-xs font-medium text-orange-500 hover:text-orange-400 flex items-center gap-1 transition"
              >
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid gap-3">
              {recentRuns.map((run) => (
                <Link
                  key={run._id}
                  to={`/runs/${run._id}`}
                  className="flex items-center justify-between rounded-xl border border-white/6 bg-[#111111] p-4 transition hover:border-orange-500/20 hover:bg-[#171717] group"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-[#737370] group-hover:text-orange-400 transition">
                      <GitBranch className="h-4 w-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-medium text-[#E8E8E3] truncate">
                        {run.repository?.url || run.repoUrl}
                      </p>
                      <p className="text-[11px] text-[#525250] mt-0.5">
                        Issue #{run.issue?.number || run.issueNumber} ·{" "}
                        {new Date(run.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={run.status} />
                    <ChevronRight className="h-4 w-4 text-[#525250] group-hover:text-[#A8A8A0] transition" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Home;