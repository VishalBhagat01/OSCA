const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-white/5 text-[#A8A8A0] border-white/8",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${variants[variant] || variants.default} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
