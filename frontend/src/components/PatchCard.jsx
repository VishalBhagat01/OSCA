const PatchCard = ({ diff }) => {

    if (!diff) return null;

    return (

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">

            <h2 className="mb-5 text-xl font-semibold">
                Generated Patch
            </h2>

            <pre className="overflow-auto rounded-lg bg-black p-5 text-sm text-green-400">

                {diff}

            </pre>

        </div>

    );

};

export default PatchCard;