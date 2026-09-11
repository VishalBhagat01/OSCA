import {
    Brain,
    Target,
    FolderTree,
    CheckCircle2,
    AlertTriangle,
} from "lucide-react";

const PlannerCard = ({ analysis }) => {
    if (!analysis) return null;

    return (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg">

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-950 px-6 py-4">

                <div className="rounded-lg bg-violet-500/10 p-2">
                    <Brain className="h-5 w-5 text-violet-400" />
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-white">
                        Planner Analysis
                    </h2>

                    <p className="text-sm text-zinc-500">
                        AI-generated implementation strategy
                    </p>
                </div>

            </div>

            <div className="space-y-8 p-6">

                {/* Summary */}
                <section>

                    <div className="mb-3 flex items-center gap-2">

                        <Target className="h-5 w-5 text-blue-400" />

                        <h3 className="text-lg font-semibold text-white">
                            Summary
                        </h3>

                    </div>

                    <p className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 leading-7 text-zinc-300">
                        {analysis.summary || "No summary available."}
                    </p>

                </section>

                {/* Root Cause */}
                <section>

                    <div className="mb-3 flex items-center gap-2">

                        <AlertTriangle className="h-5 w-5 text-amber-400" />

                        <h3 className="text-lg font-semibold text-white">
                            Root Cause Analysis
                        </h3>

                    </div>

                    <p className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 leading-7 text-zinc-300">
                        {analysis.root_cause_hypothesis ||
                            "No root cause identified."}
                    </p>

                </section>

                {/* Files */}
                {analysis.likely_files_to_change?.length > 0 && (

                    <section>

                        <div className="mb-3 flex items-center gap-2">

                            <FolderTree className="h-5 w-5 text-green-400" />

                            <h3 className="text-lg font-semibold text-white">
                                Affected Files
                            </h3>

                        </div>

                        <div className="space-y-2">

                            {analysis.likely_files_to_change.map((file, index) => (

                                <div
                                    key={index}
                                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-sm text-green-400"
                                >
                                    {typeof file === "string" ? file : file.path}
                                </div>

                            ))}

                        </div>

                    </section>

                )}

                {/* Plan */}
                {analysis.implementation_plan?.length > 0 && (

                    <section>

                        <div className="mb-3 flex items-center gap-2">

                            <CheckCircle2 className="h-5 w-5 text-cyan-400" />

                            <h3 className="text-lg font-semibold text-white">
                                Implementation Plan
                            </h3>

                        </div>

                        <div className="space-y-3">

                            {analysis.implementation_plan.map((step, index) => (

                                <div
                                    key={index}
                                    className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10 text-sm font-bold text-cyan-400">
                                        {index + 1}
                                    </div>

                                    <p className="flex-1 leading-7 text-zinc-300">
                                        {step}
                                    </p>

                                </div>

                            ))}

                        </div>

                    </section>

                )}

            </div>

        </div>
    );
};

export default PlannerCard;
