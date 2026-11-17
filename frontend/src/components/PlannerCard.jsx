import { Brain, ListChecks, FileCode, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const PlannerCard = ({ analysis }) => {
  const [expanded, setExpanded] = useState(false);

  if (!analysis || Object.keys(analysis).length === 0) return null;

  const { root_cause, approach, affected_files, plan_steps, complexity } = analysis;

  return (
    <div className="rounded-2xl border border-white/6 bg-[#111111] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/2 transition"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/15">
            <Brain className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#E8E8E3]">Planner Analysis</h3>
            {complexity && (
              <span className="text-[11px] text-[#525250]">
                Complexity: {complexity}
              </span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[#525250]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#525250]" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-white/6 p-5 space-y-5">
          {/* Root Cause */}
          {root_cause && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#A8A8A0] uppercase tracking-wider">
                Root Cause
              </h4>
              <p className="text-[13px] text-[#A8A8A0] leading-relaxed bg-white/3 rounded-xl p-3 border border-white/4">
                {root_cause}
              </p>
            </div>
          )}

          {/* Approach */}
          {approach && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#A8A8A0] uppercase tracking-wider">
                Approach
              </h4>
              <p className="text-[13px] text-[#A8A8A0] leading-relaxed bg-white/3 rounded-xl p-3 border border-white/4">
                {approach}
              </p>
            </div>
          )}

          {/* Affected Files */}
          {affected_files && affected_files.length > 0 && (
            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-[#A8A8A0] uppercase tracking-wider">
                <FileCode className="h-3.5 w-3.5 text-orange-500" />
                Affected Files
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {affected_files.map((file, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-white/4 border border-white/6 px-2.5 py-1 font-mono text-[11px] text-[#A8A8A0]"
                  >
                    {file}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Plan Steps */}
          {plan_steps && plan_steps.length > 0 && (
            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-[#A8A8A0] uppercase tracking-wider">
                <ListChecks className="h-3.5 w-3.5 text-orange-500" />
                Execution Steps
              </h4>
              <ol className="space-y-1.5 pl-4 list-decimal marker:text-[#525250]">
                {plan_steps.map((step, i) => (
                  <li
                    key={i}
                    className="text-[13px] text-[#A8A8A0] leading-relaxed pl-1"
                  >
                    {typeof step === "string" ? step : step.description || JSON.stringify(step)}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlannerCard;
