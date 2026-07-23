const Navbar = () => {
    return (
        <nav className="border-b border-zinc-800 bg-black">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

                <div className="flex items-center gap-3">

                    <h1 className="text-xl font-bold">
                        Open Source Agent
                    </h1>

                </div>

                <span className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-400">
                    Beta
                </span>

            </div>
        </nav>
    );
};

export default Navbar;