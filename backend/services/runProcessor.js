const Run = require("../models/run_schema");
const { runAgent } = require("./agent.service");

async function processRun(runId, payload) {
    try {

        await Run.findByIdAndUpdate(runId, {
            status: "running",
            startedAt: new Date(),
        });

        const result = await runAgent(payload);

        await Run.findByIdAndUpdate(runId, {
            status: "completed",
            completedAt: new Date(),
            result,
            executionTrace: result.execution_trace || [],
        });

    } catch (err) {

        await Run.findByIdAndUpdate(runId, {
            status: "failed",
            completedAt: new Date(),
            error: err.message,
        });

    }
}

module.exports = {
    processRun,
};