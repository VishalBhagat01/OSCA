import { Copy, FileCode2 } from "lucide-react";

const PatchCard = ({ diff }) => {
    if (!diff) return null;

    const added = diff
        .split("\n")
        .filter((line) => line.startsWith("+") && !line.startsWith("+++")).length;

    const removed = diff
        .split("\n")
        .filter((line) => line.startsWith("-") && !line.startsWith("---")).length;

    const copyPatch = async () => {
        await navigator.clipboard.writeText(diff);
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 py-4">

                <div className="flex items-center gap-3">

                    <div className="rounded-lg bg-blue-500/10 p-2">
                        <FileCode2 className="h-5 w-5 text-blue-400" />
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            Generated Patch
                        </h2>

                        <p className="text-sm text-zinc-500">
                            Unified Diff
                        </p>
                    </div>

                </div>

                <div className="flex items-center gap-3">

                    <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                        +{added}
                    </span>

                    <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
                        -{removed}
                    </span>

                    <button
                        onClick={copyPatch}
                        className="rounded-lg border border-zinc-700 p-2 transition hover:border-blue-500 hover:bg-zinc-800"
                    >
                        <Copy className="h-4 w-4 text-zinc-300" />
                    </button>

                </div>

            </div>

            {/* Code */}
            <div className="max-h-[500px] overflow-auto bg-[#0d1117] p-5">

                <pre className="font-mono text-sm leading-7 text-zinc-200 whitespace-pre-wrap">
                    {diff.split("\n").map((line, index) => {

                        let color = "text-zinc-300";

                        if (
                            line.startsWith("+") &&
                            !line.startsWith("+++")
                        )
                            color = "text-green-400";

                        if (
                            line.startsWith("-") &&
                            !line.startsWith("---")
                        )
                            color = "text-red-400";

                        if (line.startsWith("@@"))
                            color = "text-yellow-400";

                        return (
                            <div
                                key={index}
                                className={`${color} hover:bg-zinc-800/40 px-2 rounded`}
                            >
                                {line}
                            </div>
                        );
                    })}
                </pre>

            </div>

        </div>
    );
};

export default PatchCard;