import {
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
  AlertTriangle,
  Send,
  UserCheck,
} from "lucide-react";

const STATUS_CONFIG = {
  queued: {
    label: "Queued",
    icon: Clock,
    classes: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  running: {
    label: "Running",
    icon: Loader2,
    classes: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    animate: true,
  },
  awaiting_approval: {
    label: "Awaiting Review",
    icon: UserCheck,
    classes: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  publishing: {
    label: "Publishing",
    icon: Send,
    classes: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    animate: true,
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    classes: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  rejected: {
    label: "Rejected",
    icon: AlertTriangle,
    classes: "bg-red-500/10 text-red-300 border-red-500/15",
  },
};

const StatusBadge = ({ status, size = "sm" }) => {
  const config = STATUS_CONFIG[status] || {
    label: status || "Unknown",
    icon: Clock,
    classes: "bg-white/5 text-[#737370] border-white/8",
  };

  const Icon = config.icon;
  const sizeClasses =
    size === "xs" ? "px-1.5 py-0.5 text-[10px] gap-1" : "px-2 py-0.5 text-[11px] gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.classes} ${sizeClasses}`}
    >
      <Icon
        className={`${size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3"} ${
          config.animate ? "animate-spin" : ""
        }`}
      />
      {config.label}
    </span>
  );
};

export default StatusBadge;
