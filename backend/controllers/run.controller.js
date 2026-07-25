const Run = require("../models/run_schema");
const { processRun } = require("../services/runProcessor");
const mongoose = require("mongoose");

exports.createRun = async (req, res) => {
    try {
        const io = req.app.get("io");

        const {
            repoUrl,
            issueNumber,
            issueBody = "",
            labels = [],
            comments = [],
        } = req.body;

        const issueTitle = req.body.issueTitle || `Issue #${issueNumber}`;

        if (!repoUrl || !issueNumber) {
            return res.status(400).json({
                success: false,
                message: "repoUrl and issueNumber are required.",
            });
        }

        const run = await Run.create({
            repository: {
                url: repoUrl,
            },
            issue: {
                number: issueNumber,
                title: issueTitle,
                body: issueBody,
            },
            status: "queued",
        });

        processRun(
            io,
            run._id,
            {
                repo_url: repoUrl,
                issue_number: issueNumber,
                issue_title: issueTitle,
                issue_body: issueBody,
                labels,
                comments,
            }
        );

        return res.status(202).json({
            success: true,
            message: "Run queued successfully.",
            runId: run._id,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};



exports.getRuns = async (req, res) => {
    try {

        const runs = await Run.find()
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: runs.length,
            runs
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



exports.getRun = async (req, res) => {

    try {

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({
                success: false,
                message: "Invalid run id.",
            });
        }

        const run = await Run.findById(req.params.id);

        if (!run) {
            return res.status(404).json({
                success: false,
                message: "Run not found."
            });
        }

        return res.status(200).json({
            success: true,
            run
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }

};



exports.deleteRun = async (req, res) => {

    try {

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({
                success: false,
                message: "Invalid run id.",
            });
        }

        const run = await Run.findById(req.params.id);

        if (!run) {
            return res.status(404).json({
                success: false,
                message: "Run not found."
            });
        }

        await run.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Run deleted successfully."
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }

};

exports.approveRun = async (req, res) => {

    try {
        const io = req.app.get("io");
        
        const run = await Run.findById(req.params.id);

        if(!run) {
            return res.status(404).json({
                success: false,
                message: "Run not found."
            });
        }

        if(run.status !== "awaiting_approval") {
            return res.status(400).json({
                success: false,
                message: "Run is not awaiting approval."
            });
        }

        run.status = "completed";
        await run.save();

        io.emit("run:update", {
            runId: run._id.toString(),
            status: "completed",
        });

        return res.status(200).json({
            success: true,
            message: "Run approved successfully."
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.rejectRun = async (req, res) => {

    try {
        const io = req.app.get("io");
        
        const run = await Run.findById(req.params.id);

        if(!run) {
            return res.status(404).json({
                success: false,
                message: "Run not found."
            });
        }

        if(run.status !== "awaiting_approval") {
            return res.status(400).json({
                success: false,
                message: "Run is not awaiting approval."
            });
        }

        run.status = "rejected";
        await run.save();

        io.emit("run:update", {
            runId: run._id.toString(),
            status: run.status,
        });

        return res.status(200).json({
            success: true,
            message: "Run rejected successfully."
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.retryRun = async (req , res) => {
    try {
        const io = req.app.get("io");
        
        const run = await Run.findById(req.params.id);

        const { feedback } = req.body;

        if(!feedback?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Feedback is required."
            });
        }

        if(!run) {
            return res.status(404).json({
                success: false,
                message: "Run not found."
            });
        }

        if(run.status !== "awaiting_approval") {
            return res.status(400).json({
                success: false,
                message: "Run is not awaiting approval."
            });
        }

        run.reviews.push({
            action: "retry",
            feedback ,
            timestamp: new Date(),
        });

        run.status = "running";

        await run.save();

        io.emit("run:update", {
            runId: run._id.toString(),
            status: run.status,
        });
        
        const previousContext = {
            analysis: run.result?.analysis || {},

            patch: run.result?.proposed_patch?.diff || "",
        };

        processRun(io, run._id, {
            repo_url: run.repository.url,
            issue_number: run.issue.number,
            issue_title: run.issue.title,
            issue_body: run.issue?.body || "",
            feedback: feedback,
            previous_result: run.result,
            retry: true,
        });

        return res.status(200).json({
            success: true,
            message: "Run retried successfully."
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.appendRunEvent = async (req, res) => {
    try {
        const { event } = req.body;
        if (!event) {
            return res.status(400).json({
                success: false,
                message: "Event data is required."
            });
        }

        const run = await Run.findByIdAndUpdate(
            req.params.id,
            { $push: { executionTrace: event } },
            { new: true }
        );

        if (!run) {
            return res.status(404).json({
                success: false,
                message: "Run not found."
            });
        }

        const io = req.app.get("io");
        if (io) {
            io.emit("run:event", {
                runId: run._id.toString(),
                event,
                executionTrace: run.executionTrace,
            });

            io.emit("run:update", {
                runId: run._id.toString(),
                status: run.status,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Event appended successfully."
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};