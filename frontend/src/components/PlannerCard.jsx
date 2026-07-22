const PlannerCard = ({ analysis }) => {

    if (!analysis) return null;

    return (

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">

            <h2 className="mb-5 text-xl font-semibold">
                Planner Summary
            </h2>

            <p className="text-zinc-300">
                {analysis.summary}
            </p>

            <div className="mt-5">

                <h3 className="font-semibold">
                    Root Cause
                </h3>

                <p className="mt-2 text-zinc-400">
                    {analysis.root_cause_hypothesis}
                </p>

            </div>

        </div>

    );
};

export default PlannerCard;