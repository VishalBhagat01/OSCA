const STATUS_CONFIG = {
  queued: { label: "Queued", tone: "text-saffron", dot: "bg-saffron" },
  running: { label: "Running", tone: "text-ember", dot: "bg-ember", live: true },
  awaiting_approval: { label: "Needs review", tone: "text-saffron", dot: "bg-saffron" },
  publishing: { label: "Publishing", tone: "text-ember", dot: "bg-ember", live: true },
  completed: { label: "Completed", tone: "text-verdigris", dot: "bg-verdigris" },
  failed: { label: "Failed", tone: "text-madder", dot: "bg-madder" },
  rejected: { label: "Rejected", tone: "text-madder", dot: "bg-madder" },
};

const StatusBadge = ({ status, size = "sm" }) => {
  const config = STATUS_CONFIG[status] ?? {
    label: status || "Unknown",
    tone: "text-bone-3",
    dot: "bg-bone-3",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 font-mono font-medium tracking-[0.1em] uppercase ${config.tone} ${
        size === "xs" ? "text-[10px]" : "text-[11px]"
      }`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {config.live && (
          <span
            className={`absolute inset-0 rounded-full ${config.dot}`}
            style={{ animation: "pulse-ring 1.8s ease-out infinite" }}
          />
        )}
        <span className={`relative h-1.5 w-1.5 rounded-full ${config.dot}`} />
      </span>
      {config.label}
    </span>
  );
};

export default StatusBadge;
