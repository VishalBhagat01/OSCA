import { History, MessageSquare, ThumbsUp, ThumbsDown, RotateCw } from "lucide-react";

const ACTION_CONFIG = {
  approved: { icon: ThumbsUp, color: "text-emerald-400", label: "Approved" },
  rejected: { icon: ThumbsDown, color: "text-red-400", label: "Rejected" },
  retry: { icon: RotateCw, color: "text-orange-400", label: "Retry Requested" },
};

const ReviewHistoryCard = ({ reviews = [] }) => {
  if (!reviews || reviews.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/6 bg-[#111111] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-[#525250]" />
        <h3 className="text-sm font-semibold text-[#E8E8E3]">
          Review History
        </h3>
        <span className="text-[11px] text-[#525250] font-mono">
          ({reviews.length})
        </span>
      </div>

      <div className="space-y-3">
        {reviews.map((review, i) => {
          const config = ACTION_CONFIG[review.action] || {
            icon: MessageSquare,
            color: "text-[#525250]",
            label: review.action,
          };
          const Icon = config.icon;

          return (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl bg-white/2 border border-white/4 p-3"
            >
              <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${config.color}`} />
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={`font-semibold ${config.color}`}>
                    {config.label}
                  </span>
                  {review.timestamp && (
                    <span className="text-[#525250] font-mono">
                      {new Date(review.timestamp).toLocaleString()}
                    </span>
                  )}
                </div>
                {review.feedback && (
                  <p className="text-[12px] text-[#737370] leading-relaxed">
                    {review.feedback}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReviewHistoryCard;
