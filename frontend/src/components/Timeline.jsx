const Timeline = ({ trace = [] }) => {

    return (

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">

            <h2 className="mb-6 text-xl font-semibold">
                Execution Timeline
            </h2>

            <div className="space-y-4">

                {trace.map((step, index) => (

                    <div
                        key={index}
                        className="flex items-center gap-3"
                    >

                        <div
                            className={`h-3 w-3 rounded-full ${
                                step.status === "success"
                                    ? "bg-green-500"
                                    : step.status === "failed"
                                    ? "bg-red-500"
                                    : "bg-blue-500"
                            }`}
                        />

                        <div>

                            <p>{step.node}</p>

                            <p className="text-sm text-zinc-500">

                                {step.message}

                            </p>

                        </div>

                    </div>

                ))}

            </div>

        </div>

    );

};

export default Timeline;