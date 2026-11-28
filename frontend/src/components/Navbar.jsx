import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, ArrowUpRight } from "lucide-react";
import Sigil from "./Sigil";

const REPO_URL = "https://github.com/VishalBhagat01/OSCA";

const LINKS = [
  { to: "/", label: "New run", end: true },
  { to: "/history", label: "History" },
];

const linkClass = ({ isActive }) =>
  `relative py-1 text-[13px] font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-[19px] after:h-px after:origin-left after:bg-ember after:transition-transform after:duration-300 ${
    isActive
      ? "text-bone after:scale-x-100"
      : "text-bone-3 after:scale-x-0 hover:text-bone"
  }`;

export const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-ink/80 backdrop-blur-xl">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-5 sm:px-8"
      >
        <div className="flex items-center gap-10">
          <Link to="/" className="group flex items-center gap-2.5 text-bone-2">
            <Sigil className="h-7 w-7 transition-transform duration-700 ease-out group-hover:rotate-90" />
            <span className="font-display text-[22px] leading-none tracking-tight text-bone">
              Sentra
            </span>
            <span className="eyebrow mt-1 hidden border-l border-rule-strong pl-2.5 sm:inline">
              OSCA
            </span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-6 sm:flex">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-1 text-[13px] text-bone-3 transition-colors hover:text-bone"
          >
            Source
            <ArrowUpRight className="link-arrow h-3.5 w-3.5" aria-hidden />
          </a>
          <span className="flex items-center gap-2 border-l border-rule pl-6">
            <span className="h-1.5 w-1.5 rounded-full bg-verdigris" />
            <span className="eyebrow">Engine ready</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="cursor-pointer rounded-lg border border-rule-strong p-2 text-bone-2 transition hover:text-bone md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-rule bg-ink px-5 py-4 md:hidden">
          <div className="flex flex-col">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `border-b border-rule py-3 font-display text-xl ${
                    isActive ? "text-ember" : "text-bone"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="py-3 font-display text-xl text-bone-2"
            >
              Source
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
