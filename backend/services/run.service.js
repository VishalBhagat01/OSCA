"use strict";

const mongoose = require("mongoose");
const Run = require("../models/run_schema");
const runProcessor = require("./runProcessor");
const githubService = require("./github.service");
const agentService = require("./agent.service");
const { emitRunUpdate, emitRunEvent } = require("./socket.service");
const { RUN_STATUS, REVIEW_ACTION } = require("../constants/run.constants");

/**
 * Custom error with HTTP status code support.
 */
class ServiceError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}

/**
 * Validates ObjectId format and retrieves a Run document.
 * Throws ServiceError with status 404 if invalid or not found.
 */
async function findRunOrThrow(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new ServiceError("Invalid run id.", 404);
    }

    const run = await Run.findById(id);
    if (!run) {
        throw new ServiceError("Run not found.", 404);
    }

    return run;
}

/**
 * Creates and queues a new run for a GitHub issue.
 */
async function createRunService({ repoUrl, issueNumber, io }) {
    if (!repoUrl || !issueNumber) {
        throw new ServiceError("repoUrl and issueNumber are required.", 400);
    }

    const parsedIssue = Number(issueNumber);
    if (!Number.isInteger(parsedIssue) || parsedIssue <= 0) {
        throw new ServiceError("issueNumber must be a positive integer.", 400);
    }

    try {
        githubService.parseRepoUrl(repoUrl);
    } catch (urlErr) {
        throw new ServiceError(urlErr.message || "Invalid GitHub repository URL", 400);
    }

    const githubIssue = await githubService.getIssueDetails(repoUrl, parsedIssue);

    const run = await Run.create({
        repository: { url: repoUrl },
        issue: {
            number: parsedIssue,
            title: githubIssue.title,
            body: githubIssue.body,
            labels: githubIssue.labels,
            comments: githubIssue.comments,
        },
        status: RUN_STATUS.QUEUED,
    });

    runProcessor.processRun(io, run._id, {
        repo_url: repoUrl,
        issue_number: parsedIssue,
        issue_title: githubIssue.title,
        issue_body: githubIssue.body,
        labels: githubIssue.labels,
        comments: githubIssue.comments,
    });

    return { runId: run._id };
}

/**
 * Retrieves all runs, sorted latest first.
 */
async function getRunsService() {
    const runs = await Run.find().sort({ createdAt: -1 }).lean();
    return { count: runs.length, runs };
}

/**
 * Retrieves a single run by ID.
 */
async function getRunByIdService(id) {
    const run = await findRunOrThrow(id);
    return { run };
}

/**
 * Deletes a run by ID.
 */
async function deleteRunService(id) {
    const run = await findRunOrThrow(id);
    await run.deleteOne();
    return { message: "Run deleted successfully." };
}

/**
 * Approves a run, calls agent to draft PR, and opens GitHub pull request.
 */
