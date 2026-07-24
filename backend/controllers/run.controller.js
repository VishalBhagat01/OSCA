const Run = require("../models/run_schema");
const { processRun } = require("../services/runProcessor");

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