import {
    GitBranch,
    Hash,
    Clock3,
    CalendarDays,
} from "lucide-react";

import InfoCard from "./InfoCard";
import StatusBadge from "./StatusBadge";

const formatDate = (date) => {
    if (!date) return "--";

    return new Date(date).toLocaleString();
};

const calculateDuration = (start, end) => {
    if (!start) return "--";

    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();

    const diff = Math.floor((endTime - startTime) / 1000);

    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;

    return `${minutes}m ${seconds}s`;
};

const RunCard = ({ run }) => {
    if (!run) return null;

    return (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

            <InfoCard
                title="Repository"
                icon={<GitBranch size={18} />}
            >
                <p className="break-all text-sm font-medium text-white">
                    {run.repository?.url}
                </p>
            </InfoCard>

            <InfoCard
                title="Issue"
                icon={<Hash size={18} />}
            >
                <p className="text-xl font-semibold text-white">
                    #{run.issue?.number}
                </p>

                <p className="mt-2 text-sm text-zinc-400">
                    {run.issue?.title}
                </p>
            </InfoCard>

            <InfoCard
                title="Status"
                icon={<CalendarDays size={18} />}
            >
                <StatusBadge status={run.status} />

                <div className="mt-4">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                        Started
                    </p>

                    <p className="mt-1 text-sm text-zinc-300">
                        {formatDate(run.createdAt)}
                    </p>
                </div>
            </InfoCard>

            <InfoCard
                title="Execution"
                icon={<Clock3 size={18} />}
            >
                <p className="text-3xl font-bold text-white">
                    {calculateDuration(
                        run.createdAt,
                        run.completedAt
                    )}
                </p>

                <p className="mt-2 text-sm text-zinc-500">
                    Total Runtime
                </p>
            </InfoCard>

            {run.pullRequest?.url && (
                <InfoCard title="Pull Request" icon={<GitBranch size={18} />}>
                    <a className="text-sm font-medium text-blue-400 hover:text-blue-300" href={run.pullRequest.url} target="_blank" rel="noreferrer">
                        PR #{run.pullRequest.number}
                    </a>
                </InfoCard>
            )}

        </div>
    );
};

export default RunCard;
