import { GitBranch, Hash, Clock, CalendarDays } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { formatDate } from "../utils/formatters";

const RunCard = ({ run }) => {
  if (!run) return null;

  const duration = run.completedAt && run.startedAt
    ? Math.round((new Date(run.completedAt) - new Date(run.startedAt)) / 1000)
    : null;

  const formatDuration = (sec) => {
    if (!sec) return "—";
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    return `${min}m ${s}s`;
  };

  return (
    <div className="rounded-2xl border border-white/6 bg-[#111111] p-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Repository */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium text-[#525250] uppercase tracking-wider">
            Repository
          </span>
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#E8E8E3] truncate">
            <GitBranch className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            <span className="truncate">{run.repository?.url || run.repoUrl}</span>
          </div>
        </div>

        {/* Issue */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium text-[#525250] uppercase tracking-wider">
            Issue
          </span>
          <div className="flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            <span className="font-mono text-[13px] font-semibold text-[#E8E8E3]">
              {run.issue?.number || run.issueNumber}
            </span>
          </div>
          {run.issue?.title && (
            <p className="text-[11px] text-[#737370] truncate">{run.issue.title}</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium text-[#525250] uppercase tracking-wider">
            Status
          </span>
          <StatusBadge status={run.status} />
        </div>

        {/* Duration / Created */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium text-[#525250] uppercase tracking-wider">
            {duration ? "Duration" : "Created"}
          </span>
          <div className="flex items-center gap-1.5 text-[13px] text-[#A8A8A0]">
            {duration ? (
              <>
                <Clock className="h-3.5 w-3.5 text-[#525250]" />
                <span className="font-mono">{formatDuration(duration)}</span>
              </>
            ) : (
              <>
                <CalendarDays className="h-3.5 w-3.5 text-[#525250]" />
                <span className="font-mono text-xs">{formatDate(run.createdAt)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunCard;
