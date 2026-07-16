const axios = require("axios");

const runAgent = async ({
    repoUrl,
    issueNumber,
    issueTitle,
    issueBody = "",
    labels = [],
    comments = [],
}) => {
    const response = await axios.post(
        `${process.env.AGENT_API_URL}/analyze-issue`,
        {
            repo_url: repoUrl,
            issue_number: issueNumber,
            issue_title: issueTitle,
            issue_body: issueBody,
            labels,
            comments,
        },
        {
            timeout: 10 * 60 * 1000,
        }
    );

    return response.data;
};

module.exports = {
    runAgent,
};