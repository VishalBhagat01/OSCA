const InfoCard = ({
    title,
    icon,
    badge,
    children,
    footer,
    className = "",
}) => {
    return (
        <div
            className={`
                group rounded-2xl border border-zinc-800
                bg-gradient-to-b from-zinc-900 to-zinc-950
                p-6 shadow-lg transition-all duration-300
                hover:border-blue-500/40 hover:shadow-blue-500/10
                ${className}
            `}
        >
            {/* Header */}
            <div className="flex items-start justify-between">

                <div className="flex items-center gap-3">

                    {icon && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                            {icon}
                        </div>
                    )}

                    <div>
                        <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                            {title}
                        </h3>
                    </div>

                </div>

                {badge}

            </div>

            {/* Content */}
            <div className="mt-6 text-white">

                {children}

            </div>

            {/* Footer */}
            {footer && (
                <div className="mt-6 border-t border-zinc-800 pt-4 text-sm text-zinc-500">
                    {footer}
                </div>
            )}

        </div>
    );
};

export default InfoCard;