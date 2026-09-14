import {
  GitBranch,
  Hash,
  Clock3,
  CalendarDays,
  ExternalLink,
} from "lucide-react";
import InfoCard from "./InfoCard";
import StatusBadge from "./StatusBadge";
import useLiveNow from "../hooks/useLiveNow";
import { formatDate } from "../utils/formatters";

export const RunCard = ({ run }) => {
  const isLive = ["running", "queued", "publishing"].includes(run?.status);
  const now = useLiveNow(isLive);

  if (!run) return null;

  const calculateDuration = () => {
    if (!run.createdAt) return "--";
    const startTime = new Date(run.createdAt).getTime();
    const endTime = run.completedAt
      ? new Date(run.completedAt).getTime()
      : now > 0
      ? now
      : startTime;

    const diff = Math.max(0, Math.floor((endTime - startTime) / 1000));
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;

    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Repository */}
      <InfoCard
        title="Target Repository"
        icon={<GitBranch className="h-4 w-4 text-indigo-400" />}
      >
        <div className="space-y-1">
          <p className="break-all font-mono text-xs sm:text-sm font-semibold text-white">
            {run.repository?.url?.replace("https://github.com/", "") ||
              run.repository?.url}
          </p>
          {run.repository?.url && (
            <a
              href={run.repository.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-indigo-400 transition"
            >
              <span>View on GitHub</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </InfoCard>

      {/* Issue */}
      <InfoCard
        title="Reported Issue"
        icon={<Hash className="h-4 w-4 text-violet-400" />}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-white">
              #{run.issue?.number}
            </span>
          </div>
          <p className="text-xs text-zinc-400 line-clamp-2" title={run.issue?.title}>
            {run.issue?.title || "Issue details loaded from repository"}
          </p>
        </div>
      </InfoCard>

      {/* Status & Timestamp */}
      <InfoCard
        title="Execution Status"
        icon={<CalendarDays className="h-4 w-4 text-emerald-400" />}
        badge={<StatusBadge status={run.status} size="xs" />}
      >
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">
            Started At
          </p>
          <p className="font-mono text-xs text-zinc-300">
            {formatDate(run.createdAt)}
          </p>
        </div>
      </InfoCard>

      {/* Runtime Duration */}
      <InfoCard
        title="Execution Duration"
        icon={<Clock3 className="h-4 w-4 text-cyan-400" />}
        badge={
          isLive ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Live
            </span>
          ) : null
        }
      >
        <div className="space-y-1">
          <p className="font-mono text-2xl font-bold text-white tracking-tight">
            {calculateDuration()}
          </p>
          <p className="text-[11px] text-zinc-500">
            {isLive ? "Elapsed time" : "Total wall-clock runtime"}
          </p>
        </div>
      </InfoCard>
    </div>
  );
};

export default RunCard;
