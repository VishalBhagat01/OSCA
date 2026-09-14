"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const runService = require("../services/run.service");
const Run = require("../models/run_schema");
const { RUN_STATUS, REVIEW_ACTION } = require("../constants/run.constants");

test("End-to-End State Flow: Issue -> Agent -> HITL -> PR", async (t) => {
    const mockRunId = new mongoose.Types.ObjectId();
    const mockDiff = "--- a/math.py\n+++ b/math.py\n@@ -1 +1 @@\n-return a / b\n+return a / b if b != 0 else 0";

    await t.test("Simulate Agent execution finishing and awaiting human review", async () => {
        const mockRun = {
            _id: mockRunId,
            repository: { url: "https://github.com/example/repo" },
            issue: { number: 42, title: "Fix divide by zero" },
            status: RUN_STATUS.AWAITING_APPROVAL,
            result: {
                proposed_patch: {
                    diff: mockDiff,
                    changed_files: ["math.py"],
                    can_generate_patch: true,
                },
                pr_metadata: {
                    branch_name: "fix/issue-42-divide-zero",
                    pr_title: "fix: avoid zero division in math.py",
                    commit_message: "fix: handle zero denominator (closes #42)",
                    pr_body: "Closes #42",
                },
            },
            reviews: [],
            executionTrace: [],
            save: async function() { return this; },
        };

        const originalFindById = Run.findById;
        Run.findById = async () => mockRun;

        try {
            // Verify run is correctly retrieved in awaiting_approval state
            const res = await runService.getRunByIdService(mockRunId.toString());
            assert.equal(res.run.status, RUN_STATUS.AWAITING_APPROVAL);
            assert.equal(res.run.result.proposed_patch.can_generate_patch, true);
        } finally {
            Run.findById = originalFindById;
        }
    });

    await t.test("HITL Retry transition: captures reviewer feedback and restarts agent run", async () => {
        const mockRun = {
            _id: mockRunId,
            repository: { url: "https://github.com/example/repo" },
            issue: { number: 42, title: "Fix divide by zero" },
            status: RUN_STATUS.AWAITING_APPROVAL,
            result: {
                proposed_patch: { diff: mockDiff, can_generate_patch: true },
            },
            reviews: [],
            save: async function() { return this; },
        };

        const originalFindById = Run.findById;
        Run.findById = async () => mockRun;

        const runProcessor = require("../services/runProcessor");
        const originalProcessRun = runProcessor.processRun;
        let processRunInvokedWith = null;
        runProcessor.processRun = (_io, _id, payload) => {
            processRunInvokedWith = { _id, payload };
        };

        const emittedEvents = [];
        const mockIo = {
            emit: (event, payload) => emittedEvents.push({ event, payload }),
        };

        try {
            const retryRes = await runService.retryRunService(
                mockRunId.toString(),
                { feedback: "Raise ZeroDivisionError instead of returning 0" },
                mockIo
            );

            assert.equal(retryRes.message, "Run retried successfully.");
            assert.equal(mockRun.status, RUN_STATUS.RUNNING);
            assert.equal(mockRun.reviews.length, 1);
            assert.equal(mockRun.reviews[0].action, REVIEW_ACTION.RETRY);
            assert.equal(mockRun.reviews[0].feedback, "Raise ZeroDivisionError instead of returning 0");
            assert.ok(emittedEvents.some(e => e.event === "run:update" && e.payload.status === "running"));
            assert.ok(processRunInvokedWith !== null);
            assert.equal(processRunInvokedWith.payload.retry, true);
            assert.equal(processRunInvokedWith.payload.feedback, "Raise ZeroDivisionError instead of returning 0");
        } finally {
            Run.findById = originalFindById;
            runProcessor.processRun = originalProcessRun;
        }
    });

    await t.test("HITL Approval transition: creates draft PR and marks run completed", async () => {
        const mockRun = {
            _id: mockRunId,
            repository: { url: "https://github.com/example/repo" },
            issue: { number: 42, title: "Fix divide by zero" },
            status: RUN_STATUS.AWAITING_APPROVAL,
            result: {
                proposed_patch: {
                    diff: mockDiff,
                    changed_files: ["math.py"],
                    can_generate_patch: true,
                },
                pr_metadata: {
                    branch_name: "fix/issue-42-divide-zero",
                    pr_title: "fix: avoid zero division in math.py",
                },
            },
            reviews: [],
            executionTrace: [],
            save: async function() { return this; },
        };

        const originalFindById = Run.findById;
        Run.findById = async () => mockRun;

        // Mock github service createPullRequest and agent draftPR
        const agentService = require("../services/agent.service");
        const githubService = require("../services/github.service");
        const originalDraftPR = agentService.draftPR;
        const originalCreatePR = githubService.createPullRequest;

        agentService.draftPR = async () => ({
            pr_metadata: {
                branch_name: "fix/issue-42-divide-zero",
                pr_title: "fix: handle zero division gracefully (#42)",
            },
        });

        githubService.createPullRequest = async () => ({
            number: 101,
            url: "https://github.com/example/repo/pull/101",
            branch: "fix/issue-42-divide-zero",
            commit: "abcdef1234567890",
            isDraft: true,
        });

        const emittedEvents = [];
        const mockIo = {
            emit: (event, payload) => emittedEvents.push({ event, payload }),
        };

        try {
            const approveRes = await runService.approveRunService(
                mockRunId.toString(),
                { reviewNotes: "LGTM! Approved for draft PR." },
                mockIo
            );

            assert.equal(approveRes.message, "Run approved and PR drafted successfully.");
            assert.equal(mockRun.status, RUN_STATUS.COMPLETED);
            assert.equal(mockRun.pullRequest.number, 101);
            assert.equal(mockRun.pullRequest.isDraft, true);
            assert.equal(mockRun.reviews.length, 1);
            assert.equal(mockRun.reviews[0].action, REVIEW_ACTION.APPROVED);
            assert.equal(mockRun.reviews[0].feedback, "LGTM! Approved for draft PR.");

            // Execution trace has draft_pr running and success events
            const draftEvents = mockRun.executionTrace.filter(e => e.node === "draft_pr");
            assert.ok(draftEvents.length >= 2);
            assert.ok(draftEvents.some(e => e.status === "success"));
        } finally {
            Run.findById = originalFindById;
            agentService.draftPR = originalDraftPR;
            githubService.createPullRequest = originalCreatePR;
        }
    });
});
