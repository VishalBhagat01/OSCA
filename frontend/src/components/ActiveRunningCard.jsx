import { Loader2, Cpu } from "lucide-react";

const ActiveRunningCard = ({ run }) => {
  if (!run || !["running", "queued", "publishing"].includes(run.status)) {
    return null;
  }

  const messages = {
    queued: "Run is queued and waiting to start...",
    running: "Agent is actively analyzing and generating patches...",
    publishing: "Publishing draft pull request to GitHub...",
  };

  return (
    <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/15">
          {run.status === "queued" ? (
            <Cpu className="h-5 w-5 text-orange-500" />
          ) : (
            <Loader2 className="h-5 w-5 text-orange-500 animate-spin" />
          )}
        </div>
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-orange-400">
            {run.status === "queued" ? "Queued" : run.status === "publishing" ? "Publishing PR" : "Agent Running"}
          </h3>
          <p className="text-[12px] text-[#737370]">
            {messages[run.status]}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActiveRunningCard;
