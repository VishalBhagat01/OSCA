"use strict";

const runService = require("../services/run.service");

function getIO(req) {
    return req.app?.get ? req.app.get("io") : null;
}

function handleControllerError(res, error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
        success: false,
        message: error.message || "Internal Server Error",
    });
}

exports.createRun = async (req, res) => {
    try {
        const io = getIO(req);
        const { repoUrl, issueNumber } = req.body || {};
        const result = await runService.createRunService({ repoUrl, issueNumber, io });

        return res.status(202).json({
            success: true,
            message: "Run queued successfully.",
            runId: result.runId,
        });
    } catch (error) {
        return handleControllerError(res, error);
    }
};

exports.getRuns = async (_req, res) => {
    try {
        const result = await runService.getRunsService();
        return res.status(200).json({
            success: true,
            count: result.count,
            runs: result.runs,
        });
    } catch (error) {
        return handleControllerError(res, error);
    }
};

exports.getRun = async (req, res) => {
    try {
        const result = await runService.getRunByIdService(req.params.id);
        return res.status(200).json({
            success: true,
            run: result.run,
        });
    } catch (error) {
        return handleControllerError(res, error);
    }
};

exports.deleteRun = async (req, res) => {
    try {
        const result = await runService.deleteRunService(req.params.id);
        return res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        return handleControllerError(res, error);
    }
};

exports.approveRun = async (req, res) => {
    try {
        const io = getIO(req);
        const result = await runService.approveRunService(req.params.id, req.body, io);
        return res.status(200).json({
            success: true,
            message: result.message,
            pullRequest: result.pullRequest,
        });
    } catch (error) {
        return handleControllerError(res, error);
    }
};

exports.rejectRun = async (req, res) => {
    try {
        const io = getIO(req);
        const result = await runService.rejectRunService(req.params.id, io);
        return res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        return handleControllerError(res, error);
    }
};

exports.retryRun = async (req, res) => {
    try {
        const io = getIO(req);
        const result = await runService.retryRunService(req.params.id, req.body, io);
        return res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        return handleControllerError(res, error);
    }
};

exports.appendRunEvent = async (req, res) => {
    try {
        const io = getIO(req);
        const result = await runService.appendRunEventService(req.params.id, req.body, io);
        return res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        return handleControllerError(res, error);
    }
};
