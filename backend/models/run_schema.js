const mongoose = require("mongoose");

const RunSchema = new mongoose.Schema(
{
    repository: {
        url: String,
    },

    issue: {
        number: Number,
        title: String,
    },

    status: {
        type: String,
        enum: [
            "queued",
            "running",
            "completed",
            "failed",
        ],
        default: "queued",
    },

    startedAt: Date,
    completedAt: Date,

    result: mongoose.Schema.Types.Mixed,

    error: String,

    executionTrace: [
        mongoose.Schema.Types.Mixed
    ]
},
{
    timestamps: true,
});

module.exports = mongoose.models.Run || mongoose.model("Run", RunSchema);