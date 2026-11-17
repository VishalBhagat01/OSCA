import { CheckCircle2, XCircle, ShieldCheck, AlertTriangle, FlaskConical, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const TestResultsCard = ({ proposedPatch }) => {
  const [expanded, setExpanded] = useState(false);

  if (!proposedPatch) return null;

  const {
    tests_passed,
    test_result,
    acceptance_passed,
    acceptance_violations,
    retry_count,
  } = proposedPatch;

  const hasTestData = test_result && Object.keys(test_result).length > 0;
  const hasAcceptance = acceptance_passed !== undefined;

  if (!hasTestData && !hasAcceptance) return null;

  return (
    <div className="rounded-2xl border border-white/6 bg-[#111111] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/2 transition"
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
            tests_passed && acceptance_passed !== false
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/15"
              : "bg-red-500/10 text-red-400 border-red-500/15"
          }`}>
            <FlaskConical className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#E8E8E3]">
              Test & Acceptance Results
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              {tests_passed !== undefined && (
                <span className={`flex items-center gap-1 text-[11px] font-medium ${tests_passed ? "text-emerald-400" : "text-red-400"}`}>
                  {tests_passed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  Tests {tests_passed ? "Passed" : "Failed"}
                </span>
              )}
              {hasAcceptance && (
                <span className={`flex items-center gap-1 text-[11px] font-medium ${acceptance_passed ? "text-emerald-400" : "text-amber-400"}`}>
                  {acceptance_passed ? <ShieldCheck className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  Acceptance {acceptance_passed ? "Passed" : "Failed"}
                </span>
              )}
              {retry_count > 0 && (
                <span className="text-[11px] text-[#525250] font-mono">
                  {retry_count} {retry_count === 1 ? "retry" : "retries"}
                </span>
              )}
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-[#525250]" /> : <ChevronDown className="h-4 w-4 text-[#525250]" />}
      </button>

      {expanded && (
        <div className="border-t border-white/6 p-5 space-y-4">
          {/* Test Results Detail */}
          {hasTestData && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#A8A8A0] uppercase tracking-wider">
                Test Output
              </h4>
              <pre className="rounded-xl bg-[#0A0A0A] border border-white/6 p-3 text-[11px] font-mono text-[#A8A8A0] overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto">
                {typeof test_result === "string"
                  ? test_result
                  : JSON.stringify(test_result, null, 2)}
              </pre>
            </div>
          )}

          {/* Acceptance Violations */}
          {acceptance_violations && acceptance_violations.length > 0 && (
            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                <AlertTriangle className="h-3 w-3" />
                Acceptance Violations
              </h4>
              <ul className="space-y-1 list-disc list-inside">
                {acceptance_violations.map((v, i) => (
                  <li key={i} className="text-[12px] text-[#737370]">{v}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestResultsCard;
