import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  GitBranch,
  CalendarDays,
  ChevronRight,
  Search,
  Trash2,
  Filter,
  PlusCircle,
  Activity,
  CheckCircle2,
  UserCheck,
  RotateCw,
} from "lucide-react";
import toast from "react-hot-toast";
import runService from "../services/runService";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { RunCardSkeleton, StatsSkeleton } from "../components/ui/Skeleton";
import { formatDate } from "../utils/formatters";
import { STATUS_FILTERS } from "../constants/runStatus";

export const History = () => {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Deletion state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const allRuns = await runService.getRuns();
      setRuns(allRuns);
      setError("");
    } catch (err) {
      console.error("[History] Fetch runs error:", err);
      setError(err.response?.data?.message || "Failed to load execution runs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    runService
      .getRuns()
      .then((allRuns) => {
        if (!active) return;
        setRuns(allRuns);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        console.error("[History] Initial fetch runs error:", err);
        setError(err.response?.data?.message || "Failed to load execution runs.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleDeleteRun = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await runService.deleteRun(deleteTarget._id);
      toast.success("Run removed from history");
      setRuns((prev) => prev.filter((r) => r._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("[History] Delete run error:", err);
      toast.error(err.response?.data?.message || "Failed to delete run");
    } finally {
      setDeleting(false);
    }
  };

  // Compute KPI Statistics
  const stats = useMemo(() => {
    const total = runs.length;
    const active = runs.filter((r) =>
      ["running", "queued", "publishing"].includes(r.status)
    ).length;
    const completed = runs.filter((r) => r.status === "completed").length;
    const awaiting = runs.filter((r) => r.status === "awaiting_approval").length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, active, completed, awaiting, rate };
  }, [runs]);

  // Filtered runs
  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      // Status filter
      const filterConfig = STATUS_FILTERS.find((f) => f.id === selectedFilter);
      if (filterConfig && filterConfig.statuses) {
        if (!filterConfig.statuses.includes(run.status)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const repo = (run.repository?.url || run.repoUrl || "").toLowerCase();
        const issue = String(run.issue?.number || run.issueNumber || "");
        const title = (run.issue?.title || "").toLowerCase();
        if (!repo.includes(q) && !issue.includes(q) && !title.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [runs, selectedFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Execution Dashboard
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400">
              Audit and monitor autonomous agent runs, patch telemetry, and PR statuses.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              icon={RotateCw}
              onClick={fetchRuns}
              disabled={loading}
            >
              Refresh
            </Button>
            <Link to="/">
              <Button variant="primary" size="sm" icon={PlusCircle}>
                New Analysis
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Stats Bar */}
        {loading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-1">
              <span className="text-xs font-medium text-zinc-400">Total Runs</span>
              <p className="font-mono text-2xl font-bold text-white">
                {stats.total}
              </p>
            </div>

            <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/10 p-4 space-y-1">
              <span className="text-xs font-medium text-indigo-300 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                Active / Running
              </span>
              <p className="font-mono text-2xl font-bold text-indigo-400">
                {stats.active}
              </p>
            </div>

            <div className="rounded-xl border border-violet-500/20 bg-violet-950/10 p-4 space-y-1">
              <span className="text-xs font-medium text-violet-300 flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5" />
                Awaiting Review
              </span>
              <p className="font-mono text-2xl font-bold text-violet-400">
                {stats.awaiting}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4 space-y-1">
              <span className="text-xs font-medium text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Success Rate
              </span>
              <p className="font-mono text-2xl font-bold text-emerald-400">
                {stats.rate}%
              </p>
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFilter(f.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${
                  selectedFilter === f.id
                    ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/80"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repo, issue, title..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-1.5 pl-9 text-xs text-white placeholder-zinc-500 outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <RunCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRuns.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center space-y-3 backdrop-blur">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
              <Filter className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-white">
              No executions match your criteria
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {searchQuery || selectedFilter !== "all"
                ? "Try adjusting your search query or status filter to find previous runs."
                : "Analyze a GitHub issue to launch your first autonomous patch execution."}
            </p>
            <div className="pt-2">
              <Link to="/">
                <Button variant="primary" size="sm" icon={PlusCircle}>
                  Start First Run
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Runs List */}
        {!loading && filteredRuns.length > 0 && (
          <div className="space-y-3">
            {filteredRuns.map((run) => (
              <div
                key={run._id}
                className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition-all duration-150 hover:border-zinc-700/90 hover:bg-zinc-850/60 shadow-lg"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    to={`/runs/${run._id}`}
                    className="flex-1 space-y-2 min-w-0"
                  >
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="flex items-center gap-1.5 font-medium text-xs sm:text-sm text-white hover:text-indigo-300 transition truncate">
                        <GitBranch className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">
                          {run.repository?.url || run.repoUrl}
                        </span>
                      </div>

                      <span className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-300 shrink-0">
                        #{run.issue?.number || run.issueNumber}
                      </span>
                    </div>

                    {run.issue?.title && (
                      <p className="text-xs text-zinc-400 line-clamp-1">
                        {run.issue.title}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-zinc-500 font-mono">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(run.createdAt)}
                      </span>
                      {run.pullRequest?.url && (
                        <span className="text-indigo-400">
                          PR #{run.pullRequest.number} Available
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <StatusBadge status={run.status} size="sm" />

                    {/* Delete Run Button with modal */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(run);
                      }}
                      className="rounded-lg p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete run from history"
                      aria-label="Delete run"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <Link
                      to={`/runs/${run._id}`}
                      className="rounded-lg p-1.5 text-zinc-500 group-hover:text-white transition"
                      aria-label="View run details"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Run Confirmation Safeguard */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteRun}
        title="Delete Execution Run?"
        description={`Are you sure you want to delete the run for issue #${
          deleteTarget?.issue?.number || deleteTarget?.issueNumber
        }? This will remove its history and telemetry.`}
        confirmText="Yes, Delete Run"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};

export default History;