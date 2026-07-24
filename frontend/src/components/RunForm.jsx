const RunForm = ({
    repoUrl,
    setRepoUrl,
    issueNumber,
    setIssueNumber,
    loading,
    onSubmit,
}) => {
    return (
        <div className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">

            <div className="mb-8">

                <h2 className="text-3xl font-bold text-white">
                    Analyze GitHub Issue
                </h2>

                <p className="mt-2 text-zinc-400">
                    Enter a GitHub repository and an issue number to let the
                    Open Source Agent analyze, generate a patch, validate it,
                    and run tests automatically.
                </p>

            </div>

            <div className="space-y-6">

                {/* Repository */}

                <div>

                    <label className="mb-2 block text-sm font-medium text-zinc-300">
                        Repository URL
                    </label>

                    <input
                        type="text"
                        disabled={loading}
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        placeholder="https://github.com/owner/repository"
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />

                </div>

                {/* Issue */}

                <div>

                    <label className="mb-2 block text-sm font-medium text-zinc-300">
                        Issue Number
                    </label>

                    <input
                        type="number"
                        disabled={loading}
                        value={issueNumber}
                        onChange={(e) => setIssueNumber(e.target.value)}
                        placeholder="1"
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />

                </div>

                {/* Button */}

                <button
                    disabled={loading}
                    onClick={onSubmit}
                    className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? "Analyzing..." : "Analyze Repository"}
                </button>

            </div>

        </div>
    );
};

export default RunForm;