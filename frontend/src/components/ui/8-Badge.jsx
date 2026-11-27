const VARIANTS = {
  default: "text-bone-2 border-rule-strong",
  ember: "text-ember border-ember/40",
  verdigris: "text-verdigris border-verdigris/40",
  madder: "text-madder border-madder/40",
  saffron: "text-saffron border-saffron/40",
};

const Badge = ({ children, variant = "default", className = "" }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.08em] uppercase ${VARIANTS[variant] ?? VARIANTS.default} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
