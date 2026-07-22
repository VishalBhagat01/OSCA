const Run = require("../models/run_schema");
const { runAgent } = require("./agent.service");

async function processRun(io,runId,payload) {
    try {

        await Run.findByIdAndUpdate(runId, {
            status: "running",
            startedAt: new Date(),
        });

        io.emit("run:update", {
            runId,
            status: "running",
        });

        const result = await runAgent(payload);

        await Run.findByIdAndUpdate(runId, {
            status: "completed",
            completedAt: new Date(),
            result,
            executionTrace: result.execution_trace || [],
        });

        io.emit("run:update", {
            runId,
            status: "completed",
        });

    } catch (err) {

        await Run.findByIdAndUpdate(runId, {
            status: "failed",
            completedAt: new Date(),
            error: err.message,
        });

        io.emit("run:update", {
            runId,
            status: "failed",
        });

    }
}

module.exports = {
    processRun,
};