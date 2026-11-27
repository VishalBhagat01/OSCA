import Panel from "./ui/Panel";

const ACTIONS = {
  approved: { label: "Approved", text: "text-verdigris" },
  rejected: { label: "Rejected", text: "text-madder" },
  retry: { label: "Retry requested", text: "text-ember" },
};

const ReviewHistoryCard = ({ reviews = [] }) => {
  if (!reviews || reviews.length === 0) return null;

  return (
    <Panel eyebrow="Decisions" title="Review history" meta={`${reviews.length} ${reviews.length === 1 ? "entry" : "entries"}`}>
      <ul className="divide-y divide-rule">
        {reviews.map((review, i) => {
          const a = ACTIONS[review.action] ?? { label: review.action, text: "text-bone-3" };
          return (
            <li key={i} className="space-y-1.5 py-4 first:pt-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className={`font-mono text-[11px] font-medium tracking-[0.1em] uppercase ${a.text}`}>{a.label}</span>
                {review.timestamp && (
                  <span className="font-mono text-[10px] text-bone-3">{new Date(review.timestamp).toLocaleString()}</span>
                )}
              </div>
              {review.feedback && <p className="text-[14px] leading-relaxed text-bone-2">{review.feedback}</p>}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
};

export default ReviewHistoryCard;
