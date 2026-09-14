import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Terminal,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  Copy,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

export const TestResultsCard = ({ proposedPatch }) => {
  const [showOutput, setShowOutput] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!proposedPatch) return null;

  const testResult = proposedPatch.test_result || {};
  const hasTestsRun =
    testResult.stdout !== undefined ||
    testResult.stderr !== undefined ||
    proposedPatch.tests_passed !== undefined;
  const testsPassed = proposedPatch.tests_passed === true;

  const hasAcceptance =
    proposedPatch.acceptance_passed !== undefined ||
    (proposedPatch.acceptance_violations &&
      proposedPatch.acceptance_violations.length > 0);
  const acceptancePassed = proposedPatch.acceptance_passed === true;
  const violations = proposedPatch.acceptance_violations || [];

  if (!hasTestsRun && !hasAcceptance) return null;

  const copyConsoleLogs = async () => {
    const logs = `=== STDOUT ===\n${testResult.stdout || ""}\n\n=== STDERR ===\n${
      testResult.stderr || ""
    }`;
    try {
      await navigator.clipboard.writeText(logs.trim());
      setCopied(true);
      toast.success("Console logs copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy logs");
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/90 px-5 sm:px-6 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Automated Test & Acceptance Verification
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Isolated sandbox execution verifying regressions and issue acceptance criteria
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Tests Badge */}
            {hasTestsRun && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                  testsPassed
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-red-500/30 bg-red-500/10 text-red-300"
                }`}
              >
                {testsPassed ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                Tests {testsPassed ? "Passed" : "Failed"}
              </span>
            )}

            {/* Acceptance Badge */}
            {hasAcceptance && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                  acceptancePassed
                    ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Acceptance {acceptancePassed ? "Satisfied" : "Unsatisfied"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {/* Acceptance Summary */}
        {hasAcceptance && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Acceptance Review Reasoning
              </span>
              <span
                className={`text-xs font-semibold ${
                  acceptancePassed ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {acceptancePassed
                  ? "All issue criteria successfully satisfied"
                  : "Criteria violations detected"}
              </span>
            </div>

            {proposedPatch.reason && (
              <p className="text-xs sm:text-sm text-zinc-300 bg-zinc-900/80 p-3 rounded-lg border border-zinc-800 leading-relaxed">
                {proposedPatch.reason}
              </p>
            )}

            {violations.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <AlertOctagon className="h-3.5 w-3.5" />
                  Detected Violations:
                </div>
                <ul className="list-inside list-disc text-xs text-zinc-300 space-y-1 bg-amber-950/10 border border-amber-900/30 p-3 rounded-lg">
                  {violations.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Test Output Console */}
        {hasTestsRun && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/50 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Execution Terminal Console
                </span>
                {testResult.return_code !== undefined &&
                  testResult.return_code !== null && (
                    <span className="font-mono text-[11px] text-zinc-500">
                      (Exit code: {testResult.return_code})
                    </span>
                  )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyConsoleLogs}
                  className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-400 hover:text-white transition"
                  title="Copy console output"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy Log</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowOutput(!showOutput)}
                  className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-400 hover:text-white transition"
                >
                  {showOutput ? (
                    <>
                      <span>Hide</span>
                      <ChevronUp className="h-3 w-3" />
                    </>
                  ) : (
                    <>
                      <span>Show Output</span>
                      <ChevronDown className="h-3 w-3" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {showOutput && (
              <div className="p-4 space-y-3">
                {testResult.command && (
                  <div className="font-mono text-xs text-zinc-300 bg-black/70 p-2.5 rounded-lg border border-zinc-800/80">
                    <span className="text-emerald-400 select-none">$ </span>
                    {Array.isArray(testResult.command)
                      ? testResult.command.join(" ")
                      : testResult.command}
                  </div>
                )}

                {testResult.stdout && (
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Standard Output (stdout)
                    </span>
                    <pre className="mt-1 max-h-60 overflow-y-auto rounded-lg bg-[#070709] p-3 font-mono text-xs text-emerald-400/90 whitespace-pre-wrap leading-relaxed border border-zinc-800">
                      {testResult.stdout}
                    </pre>
                  </div>
                )}

                {testResult.stderr && (
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Standard Error (stderr)
                    </span>
                    <pre className="mt-1 max-h-60 overflow-y-auto rounded-lg bg-[#070709] p-3 font-mono text-xs text-rose-400 whitespace-pre-wrap leading-relaxed border border-zinc-800">
                      {testResult.stderr}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestResultsCard;
