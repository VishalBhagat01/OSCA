import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary:
    "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 border-orange-600/50 shadow-sm",
  secondary:
    "bg-white/6 text-[#E8E8E3] hover:bg-white/10 border-white/8",
  outline:
    "bg-transparent text-[#A8A8A0] hover:bg-white/4 hover:text-[#E8E8E3] border-white/10",
  ghost:
    "bg-transparent text-[#737370] hover:bg-white/4 hover:text-[#A8A8A0] border-transparent",
  danger:
    "bg-red-600 text-white hover:bg-red-700 border-red-700/50 shadow-sm",
};

const SIZES = {
  xs: "px-2 py-1 text-[11px] rounded-lg gap-1",
  sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
  md: "px-4 py-2 text-sm rounded-xl gap-2",
  lg: "px-5 py-3 text-sm rounded-xl gap-2 font-semibold",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  className = "",
  ...props
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center border font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : Icon ? (
        <Icon className="h-4 w-4" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
