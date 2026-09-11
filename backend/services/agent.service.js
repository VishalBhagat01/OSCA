const axios = require("axios");

const runAgent = async (payload) => {
    const response = await axios.post(
        `${process.env.AGENT_API_URL}/analyze-issue`,
        payload,
        {
            headers: process.env.AGENT_API_KEY
                ? { "x-api-key": process.env.AGENT_API_KEY }
                : {},
            timeout: 180000,
        }
    );

    return response.data;
};

module.exports = {
    runAgent,
};
