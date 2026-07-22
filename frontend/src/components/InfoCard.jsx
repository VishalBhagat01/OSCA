const InfoCard = ({ title, value }) => {
    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">

            <p className="text-sm text-zinc-400">
                {title}
            </p>

            <p className="mt-3 break-all text-white">
                {value}
            </p>

        </div>
    );
};

export default InfoCard;