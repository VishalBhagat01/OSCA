import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Shared frame for every run section: eyebrow, serif title, optional meta line
 * and actions. When `collapsible`, the header becomes a disclosure button.
 */
const Panel = ({
  eyebrow,
  title,
  meta,
  actions,
  collapsible = false,
  defaultOpen = true,
  tone = "default",
  className = "",
  bodyClassName = "p-6",
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();
  const shown = !collapsible || open;

  const heading = (
    <div className="min-w-0 space-y-1.5 text-left">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h3 className="font-display text-2xl leading-tight font-light text-bone">{title}</h3>
      {meta && <div className="text-[13px] text-bone-3">{meta}</div>}
    </div>
  );

  return (
    <section
      className={`overflow-hidden rounded-2xl border ${
        tone === "ember" ? "border-ember/30 bg-ember/[0.04]" : "border-rule bg-ink-2"
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-4 p-6">
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={bodyId}
            className="flex min-w-0 flex-1 cursor-pointer items-start justify-between gap-4"
          >
            {heading}
            <ChevronDown
              className={`mt-1 h-4 w-4 shrink-0 text-bone-3 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
        ) : (
          heading
        )}
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      {shown && (
        <div id={bodyId} className={`border-t border-rule ${bodyClassName}`}>
          {children}
        </div>
      )}
    </section>
  );
};

export default Panel;
