const colors = {
    queued: "bg-yellow-500",
    running: "bg-blue-500",
    completed: "bg-green-500",
    failed: "bg-red-500",
};

export default function StatusBadge({ status }) {
    return (
        <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[status]}`}
        >
            {status}
        </span>
    );
}