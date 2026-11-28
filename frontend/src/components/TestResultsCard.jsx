import Panel from "./ui/Panel";

const Verdict = ({ ok, children, warn = false }) => (
  <span
    className={`inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.1em] uppercase ${
      ok ? "text-verdigris" : warn ? "text-saffron" : "text-madder"
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-verdigris" : warn ? "bg-saffron" : "bg-madder"}`} />
    {children}
  </span>
);

const TestResultsCard = ({ proposedPatch }) => {
  if (!proposedPatch) return null;

  const { tests_passed, test_result, acceptance_passed, acceptance_violations, retry_count } = proposedPatch;
  const hasTestData = test_result && Object.keys(test_result).length > 0;
  const hasAcceptance = acceptance_passed !== undefined;

  if (!hasTestData && !hasAcceptance) return null;

  return (
    <Panel
      eyebrow="Verification"
      title="Tests and acceptance"
      meta={
        <span className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {tests_passed !== undefined && <Verdict ok={tests_passed}>Tests {tests_passed ? "passed" : "failed"}</Verdict>}
          {hasAcceptance && (
            <Verdict ok={acceptance_passed} warn>
              Acceptance {acceptance_passed ? "passed" : "failed"}
            </Verdict>
          )}
          {retry_count > 0 && (
            <span className="font-mono text-[11px] text-bone-3">
              {retry_count} {retry_count === 1 ? "retry" : "retries"}
            </span>
          )}
        </span>
      }
      collapsible
      defaultOpen={false}
      bodyClassName="p-6 space-y-6"
    >
      {hasTestData && (
        <div className="space-y-2">
          <h4 className="eyebrow">Test output</h4>
          <pre className="max-h-64 overflow-auto rounded-xl border border-rule bg-ink p-4 text-[12px] leading-relaxed whitespace-pre-wrap text-bone-2">
            {typeof test_result === "string" ? test_result : JSON.stringify(test_result, null, 2)}
          </pre>
        </div>
      )}

      {acceptance_violations?.length > 0 && (
        <div className="space-y-2">
          <h4 className="eyebrow !text-saffron">Acceptance violations</h4>
          <ul className="space-y-1.5">
            {acceptance_violations.map((v, i) => (
              <li key={i} className="border-l-2 border-saffron/50 pl-3 text-[13px] text-bone-2">
                {v}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
};

export default TestResultsCard;
