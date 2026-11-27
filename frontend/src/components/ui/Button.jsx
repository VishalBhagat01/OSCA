import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary:
    "bg-ember text-ink hover:bg-ember-hi active:bg-ember-lo border-transparent",
  secondary:
    "bg-bone/8 text-bone hover:bg-bone/14 border-rule-strong",
  outline:
    "bg-transparent text-bone-2 hover:text-bone hover:border-bone-3 border-rule-strong",
  ghost:
    "bg-transparent text-bone-3 hover:text-bone hover:bg-bone/6 border-transparent",
  danger:
    "bg-madder text-ink hover:brightness-110 active:brightness-95 border-transparent",
};

const SIZES = {
  xs: "h-7 px-2.5 text-[11px] gap-1 rounded-md",
  sm: "h-9 px-3.5 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-[15px] gap-2.5 rounded-xl font-semibold",
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
}) => (
  <button
    disabled={disabled || loading}
    className={`inline-flex cursor-pointer items-center justify-center border font-medium whitespace-nowrap transition-[background-color,border-color,color,transform] duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-45 ${VARIANTS[variant] ?? VARIANTS.primary} ${SIZES[size] ?? SIZES.md} ${className}`}
    {...props}
  >
    {loading ? (
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
    ) : Icon ? (
      <Icon className="h-4 w-4" aria-hidden />
    ) : null}
    {children}
  </button>
);

export default Button;
