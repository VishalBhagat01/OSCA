import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock3,
  Activity,
  Terminal,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatNodeName as formatNode } from "../utils/formatters";

const statusConfig = {
  success: {
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  failed: {
    icon: <XCircle className="h-4 w-4 text-rose-400" />,
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
  running: {
    icon: <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />,
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
  },
  pending: {
    icon: <Clock3 className="h-4 w-4 text-amber-400" />,
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
};

export const Timeline = ({ trace = [], isRunning = false }) => {
  const [expandedIndices, setExpandedIndices] = useState(new Set());
  const [copiedIndex, setCopiedIndex] = useState(null);

  const toggleExpand = (idx) => {
    setExpandedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const copyDetails = async (details, idx) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(details, null, 2));
      setCopiedIndex(idx);
      toast.success("Event details copied to clipboard");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error("Failed to copy details");
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800 bg-zinc-950/90 px-5 sm:px-6 py-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Execution Trace Graph
            </h2>
            {isRunning && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 animate-pulse">
                <Activity className="h-3 w-3" />
                Live Graph
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Chronological step-by-step telemetry of the LangGraph execution pipeline
          </p>
        </div>

        <div className="rounded-lg bg-zinc-900 px-3 py-1 font-mono text-xs text-zinc-400 border border-zinc-800 self-start sm:self-auto">
          {trace.length} {trace.length === 1 ? "Event" : "Events"}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {trace.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500 space-y-2">
            <Clock3 className="h-8 w-8 text-zinc-700" />
            <p className="text-sm">No execution trace recorded yet.</p>
            {isRunning && (
              <p className="text-xs text-indigo-400 animate-pulse font-mono">
                Initializing agent workflow...
              </p>
            )}
          </div>
        ) : (
          <div className="relative">
            {trace.map((step, index) => {
              const isLatest = index === trace.length - 1;
              const config =
                statusConfig[step.status] || statusConfig.pending;
              const hasDetails =
                step.details && Object.keys(step.details).length > 0;
              const isExpanded = expandedIndices.has(index);

              return (
                <div
                  key={index}
                  className="relative flex gap-4 pb-6 last:pb-0"
                >
                  {/* Connecting Line */}
                  {index !== trace.length - 1 && (
                    <div className="absolute left-4 top-8 h-full w-px bg-zinc-800/80" />
                  )}

                  {/* Status Node Icon */}
                  <div
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                      config.bg
                    } ${config.border} ${
                      isLatest && isRunning
                        ? "ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-950/50"
                        : ""
                    }`}
                  >
                    {config.icon}
                  </div>

                  {/* Card Content */}
                  <div
                    className={`flex-1 rounded-xl border p-4 transition-all ${
                      isLatest && isRunning
                        ? "border-indigo-500/40 bg-zinc-900/90 shadow-md"
                        : "border-zinc-800/90 bg-zinc-950/60 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-white">
                          {formatNode(step.node)}
                        </span>
                        {isLatest && isRunning && (
                          <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>

                      {step.timestamp && (
                        <span className="font-mono text-[11px] text-zinc-500">
                          {new Date(step.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                      {step.message}
                    </p>

                    {/* Expandable Details Payload */}
                    {hasDetails && (
                      <div className="mt-3 pt-2.5 border-t border-zinc-800/60">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => toggleExpand(index)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-indigo-300 transition"
                          >
                            <Terminal className="h-3 w-3" />
                            <span>{isExpanded ? "Hide Details" : "View Node Payload"}</span>
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>

                          {isExpanded && (
                            <button
                              type="button"
                              onClick={() => copyDetails(step.details, index)}
                              className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-white transition"
                              title="Copy JSON details"
                            >
                              {copiedIndex === index ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {isExpanded && (
                          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-[#070709] p-3 font-mono text-[11px] text-zinc-300 border border-zinc-800/80 leading-relaxed">
                            {JSON.stringify(step.details, null, 2)}
                          </pre>
                        )}
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