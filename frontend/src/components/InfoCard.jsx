export const InfoCard = ({
  title,
  icon,
  badge,
  children,
  footer,
  className = "",
}) => {
  return (
    <div
      className={`
        rounded-2xl border border-zinc-800/90
        bg-gradient-to-b from-zinc-900/90 to-zinc-950/90
        p-5 sm:p-6 shadow-xl backdrop-blur-md transition-all duration-200
        hover:border-zinc-700/80
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-300 border border-zinc-700/40">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {title}
            </h3>
          </div>
        </div>

        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      {/* Content */}
      <div className="mt-4">{children}</div>

      {/* Footer */}
      {footer && (
        <div className="mt-4 border-t border-zinc-800/80 pt-3 text-xs text-zinc-500">
          {footer}
        </div>
      )}
    </div>
  );
};

export default InfoCard;