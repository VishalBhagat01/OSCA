const COPY = {
  queued: { title: "Queued", body: "Waiting for a worker to pick this run up." },
  running: { title: "The agent is working", body: "Reading the repository, planning and generating a patch. This page updates live." },
  publishing: { title: "Publishing", body: "Pushing the branch and opening the draft pull request." },
};

const ActiveRunningCard = ({ run }) => {
  const copy = COPY[run?.status];
  if (!copy) return null;

  return (
    <div
      role="status"
      className="relative flex items-center gap-5 overflow-hidden rounded-2xl border border-ember/30 bg-ember/[0.05] p-6"
    >
      <span className="relative flex h-3 w-3 shrink-0">
        <span className="absolute inset-0 rounded-full bg-ember" style={{ animation: "pulse-ring 1.8s ease-out infinite" }} />
        <span className="relative h-3 w-3 rounded-full bg-ember" />
      </span>
      <div>
        <h3 className="font-display text-xl text-bone">{copy.title}</h3>
        <p className="mt-0.5 text-[13px] text-bone-2">{copy.body}</p>
      </div>
    </div>
  );
};

export default ActiveRunningCard;
