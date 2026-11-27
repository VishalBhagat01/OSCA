/**
 * The Sentra mark: a sentinel eye drawn as an orbit with one lit arc.
 * Decorative by default; pass `title` when it stands alone.
 */
const Sigil = ({ className = "h-7 w-7", title }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    className={className}
    role={title ? "img" : undefined}
    aria-label={title}
    aria-hidden={title ? undefined : true}
  >
    <circle cx="16" cy="16" r="12" stroke="currentColor" strokeOpacity=".3" strokeWidth="1" />
    <circle cx="16" cy="16" r="7.5" stroke="currentColor" strokeOpacity=".3" strokeWidth="1" />
    <path
      d="M4 16A12 12 0 0 1 16 4"
      stroke="var(--color-ember)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="16" cy="16" r="2.6" fill="var(--color-ember)" />
  </svg>
);

export default Sigil;
