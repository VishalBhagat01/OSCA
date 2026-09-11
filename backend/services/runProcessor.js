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

        const port = process.env.PORT || 5000;
        const baseUrl = process.env.BACKEND_URL || `http://localhost:${port}`;
        const callbackUrl = `${baseUrl}/api/runs/${runId}/events`;

        const result = await runAgent({
            ...payload,
            callback_url: callbackUrl,
            callback_token: process.env.AGENT_CALLBACK_TOKEN,
        });

        const succeeded = result?.proposed_patch?.can_generate_patch === true;
        const status = succeeded ? "awaiting_approval" : "failed";
        const error = succeeded
            ? undefined
            : result?.proposed_patch?.reason || "Run did not satisfy acceptance criteria.";

        const currentRun = await Run.findById(runId);
        const finalTrace = (currentRun?.executionTrace && currentRun.executionTrace.length > 0)
            ? currentRun.executionTrace
            : (result?.execution_trace || []);

        await Run.findByIdAndUpdate(runId, {
            status,
            completedAt: new Date(),
            result,
            executionTrace: finalTrace,
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
