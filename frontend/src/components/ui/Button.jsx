import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

const variants = {
  primary:
    "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-950/50 border border-indigo-500/30 active:bg-indigo-700",
  secondary:
    "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 active:bg-zinc-900",
  outline:
    "bg-transparent hover:bg-zinc-800/60 text-zinc-300 border border-zinc-800 hover:border-zinc-700 active:bg-zinc-900",
  danger:
    "bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-800/50 active:bg-red-950",
  success:
    "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-950/50 border border-emerald-500/30 active:bg-emerald-700",
  ghost:
    "bg-transparent hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 border-transparent",
};

const sizes = {
  xs: "px-2.5 py-1 text-xs gap-1.5 rounded-md",
  sm: "px-3 py-1.5 text-xs font-medium gap-1.5 rounded-lg",
  md: "px-4 py-2 text-sm font-medium gap-2 rounded-xl",
  lg: "px-5 py-2.5 text-base font-semibold gap-2.5 rounded-xl",
};

export const Button = forwardRef(
  (
    {
      children,
      variant = "secondary",
      size = "md",
      loading = false,
      disabled = false,
      icon: Icon,
      className = "",
      type = "button",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center font-medium transition-all duration-150 select-none
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950
          disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none
          ${variants[variant] || variants.secondary}
          ${sizes[size] || sizes.md}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : Icon ? (
          <Icon className="h-4 w-4 shrink-0" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
