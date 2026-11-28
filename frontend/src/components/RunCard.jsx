import StatusBadge from "./StatusBadge";
import { formatDate } from "../utils/formatters";

const formatDuration = (sec) => {
  if (!sec) return "n/a";
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
};

const RunCard = ({ run }) => {
  if (!run) return null;

  const duration =
    run.completedAt && run.startedAt
      ? Math.round((new Date(run.completedAt) - new Date(run.startedAt)) / 1000)
      : null;

  const cells = [
    { label: "Issue", value: <span className="font-mono tabular-nums">#{run.issue?.number || run.issueNumber}</span> },
    { label: "Status", value: <StatusBadge status={run.status} /> },
    { label: duration ? "Duration" : "Created", value: <span className="font-mono tabular-nums">{duration ? formatDuration(duration) : formatDate(run.createdAt)}</span> },
    { label: "Retries", value: <span className="font-mono tabular-nums">{run.result?.proposed_patch?.retry_count ?? 0}</span> },
  ];

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-rule bg-rule sm:grid-cols-4">
      {cells.map((c) => (
        <div key={c.label} className="space-y-2 bg-ink-2 px-5 py-4">
          <dt className="eyebrow">{c.label}</dt>
          <dd className="text-[15px] text-bone">{c.value}</dd>
        </div>
      ))}
    </dl>
  );
};

export default RunCard;
