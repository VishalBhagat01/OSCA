const axios = require("axios");

const runAgent = async (payload) => {
    const response = await axios.post(
        `${process.env.AGENT_API_URL}/analyze-issue`,
        payload
    );

    return response.data;
};

module.exports = {
    runAgent,
};