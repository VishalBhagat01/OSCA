import Panel from "./ui/Panel";

const Block = ({ label, children }) => (
  <div className="grid gap-2 py-5 first:pt-0 last:pb-0 sm:grid-cols-[9rem_1fr] sm:gap-6">
    <h4 className="eyebrow pt-0.5">{label}</h4>
    <div className="min-w-0">{children}</div>
  </div>
);

const PlannerCard = ({ analysis }) => {
  if (!analysis || Object.keys(analysis).length === 0) return null;

  const { root_cause, approach, affected_files, plan_steps, complexity } = analysis;

  return (
    <Panel
      eyebrow="Plan"
      title="Planner analysis"
      meta={complexity ? `Complexity: ${complexity}` : null}
      collapsible
      defaultOpen={false}
    >
      <div className="divide-y divide-rule">
        {root_cause && (
          <Block label="Root cause">
            <p className="text-[15px] leading-relaxed text-bone">{root_cause}</p>
          </Block>
        )}
        {approach && (
          <Block label="Approach">
            <p className="text-[15px] leading-relaxed text-bone-2">{approach}</p>
          </Block>
        )}
        {affected_files?.length > 0 && (
          <Block label="Files">
            <ul className="flex flex-wrap gap-2">
              {affected_files.map((file, i) => (
                <li key={i} className="rounded-md border border-rule-strong px-2.5 py-1 font-mono text-[12px] text-bone-2">
                  {file}
                </li>
              ))}
            </ul>
          </Block>
        )}
        {plan_steps?.length > 0 && (
          <Block label="Steps">
            <ol className="space-y-3">
              {plan_steps.map((step, i) => (
                <li key={i} className="grid grid-cols-[2rem_1fr] text-[14px] leading-relaxed text-bone-2">
                  <span className="font-mono text-[12px] text-ember tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span>{typeof step === "string" ? step : step.description || JSON.stringify(step)}</span>
                </li>
              ))}
            </ol>
          </Block>
        )}
      </div>
    </Panel>
  );
};

export default PlannerCard;
