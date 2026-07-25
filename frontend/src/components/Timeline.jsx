import {
    CheckCircle2,
    XCircle,
    LoaderCircle,
    Clock3,
    Activity,
} from "lucide-react";

const statusConfig = {
    success: {
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
    },

    failed: {
        icon: <XCircle className="h-5 w-5 text-red-400" />,
        bg: "bg-red-500/10",
        border: "border-red-500/20",
    },

    running: {
        icon: (
            <LoaderCircle className="h-5 w-5 animate-spin text-violet-400" />
        ),
        bg: "bg-violet-500/10",
        border: "border-violet-500/30",
    },

    pending: {
        icon: <Clock3 className="h-5 w-5 text-amber-400" />,
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
    },
};

const formatNode = (node) =>
    node
        ?.replaceAll("_", " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

const Timeline = ({ trace = [], isRunning = false }) => {
    return (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 py-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-white">
                            Execution Timeline
                        </h2>
                        {isRunning && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-300 animate-pulse">
                                <Activity className="h-3 w-3" />
                                Live Streaming
                            </span>
                        )}
                    </div>

                    <p className="mt-1 text-sm text-zinc-400">
                        Real-time step-by-step execution trace of the agent graph workflow
                    </p>
                </div>

                <div className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-mono text-zinc-400 border border-zinc-800">
                    {trace.length} {trace.length === 1 ? "Event" : "Events"}
                </div>
            </div>

            <div className="p-6">
                {trace.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
                        <Clock3 className="h-8 w-8 text-zinc-700 mb-2" />
                        <p>No execution trace recorded yet.</p>
                        {isRunning && (
                            <p className="text-xs text-violet-400 mt-1 animate-pulse">
                                Initializing agent workflow...
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="relative">
                        {trace.map((step, index) => {
                            const isLatest = index === trace.length - 1;
                            const config =
                                statusConfig[step.status] ||
                                statusConfig.pending;

                            return (
                                <div
                                    key={index}
                                    className={`relative flex gap-5 pb-8 last:pb-0 transition-all ${
                                        isLatest && isRunning ? "opacity-100" : ""
                                    }`}
                                >
                                    {/* Vertical Line */}
                                    {index !== trace.length - 1 && (
                                        <div className="absolute left-5 top-10 h-full w-px bg-zinc-800" />
                                    )}

                                    {/* Status Icon */}
                                    <div
                                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${config.bg} ${config.border} ${
                                            isLatest && isRunning ? "ring-2 ring-violet-500/40" : ""
                                        }`}
                                    >
                                        {config.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 transition hover:border-zinc-700">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-white">
                                                    {formatNode(step.node)}
                                                </h3>
                                                {isLatest && isRunning && (
                                                    <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-bold text-violet-300 uppercase">
                                                        Active
                                                    </span>
                                                )}
                                            </div>

                                            {step.timestamp && (
                                                <span className="text-xs font-mono text-zinc-500">
                                                    {new Date(
                                                        step.timestamp
                                                    ).toLocaleTimeString()}
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-2 text-sm leading-6 text-zinc-300">
                                            {step.message}
                                        </p>

                                        {step.details &&
                                            Object.keys(step.details).length > 0 && (
                                                <div className="mt-3 rounded-lg border border-zinc-800/60 bg-black/80 p-3">
                                                    <pre className="overflow-auto text-xs text-zinc-400 font-mono">
                                                        {JSON.stringify(
                                                            step.details,
                                                            null,
                                                            2
                                                        )}
                                                    </pre>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Timeline;