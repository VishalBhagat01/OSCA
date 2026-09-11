function requireApiKey(req, res, next) {
    const configuredKey = process.env.API_KEY;

    // Local development remains frictionless; deployed environments must set API_KEY.
    if (!configuredKey) return next();

    if (
        req.path.endsWith("/events") &&
        process.env.AGENT_CALLBACK_TOKEN &&
        req.get("x-agent-callback-token") === process.env.AGENT_CALLBACK_TOKEN
    ) return next();

    if (req.get("x-api-key") !== configuredKey) {
        return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    return next();
}

module.exports = { requireApiKey };
