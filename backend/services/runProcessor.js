"use strict";

const Run = require("../models/run_schema");
const config = require("../config/env");
const { runAgent } = require("./agent.service");
const { emitRunUpdate } = require("./socket.service");
const { RUN_STATUS } = require("../constants/run.constants");

async function processRun(io, runId, payload) {
    try {
        await Run.findByIdAndUpdate(runId, {
            status: RUN_STATUS.RUNNING,
            startedAt: new Date(),
        });

        emitRunUpdate(io, runId, RUN_STATUS.RUNNING);

        const callbackUrl = `${config.backendUrl}/api/runs/${runId}/events`;

        const result = await runAgent({
            ...payload,
            callback_url: callbackUrl,
            callback_token: config.agent.callbackToken,
        });

        const succeeded = result?.proposed_patch?.can_generate_patch === true;
        const status = succeeded ? RUN_STATUS.AWAITING_APPROVAL : RUN_STATUS.FAILED;
        const error = succeeded
            ? undefined
            : result?.proposed_patch?.reason || "Run did not satisfy acceptance criteria.";

        // Fetch live trace and merge with agent result in a single DB update
        const currentRun = await Run.findById(runId).lean();
        const finalTrace =
            currentRun?.executionTrace?.length > 0
                ? currentRun.executionTrace
                : result?.execution_trace || [];

        await Run.findByIdAndUpdate(runId, {
            status,
            completedAt: new Date(),
            result,
            executionTrace: finalTrace,
            ...(error ? { error } : {}),
        });

        emitRunUpdate(io, runId, status);
    } catch (err) {
        console.error(`[processRun] Failed for run ${runId}:`, err.message);

        await Run.findByIdAndUpdate(runId, {
            status: RUN_STATUS.FAILED,
            completedAt: new Date(),
            error: err.message,
        });

        emitRunUpdate(io, runId, RUN_STATUS.FAILED);
    }
}

module.exports = { processRun };