async function approveRunService(id, { reviewNotes, feedback, asDraft = true } = {}, io) {
    const run = await findRunOrThrow(id);

    if (run.status === RUN_STATUS.COMPLETED) {
        return {
            alreadyCompleted: true,
            message: "Run already approved and completed.",
            pullRequest: run.pullRequest,
        };
    }

    if (run.status !== RUN_STATUS.AWAITING_APPROVAL) {
        throw new ServiceError("Run is not awaiting approval.", 400);
    }

    const diff = run.result?.proposed_patch?.diff;
    if (!diff) {
        throw new ServiceError("No approved patch is available.", 400);
    }

    const reviewerComments = (reviewNotes || feedback || "").trim();

    run.status = RUN_STATUS.PUBLISHING;
    run.reviews.push({
        action: REVIEW_ACTION.APPROVED,
        feedback: reviewerComments || undefined,
        timestamp: new Date(),
    });

    const startDraftEvent = {
        node: "draft_pr",
        status: "running",
        message: "Drafting Pull Request with AI incorporating human review...",
        details: { reviewerComments: reviewerComments || "Approved without extra notes" },
        timestamp: new Date().toISOString(),
    };
    run.executionTrace = run.executionTrace || [];
    run.executionTrace.push(startDraftEvent);
    await run.save();

    emitRunEvent(io, run._id, startDraftEvent, run.executionTrace);
    emitRunUpdate(io, run._id, RUN_STATUS.PUBLISHING);

    try {
        // Synthesize release metadata via agent
        try {
            const drafted = await agentService.draftPR({
                repo_url: run.repository?.url || "",
                issue_number: run.issue?.number || 0,
                issue_title: run.issue?.title || "Bug fix",
                issue_body: run.issue?.body || "",
                patch: diff,
                changed_files: run.result?.proposed_patch?.changed_files || [],
                human_feedback: reviewerComments,
                test_summary: JSON.stringify(run.result?.proposed_patch?.test_result || {}),
                is_draft: asDraft,
            });

            if (drafted?.pr_metadata) {
                run.result = run.result || {};
                run.result.pr_metadata = drafted.pr_metadata;
            }
        } catch (draftErr) {
            console.warn("[approveRun] Drafting PR agent call failed, continuing with cached metadata:", draftErr.message);
        }

        const pullRequest = await githubService.createPullRequest(run, diff, { isDraft: asDraft });

        const successDraftEvent = {
            node: "draft_pr",
            status: "success",
            message: `Draft Pull Request #${pullRequest.number} created on GitHub.`,
            details: {
                prNumber: pullRequest.number,
                prUrl: pullRequest.url,
                branch: pullRequest.branch,
                isDraft: pullRequest.isDraft,
            },
            timestamp: new Date().toISOString(),
        };

        run.executionTrace.push(successDraftEvent);
        run.status = RUN_STATUS.COMPLETED;
        run.pullRequest = pullRequest;
        run.completedAt = new Date();
        await run.save();

        emitRunEvent(io, run._id, successDraftEvent, run.executionTrace);
        emitRunUpdate(io, run._id, RUN_STATUS.COMPLETED);

        return {
            message: "Run approved and PR drafted successfully.",
            pullRequest,
        };
    } catch (error) {
        // Rollback state if GitHub PR publishing failed
        try {
            const rollbackRun = await Run.findById(id);
            if (rollbackRun && rollbackRun.status === RUN_STATUS.PUBLISHING) {
                rollbackRun.status = RUN_STATUS.AWAITING_APPROVAL;
                rollbackRun.error = error.message;
                const failedEvent = {
                    node: "draft_pr",
                    status: "failed",
                    message: `PR creation failed: ${error.message}`,
                    timestamp: new Date().toISOString(),
                };
                rollbackRun.executionTrace = rollbackRun.executionTrace || [];
                rollbackRun.executionTrace.push(failedEvent);
                await rollbackRun.save();

                emitRunEvent(io, rollbackRun._id, failedEvent, rollbackRun.executionTrace);
                emitRunUpdate(io, rollbackRun._id, RUN_STATUS.AWAITING_APPROVAL);
            }
        } catch (rollbackErr) {
            console.error("[approveRun] Rollback failed:", rollbackErr.message);
        }

        throw error;
    }
}

/**
 * Rejects a run awaiting human review.
 */
async function rejectRunService(id, io) {
    const run = await findRunOrThrow(id);

    if (run.status === RUN_STATUS.REJECTED) {
        return {
            alreadyRejected: true,
            message: "Run already rejected.",
        };
    }

    if (run.status !== RUN_STATUS.AWAITING_APPROVAL) {
        throw new ServiceError("Run is not awaiting approval.", 400);
    }

    run.status = RUN_STATUS.REJECTED;
    run.reviews.push({ action: REVIEW_ACTION.REJECTED, timestamp: new Date() });
    await run.save();

    emitRunUpdate(io, run._id, run.status);

    return { message: "Run rejected successfully." };
}

/**
 * Retries an awaiting run with reviewer instructions.
 */
async function retryRunService(id, { feedback } = {}, io) {
    if (!feedback || typeof feedback !== "string" || !feedback.trim()) {
        throw new ServiceError("Feedback is required.", 400);
    }

    const run = await findRunOrThrow(id);

    if (run.status !== RUN_STATUS.AWAITING_APPROVAL) {
        throw new ServiceError("Run is not awaiting approval.", 400);
    }

    run.reviews.push({
        action: REVIEW_ACTION.RETRY,
        feedback: feedback.trim(),
        timestamp: new Date(),
    });
    run.status = RUN_STATUS.RUNNING;
    await run.save();

    emitRunUpdate(io, run._id, run.status);

    runProcessor.processRun(io, run._id, {
        repo_url: run.repository.url,
        issue_number: run.issue.number,
        issue_title: run.issue.title,
        issue_body: run.issue?.body || "",
        feedback: feedback.trim(),
        previous_result: run.result,
        retry: true,
    });

    return { message: "Run retried successfully." };
}

/**
 * Appends or updates a live execution trace event.
 */
async function appendRunEventService(id, { event }, io) {
    if (!event) {
        throw new ServiceError("Event data is required.", 400);
    }

    const current = await findRunOrThrow(id);
    const trace = current.executionTrace || [];
    const lastIdx = trace.length - 1;

    // In-place update if previous event is for the same node and was still running
    if (lastIdx >= 0 && trace[lastIdx].node === event.node && trace[lastIdx].status === "running") {
        current.executionTrace[lastIdx] = event;
    } else {
        current.executionTrace.push(event);
    }

    const run = await current.save();

    emitRunEvent(io, run._id, event, run.executionTrace);
    emitRunUpdate(io, run._id, run.status);

    return { message: "Event appended successfully." };
}

module.exports = {
    ServiceError,
    findRunOrThrow,
    createRunService,
    getRunsService,
    getRunByIdService,
    deleteRunService,
    approveRunService,
    rejectRunService,
    retryRunService,
    appendRunEventService,
};
