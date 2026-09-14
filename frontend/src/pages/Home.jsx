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
  Sparkles,
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
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-medium text-indigo-300 shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Autonomous Software Engineering Agent</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight max-w-3xl mx-auto leading-tight">
            Analyze GitHub issues. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200 bg-clip-text text-transparent">
              Synthesize verified patches.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Sentra AI reads your repository code, identifies the root cause,
            executes regression tests, and drafts pull requests with human-in-the-loop safeguards.
          </p>
        </section>

        {/* Form Container */}
        <section className="max-w-2xl mx-auto w-full">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            <form onSubmit={handleAnalyze} className="space-y-5">
              {/* Repository Input */}
              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5 text-indigo-400" />
                    GitHub Repository
                  </span>
                  <span className="text-[11px] font-normal text-zinc-500 lowercase">
                    https://github.com/owner/repo
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={loading}
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/facebook/react"
                    className="w-full rounded-xl border border-zinc-700/80 bg-zinc-950/80 px-4 py-3 text-sm text-white placeholder-zinc-500 transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Issue Number Input */}
              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-indigo-400" />
                    Issue Number
                  </span>
                  <span className="text-[11px] font-normal text-zinc-500 lowercase">
                    Numeric ID on GitHub
                  </span>
                </label>
                <input
                  type="number"
                  disabled={loading}
                  value={issueNumber}
                  onChange={(e) => setIssueNumber(e.target.value)}
                  placeholder="e.g. 28140"
                  className="w-full rounded-xl border border-zinc-700/80 bg-zinc-950/80 px-4 py-3 text-sm text-white placeholder-zinc-500 transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none disabled:opacity-50"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full shadow-lg shadow-indigo-950/50"
                icon={Terminal}
              >
                {loading ? "Starting Analysis Graph..." : "Launch Issue Analysis"}
              </Button>
            </form>

            {/* Quick Preset Chips */}
            <div className="pt-4 border-t border-zinc-800/80 space-y-2.5">
              <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-indigo-400" />
                Quick Test Examples:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PRESET_ISSUES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={loading}
                    onClick={() => selectPreset(preset)}
                    className="text-left rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5 transition hover:border-indigo-500/50 hover:bg-zinc-800/50 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200 group-hover:text-indigo-300 transition">
                        {preset.name}
                      </span>
                      <ArrowUpRight className="h-3 w-3 text-zinc-500 group-hover:text-indigo-400 transition" />
                    </div>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      #{preset.issue} • {preset.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Feature Pillars */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Cpu className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold text-white">
              Agent Graph Architecture
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Multi-node LangGraph execution coordinates repository indexing, planner reasoning, patch generation, and test execution.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold text-white">
              Automated Test Verification
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Validates proposed patches in isolated virtual environments, checking regression suites and acceptance criteria.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Terminal className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold text-white">
              Human-in-the-Loop Control
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Review code diffs, provide natural language feedback for retries, or approve and draft a pull request directly to GitHub.
            </p>
          </div>
        </section>

        {/* Recent Runs Preview (if any) */}
        {!loadingRecent && recentRuns.length > 0 && (
          <section className="space-y-3 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Recent Executions
              </h2>
              <Link
                to="/history"
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                View all runs <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid gap-3">
              {recentRuns.map((run) => (
                <Link
                  key={run._id}
                  to={`/runs/${run._id}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-4 transition hover:border-indigo-500/40 hover:bg-zinc-800/50 group"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 group-hover:text-indigo-300 transition">
                      <GitBranch className="h-4 w-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-medium text-white truncate">
                        {run.repository?.url || run.repoUrl}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Issue #{run.issue?.number || run.issueNumber} •{" "}
                        {new Date(run.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={run.status} />
                    <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-300 transition" />
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