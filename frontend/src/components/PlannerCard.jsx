import { useState } from "react";
import {
  Brain,
  Target,
  FolderTree,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

export const PlannerCard = ({ analysis }) => {
  const [copiedFile, setCopiedFile] = useState("");

  if (!analysis) return null;

  const copyPath = async (path) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopiedFile(path);
      toast.success(`Copied path: ${path}`);
      setTimeout(() => setCopiedFile(""), 2000);
    } catch {
      toast.error("Failed to copy path");
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/90 px-5 sm:px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
          <Brain className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Planner Strategic Analysis
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            AI reasoning graph breakdown: root cause formulation and planned codebase mutations
          </p>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        {/* Summary */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
            <Target className="h-4 w-4" />
            <span>Problem Summary</span>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-4 text-xs sm:text-sm leading-relaxed text-zinc-300">
            {analysis.summary || "No problem summary available."}
          </div>
        </section>

        {/* Root Cause Hypothesis */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span>Root Cause Hypothesis</span>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4 text-xs sm:text-sm leading-relaxed text-zinc-200">
            {analysis.root_cause_hypothesis || "No root cause identified."}
          </div>
        </section>

        {/* Affected Files */}
        {analysis.likely_files_to_change?.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <FolderTree className="h-4 w-4" />
              <span>Target Files ({analysis.likely_files_to_change.length})</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {analysis.likely_files_to_change.map((file, index) => {
                const filePath = typeof file === "string" ? file : file.path;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 py-2.5 transition hover:border-zinc-700"
                  >
                    <span className="font-mono text-xs text-emerald-300/90 truncate mr-2">
                      {filePath}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyPath(filePath)}
                      className="text-zinc-500 hover:text-zinc-300 transition shrink-0 p-1 rounded"
                      title="Copy file path"
                    >
                      {copiedFile === filePath ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Implementation Plan */}
        {analysis.implementation_plan?.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Step-by-Step Implementation Strategy</span>
            </div>

            <div className="space-y-2.5">
              {analysis.implementation_plan.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3.5"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 font-mono text-xs font-bold text-cyan-400 border border-cyan-500/20 mt-0.5">
                    {index + 1}
                  </div>
                  <p className="flex-1 text-xs sm:text-sm text-zinc-300 leading-relaxed">
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
