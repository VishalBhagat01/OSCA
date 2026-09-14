const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const runController = require("../controllers/run.controller");
const Run = require("../models/run_schema");

// Helper to create mock req/res
function createMockReqRes(params = {}, body = {}, app = {}) {
    const req = {
        params,
        body,
        app: {
            get: (key) => (app[key] ? app[key] : null),
        },
    };

    const res = {
        statusCode: 200,
        data: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.data = payload;
            return this;
        },
    };

    return { req, res };
}

test("Run Controller - Input Validation", async (t) => {
    await t.test("createRun rejects missing repoUrl", async () => {
        const { req, res } = createMockReqRes({}, { issueNumber: 1 });
        await runController.createRun(req, res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.data.success, false);
        assert.match(res.data.message, /repoUrl and issueNumber are required/);
    });

    await t.test("createRun rejects negative or non-integer issueNumber", async () => {
        const { req, res } = createMockReqRes({}, { repoUrl: "https://github.com/foo/bar", issueNumber: -5 });
        await runController.createRun(req, res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.data.success, false);
        assert.match(res.data.message, /positive integer/);
    });

    await t.test("createRun rejects invalid GitHub URL format", async () => {
        const { req, res } = createMockReqRes({}, { repoUrl: "https://notgithub.com/foo/bar", issueNumber: 1 });
        await runController.createRun(req, res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.data.success, false);
        assert.match(res.data.message, /Invalid GitHub repository URL/);
    });

    await t.test("getRun rejects invalid ObjectId", async () => {
        const { req, res } = createMockReqRes({ id: "invalid-id-format" });
        await runController.getRun(req, res);
        assert.equal(res.statusCode, 404);
        assert.equal(res.data.message, "Invalid run id.");
    });

    await t.test("retryRun requires non-empty feedback string", async () => {
        const validId = new mongoose.Types.ObjectId().toString();
        const { req, res } = createMockReqRes({ id: validId }, { feedback: "   " });
        await runController.retryRun(req, res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.data.success, false);
        assert.match(res.data.message, /feedback is required/i);
    });
});

test("Run Controller - HITL Idempotency & State Checks", async (t) => {
    const validId = new mongoose.Types.ObjectId();

    await t.test("approveRun returns 404 if run does not exist", async () => {
        // Mock findOneAndUpdate returning null and findById returning null
        const originalFindOneAndUpdate = Run.findOneAndUpdate;
        const originalFindById = Run.findById;

        Run.findOneAndUpdate = async () => null;
        Run.findById = async () => null;

        try {
            const { req, res } = createMockReqRes({ id: validId.toString() });
            await runController.approveRun(req, res);
            assert.equal(res.statusCode, 404);
            assert.equal(res.data.message, "Run not found.");
        } finally {
            Run.findOneAndUpdate = originalFindOneAndUpdate;
            Run.findById = originalFindById;
        }
    });

    await t.test("approveRun handles already completed runs idempotently", async () => {
        const originalFindOneAndUpdate = Run.findOneAndUpdate;
        const originalFindById = Run.findById;

        Run.findOneAndUpdate = async () => null;
        Run.findById = async () => ({
            _id: validId,
            status: "completed",
            pullRequest: { url: "https://github.com/foo/bar/pull/1", number: 1 },
        });

        try {
            const { req, res } = createMockReqRes({ id: validId.toString() });
            await runController.approveRun(req, res);
            assert.equal(res.statusCode, 200);
            assert.equal(res.data.success, true);
            assert.match(res.data.message, /already approved and completed/);
        } finally {
            Run.findOneAndUpdate = originalFindOneAndUpdate;
            Run.findById = originalFindById;
        }
    });

    await t.test("rejectRun returns idempotent success if already rejected", async () => {
        const originalFindOneAndUpdate = Run.findOneAndUpdate;
        const originalFindById = Run.findById;

        Run.findOneAndUpdate = async () => null;
        Run.findById = async () => ({
            _id: validId,
            status: "rejected",
        });

        try {
            const { req, res } = createMockReqRes({ id: validId.toString() });
            await runController.rejectRun(req, res);
            assert.equal(res.statusCode, 200);
            assert.equal(res.data.success, true);
            assert.match(res.data.message, /already rejected/);
        } finally {
            Run.findOneAndUpdate = originalFindOneAndUpdate;
            Run.findById = originalFindById;
        }
    });
});
