import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Trash2, RotateCw, Plus, ArrowUpRight } from "lucide-react";
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

  const kpis = [
    { label: "Total runs", value: stats.total, tone: "text-bone" },
    { label: "In flight", value: stats.active, tone: "text-ember" },
    { label: "Needs review", value: stats.awaiting, tone: "text-saffron" },
    { label: "Success rate", value: `${stats.rate}%`, tone: "text-verdigris" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-12 px-5 py-14 sm:px-8">
        <header className="rise flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="space-y-3">
            <p className="eyebrow">Ledger</p>
            <h1 className="font-display text-5xl font-light text-bone">Execution history</h1>
            <p className="max-w-md text-[15px] text-bone-2">
              Every agent run, with its patch, its tests and what you decided.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" icon={RotateCw} onClick={fetchRuns} disabled={loading}>
              Refresh
            </Button>
            <Link to="/">
              <Button size="sm" icon={Plus}>
                New run
              </Button>
            </Link>
          </div>
        </header>

        {loading ? (
          <StatsSkeleton />
        ) : (
          <dl className="rise grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-rule bg-rule sm:grid-cols-4" style={{ "--i": 1 }}>
            {kpis.map((k) => (
              <div key={k.label} className="bg-ink-2 p-5 sm:p-6">
                <dt className="eyebrow">{k.label}</dt>
                <dd className={`mt-3 font-display text-5xl leading-none font-light tabular-nums ${k.tone}`}>
                  {k.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <div className="flex flex-col justify-between gap-4 border-b border-rule sm:flex-row sm:items-center">
          <div role="tablist" aria-label="Filter runs" className="-mb-px flex items-center gap-6 overflow-x-auto">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={selectedFilter === f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`cursor-pointer border-b py-3 text-[13px] font-medium whitespace-nowrap transition-colors ${
                  selectedFilter === f.id
                    ? "border-ember text-bone"
                    : "border-transparent text-bone-3 hover:text-bone"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <label className="relative mb-3 w-full sm:mb-0 sm:w-72">
            <span className="sr-only">Search runs</span>
            <Search className="pointer-events-none absolute top-1/2 left-0 h-3.5 w-3.5 -translate-y-1/2 text-bone-3" aria-hidden />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repo, issue, title"
              className="field !py-2 pl-6 !text-[13px]"
            />
          </label>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-madder/30 bg-madder/5 p-4 text-sm text-madder">
            {error}
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <RunCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && filteredRuns.length === 0 && (
          <div className="surface px-6 py-20 text-center">
            <h3 className="font-display text-3xl font-light text-bone">Nothing here yet</h3>
            <p className="mx-auto mt-3 max-w-sm text-sm text-bone-2">
              {searchQuery || selectedFilter !== "all"
                ? "No run matches this filter. Widen the search or pick another tab."
                : "Point Sentra at a GitHub issue and the first run will appear here."}
            </p>
            <Link to="/" className="mt-8 inline-block">
              <Button size="sm" icon={Plus}>
                Start a run
              </Button>
            </Link>
          </div>
        )}

        {!loading && filteredRuns.length > 0 && (
          <ul className="divide-y divide-rule border-y border-rule">
            {filteredRuns.map((run) => {
              const repo = (run.repository?.url || run.repoUrl || "").replace("https://github.com/", "");
              return (
                <li key={run._id} className="group relative">
                  <Link
                    to={`/runs/${run._id}`}
                    className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 py-6 pr-14 transition-colors group-hover:bg-bone/[0.03] sm:grid-cols-[6rem_1fr_auto] sm:px-3 sm:pr-24"
                  >
                    <span className="font-display text-3xl font-light text-ember tabular-nums sm:text-4xl">
                      {run.issue?.number || run.issueNumber}
                    </span>
                    <span className="col-span-2 row-start-2 min-w-0 space-y-1.5 sm:col-span-1 sm:row-start-auto">
                      <span className="block truncate text-[17px] text-bone">
                        {run.issue?.title || "Untitled issue"}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-bone-3">
                        <span className="truncate">{repo}</span>
                        <span>{formatDate(run.createdAt)}</span>
                        {run.pullRequest?.url && <span className="text-verdigris">PR #{run.pullRequest.number}</span>}
                      </span>
                    </span>
                    <StatusBadge status={run.status} />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(run)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-md p-2 text-bone-4 transition hover:bg-madder/10 hover:text-madder sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                    aria-label={`Delete run for issue ${run.issue?.number || run.issueNumber}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ArrowUpRight
                    className="pointer-events-none absolute top-1/2 right-12 hidden h-4 w-4 -translate-y-1/2 text-bone-4 transition group-hover:text-bone sm:block"
                    aria-hidden
                  />
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteRun}
        title="Delete this run?"
        description={`The run for issue #${
          deleteTarget?.issue?.number || deleteTarget?.issueNumber
        } and its telemetry will be removed for good.`}
        confirmText="Delete run"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};

export default History;
