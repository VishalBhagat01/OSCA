const statusStyles = {
    queued: {
        dot: "bg-amber-400",
        badge:
            "border-amber-500/30 bg-amber-500/10 text-amber-300",
    },

    running: {
        dot: "bg-blue-400",
        badge:
            "border-blue-500/30 bg-blue-500/10 text-blue-300",
    },

    completed: {
        dot: "bg-emerald-400",
        badge:
            "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    },

    failed: {
        dot: "bg-red-400",
        badge:
            "border-red-500/30 bg-red-500/10 text-red-300",
    },
};

export default function StatusBadge({ status = "queued" }) {
    const style =
        statusStyles[status] || statusStyles.queued;

    return (
        <span
            className={`
                inline-flex items-center gap-2
                rounded-full border
                px-3 py-1.5
                text-xs font-semibold uppercase tracking-wide
                ${style.badge}
            `}
        >
            <span
                className={`h-2 w-2 rounded-full ${style.dot}`}
            />

            {status}
        </span>
    );
}