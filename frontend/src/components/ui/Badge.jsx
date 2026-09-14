const variants = {
  default: "border-zinc-800 bg-zinc-900/80 text-zinc-300",
  primary: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  danger: "border-red-500/30 bg-red-500/10 text-red-300",
  cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  muted: "border-zinc-800/60 bg-zinc-950/60 text-zinc-500",
};

const dotColors = {
  default: "bg-zinc-400",
  primary: "bg-indigo-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
  cyan: "bg-cyan-400",
  violet: "bg-violet-400",
  muted: "bg-zinc-600",
};

export const Badge = ({
  children,
  variant = "default",
  dot = false,
  pulse = false,
  icon: Icon,
  className = "",
}) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5
        text-xs font-medium tracking-wide transition-colors
        ${variants[variant] || variants.default}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotColors[variant] || "bg-zinc-400"} ${
            pulse ? "animate-pulse" : ""
          }`}
        />
      )}
      {Icon && <Icon className="h-3 w-3 shrink-0" />}
      {children}
    </span>
  );
};

export default Badge;
