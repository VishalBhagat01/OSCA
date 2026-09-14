"use strict";

const axios = require("axios");
const config = require("../config/env");

/**
 * Common HTTP client helper for invoking Python Agent endpoints.
 */
async function postToAgent(endpoint, payload, timeoutMs) {
    const headers = {};
    if (config.agent.apiKey) {
        headers["x-api-key"] = config.agent.apiKey;
    }

    const response = await axios.post(
        `${config.agent.apiUrl}${endpoint}`,
        payload,
        {
            headers,
            timeout: timeoutMs,
        }
    );

    return response.data;
}

const runAgent = async (payload) => {
    return postToAgent("/analyze-issue", payload, config.agent.timeoutMs);
};

const draftPR = async (payload) => {
    return postToAgent("/draft-pr", payload, config.agent.draftTimeoutMs);
};

module.exports = {
    runAgent,
    draftPR,
};
