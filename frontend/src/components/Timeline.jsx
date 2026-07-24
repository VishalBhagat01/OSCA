import {
    CheckCircle2,
    XCircle,
    LoaderCircle,
    Clock3,
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
            <LoaderCircle className="h-5 w-5 animate-spin text-blue-400" />
        ),
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
    },

    pending: {
        icon: <Clock3 className="h-5 w-5 text-yellow-400" />,
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
    },
};

const formatNode = (node) =>
    node
        ?.replaceAll("_", " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

const Timeline = ({ trace = [] }) => {
    return (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg">

            {/* Header */}

            <div className="border-b border-zinc-800 bg-zinc-950 px-6 py-4">

                <h2 className="text-lg font-semibold text-white">
                    Execution Timeline
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                    Live execution of the Open Source Agent workflow
                </p>

            </div>

            <div className="p-6">

                {trace.length === 0 ? (
                    <p className="text-center text-zinc-500">
                        No execution data available.
                    </p>
                ) : (
                    <div className="relative">

                        {trace.map((step, index) => {
                            const config =
                                statusConfig[step.status] ||
                                statusConfig.pending;

                            return (
                                <div
                                    key={index}
                                    className="relative flex gap-5 pb-8 last:pb-0"
                                >

                                    {/* Vertical Line */}

                                    {index !== trace.length - 1 && (
                                        <div className="absolute left-5 top-10 h-full w-px bg-zinc-700" />
                                    )}

                                    {/* Status Icon */}

                                    <div
                                        className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border ${config.bg} ${config.border}`}
                                    >
                                        {config.icon}
                                    </div>

                                    {/* Content */}

                                    <div className="flex-1">

                                        <div className="flex items-center justify-between">

                                            <h3 className="font-semibold text-white">
                                                {formatNode(step.node)}
                                            </h3>

                                            {step.timestamp && (
                                                <span className="text-xs text-zinc-500">
                                                    {new Date(
                                                        step.timestamp
                                                    ).toLocaleTimeString()}
                                                </span>
                                            )}

                                        </div>

                                        <p className="mt-2 text-sm leading-6 text-zinc-400">
                                            {step.message}
                                        </p>

                                        {step.details &&
                                            Object.keys(step.details).length >
                                                0 && (
                                                <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3">

                                                    <pre className="overflow-auto text-xs text-zinc-400">
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