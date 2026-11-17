import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { History, PlusCircle, Menu, X } from "lucide-react";

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
    <nav className="sticky top-0 z-40 border-b border-white/6 bg-[#0A0A0A]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 group transition-transform active:scale-98"
          >
            {/* YC-style orange square logo */}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white font-bold text-sm shadow-md shadow-orange-950/30 group-hover:shadow-orange-500/20 transition-shadow">
              S
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-semibold tracking-tight text-[#E8E8E3]">
                Sentra AI
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full border border-orange-500/20 bg-orange-500/8 px-2 py-0.5 text-[10px] font-medium text-orange-400">
                v2.4
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-0.5 pl-5 border-l border-white/6">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-white/8 text-[#E8E8E3]"
                    : "text-[#737370] hover:bg-white/4 hover:text-[#A8A8A0]"
                }`
              }
            >
              <PlusCircle className="h-3.5 w-3.5" />
              New Run
            </NavLink>

            <NavLink
              to="/history"
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-white/8 text-[#E8E8E3]"
                    : "text-[#737370] hover:bg-white/4 hover:text-[#A8A8A0]"
                }`
              }
            >
              <History className="h-3.5 w-3.5" />
              History
            </NavLink>
          </div>
        </div>

        {/* Right side actions */}
        <div className="hidden sm:flex items-center gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/8 px-2.5 py-1.5 text-xs font-medium text-[#737370] hover:border-white/12 hover:text-[#A8A8A0] transition"
          >
            <GitHubIcon className="h-3.5 w-3.5" />
            <span>GitHub</span>
          </a>

          <div className="flex items-center gap-2 pl-3 border-l border-white/6 text-xs text-[#525250]">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="font-mono text-[11px]">Online</span>
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-white/8 p-2 text-[#737370] hover:text-[#E8E8E3] focus:outline-none focus:ring-2 focus:ring-orange-500"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/6 bg-[#0A0A0A]/95 px-4 py-4 space-y-2 backdrop-blur-xl">
          <NavLink
            to="/"
            end
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                  : "text-[#A8A8A0] hover:bg-white/4"
              }`
            }
          >
            <PlusCircle className="h-4 w-4" />
            New Run
          </NavLink>

          <NavLink
            to="/history"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                  : "text-[#A8A8A0] hover:bg-white/4"
              }`
            }
          >
            <History className="h-4 w-4" />
            History
          </NavLink>

          <div className="pt-2 border-t border-white/6 flex items-center justify-between text-xs text-[#525250]">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Engine Online
            </span>
            <span className="font-mono text-[11px]">v2.4</span>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;