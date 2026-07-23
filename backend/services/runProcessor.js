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
        const succeeded = result?.proposed_patch?.can_generate_patch === true;
        const status = succeeded ? "completed" : "failed";
        const error = succeeded
            ? undefined
            : result?.proposed_patch?.reason || "Run did not satisfy acceptance criteria.";

        await Run.findByIdAndUpdate(runId, {
            status,
            completedAt: new Date(),
            result,
            executionTrace: result.execution_trace || [],
            ...(error ? { error } : {}),
        });

        io.emit("run:update", {
            runId,
            status,
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