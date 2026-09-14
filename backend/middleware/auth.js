"use strict";

const config = require("../config/env");

function requireApiKey(req, res, next) {
    const configuredKey = config.apiKey;

    // Local development remains frictionless; deployed environments must set API_KEY.
    if (!configuredKey) return next();

    if (
        req.path.endsWith("/events") &&
        config.agent.callbackToken &&
        req.get("x-agent-callback-token") === config.agent.callbackToken
    ) {
        return next();
    }

    if (req.get("x-api-key") !== configuredKey) {
        return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    return next();
}

module.exports = { requireApiKey };
