import Panel from "./ui/Panel";

const TONES = {
  success: { dot: "bg-verdigris", text: "text-verdigris" },
  failed: { dot: "bg-madder", text: "text-madder" },
  running: { dot: "bg-ember", text: "text-ember", live: true },
  pending: { dot: "bg-bone-4", text: "text-bone-3" },
};

const Timeline = ({ trace = [], isRunning = false }) => {
  if (!trace || trace.length === 0) return null;

  return (
    <Panel eyebrow="Trace" title="Execution trace" meta={`${trace.length} events`}>
      <ol className="relative">
        <span className="absolute top-2 bottom-2 left-[5px] w-px bg-rule-strong" aria-hidden />
        {trace.map((event, i) => {
          const tone = TONES[event.status] ?? TONES.pending;
          return (
            <li key={i} className="relative flex gap-5 pb-6 last:pb-0">
              <span className="relative mt-1.5 flex h-[11px] w-[11px] shrink-0 items-center justify-center rounded-full bg-ink-2">
                <span className={`h-[7px] w-[7px] rounded-full ${tone.dot}`} />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-mono text-[12px] font-medium tracking-wide text-bone uppercase">
                    {event.node?.replace(/_/g, " ")}
                  </span>
                  <span className={`font-mono text-[10px] tracking-[0.1em] uppercase ${tone.text}`}>
                    {event.status}
                  </span>
                  {event.timestamp && (
                    <span className="ml-auto font-mono text-[10px] text-bone-3 tabular-nums">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                {event.message && (
                  <p className="text-[13px] leading-relaxed text-bone-2">{event.message}</p>
                )}
              </div>
            </li>
          );
        })}

        {isRunning && (
          <li className="relative flex gap-5 pt-6">
            <span className="mt-1.5 flex h-[11px] w-[11px] shrink-0 items-center justify-center">
              <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-ember" />
            </span>
            <span className="font-mono text-[11px] tracking-wide text-ember uppercase">Working</span>
          </li>
        )}
      </ol>
    </Panel>
  );
};

export default Timeline;
