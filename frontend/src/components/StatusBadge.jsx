import {
  Clock,
  Loader2,
  GitPullRequest,
  UserCheck,
  CheckCircle2,
  XCircle,
  Ban,
} from "lucide-react";

const statusConfig = {
  queued: {
    label: "Queued",
    icon: Clock,
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    dot: "bg-amber-400",
    pulse: false,
    spin: false,
  },
  running: {
    label: "Running",
    icon: Loader2,
    border: "border-indigo-500/30",
    bg: "bg-indigo-500/10",
    text: "text-indigo-300",
    dot: "bg-indigo-400",
    pulse: true,
    spin: true,
  },
  publishing: {
    label: "Drafting PR",
    icon: GitPullRequest,
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
    text: "text-cyan-300",
    dot: "bg-cyan-400",
    pulse: true,
    spin: false,
  },
  awaiting_approval: {
    label: "Awaiting Review",
    icon: UserCheck,
    border: "border-violet-500/30",
    bg: "bg-violet-500/10",
    text: "text-violet-300",
    dot: "bg-violet-400",
    pulse: true,
    spin: false,
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
    pulse: false,
    spin: false,
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    text: "text-red-300",
    dot: "bg-red-400",
    pulse: false,
    spin: false,
  },
  rejected: {
    label: "Rejected",
    icon: Ban,
    border: "border-rose-500/30",
    bg: "bg-rose-500/10",
    text: "text-rose-300",
    dot: "bg-rose-400",
    pulse: false,
    spin: false,
  },
};

export const StatusBadge = ({ status = "queued", size = "sm" }) => {
  const config = statusConfig[status] || statusConfig.queued;
  const Icon = config.icon;

  const sizeClasses = {
    xs: "px-2 py-0.5 text-[10px] gap-1",
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3 py-1.5 text-xs font-semibold gap-2",
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium uppercase tracking-wider select-none
        ${config.border} ${config.bg} ${config.text}
        ${sizeClasses[size] || sizeClasses.sm}
      `}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full shrink-0 ${config.dot} ${
          config.pulse ? "animate-pulse" : ""
        }`}
      />
      {Icon && (
        <Icon
          className={`h-3 w-3 shrink-0 ${config.spin ? "animate-spin" : ""}`}
        />
      )}
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
