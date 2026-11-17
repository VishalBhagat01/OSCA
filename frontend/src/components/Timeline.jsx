import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";

const ICON_MAP = {
  success: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500", border: "border-emerald-500/30" },
  failed: { icon: XCircle, color: "text-red-400", bg: "bg-red-500", border: "border-red-500/30" },
  running: { icon: Loader2, color: "text-orange-400", bg: "bg-orange-500", border: "border-orange-500/30", animate: true },
  pending: { icon: Clock, color: "text-[#525250]", bg: "bg-[#525250]", border: "border-white/8" },
};

const Timeline = ({ trace = [], isRunning = false }) => {
  if (!trace || trace.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/6 bg-[#111111] p-5 space-y-4">
      <h3 className="text-sm font-semibold text-[#E8E8E3]">
        Execution Trace
      </h3>

      <div className="relative space-y-0">
        {trace.map((event, i) => {
          const config = ICON_MAP[event.status] || ICON_MAP.pending;
          const Icon = config.icon;
          const isLast = i === trace.length - 1;

          return (
            <div key={i} className="flex gap-3 pb-4 last:pb-0">
              {/* Vertical line + icon */}
              <div className="relative flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${config.border} bg-[#171717]`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${config.color} ${config.animate ? "animate-spin" : ""}`}
                  />
                </div>
                {!isLast && (
                  <div className="flex-1 w-px bg-white/6 mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-0.5 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[11px] font-semibold text-[#A8A8A0] uppercase">
                    {event.node?.replace(/_/g, " ")}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      event.status === "success"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : event.status === "failed"
                        ? "bg-red-500/10 text-red-400"
                        : event.status === "running"
                        ? "bg-orange-500/10 text-orange-400"
                        : "bg-white/5 text-[#525250]"
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
                {event.message && (
                  <p className="text-[12px] text-[#737370] leading-relaxed">
                    {event.message}
                  </p>
                )}
                {event.timestamp && (
                  <span className="text-[10px] text-[#525250] font-mono">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Running indicator at end */}
        {isRunning && (
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-orange-500/30 bg-[#171717]">
              <Loader2 className="h-3.5 w-3.5 text-orange-400 animate-spin" />
            </div>
            <div className="pt-1">
              <span className="text-[11px] text-orange-400 font-medium">
                Agent is working...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;