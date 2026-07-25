import { Link, NavLink } from "react-router-dom";
import { GitBranch } from "lucide-react";

const Navbar = () => {
    return (
        <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

                {/* Logo */}
                <Link
                    to="/"
                    className="flex items-center gap-3"
                >
                    <GitBranch className="h-6 w-6 text-blue-500" />

                    <h1 className="text-lg font-bold text-white sm:text-xl" style={{ fontFamily: "Satoshi, sans-serif" }}>
                        Sentra AI
                    </h1>
                </Link>

                {/* Navigation */}
                <div className="hidden items-center gap-6 md:flex">

                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            isActive
                                ? "text-white font-semibold"
                                : "text-zinc-400 hover:text-white transition"
                        }
                    >
                        Home
                    </NavLink>

                    <NavLink
                        to="/history"
                        className={({ isActive }) =>
                            isActive
                                ? "text-white font-semibold"
                                : "text-zinc-400 hover:text-white transition"
                        }
                    >
                        History
                    </NavLink>

                </div>

            </div>
        </nav>
    );
};

export default Navbar;