import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { GitBranch, History, PlusCircle, Menu, X, Sparkles } from "lucide-react";

const GitHubIcon = ({ className = "h-3.5 w-3.5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 group transition-transform active:scale-98"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-950/40 border border-indigo-400/20 group-hover:border-indigo-400/40 transition">
              <GitBranch className="h-5 w-5" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold tracking-tight text-white sm:text-lg">
                Sentra AI
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                <Sparkles className="h-2.5 w-2.5" />
                Developer
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 pl-4 border-l border-zinc-800/80">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60"
                    : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                }`
              }
            >
              <PlusCircle className="h-3.5 w-3.5 text-indigo-400" />
              New Run
            </NavLink>

            <NavLink
              to="/history"
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60"
                    : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                }`
              }
            >
              <History className="h-3.5 w-3.5 text-zinc-400" />
              Execution History
            </NavLink>
          </div>
        </div>

        {/* Right side actions */}
        <div className="hidden sm:flex items-center gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:border-zinc-700 hover:text-white transition"
          >
            <GitHubIcon className="h-3.5 w-3.5" />
            <span>GitHub</span>
          </a>

          <div className="flex items-center gap-2 pl-3 border-l border-zinc-800/80 text-xs text-zinc-400">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="font-mono text-[11px] text-zinc-400">Agent v2.4</span>
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer / dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-800 bg-zinc-950/95 px-4 py-4 space-y-2 backdrop-blur-xl animate-in fade-in-0 duration-150">
          <NavLink
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/20"
                  : "text-zinc-300 hover:bg-zinc-900"
              }`
            }
          >
            <PlusCircle className="h-4 w-4 text-indigo-400" />
            New Run
          </NavLink>

          <NavLink
            to="/history"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/20"
                  : "text-zinc-300 hover:bg-zinc-900"
              }`
            }
          >
            <History className="h-4 w-4 text-zinc-400" />
            Execution History
          </NavLink>

          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Engine Online
            </span>
            <span className="font-mono text-[11px] text-zinc-500">v2.4 Production</span>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;