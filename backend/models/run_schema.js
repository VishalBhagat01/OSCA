const mongoose = require("mongoose");

const RunSchema = new mongoose.Schema(
{
    repository: {
        url: String,
    },

    issue: {
        number: Number,
        title: String,
        body: String,
    },

    status: {
        type: String,
        enum: [
            "queued",
            "running",
            "awaiting_approval",
            "completed",
            "failed",
            "rejected",
        ],
        default: "queued",
    },

    reviews: [
        {
            action: {
                type: String,
                enum: ["approved", "retry", "rejected"],
            },
            feedback: String,
            timestamp: {
                type: Date,
                default: Date.now,
            },
        },
    ],

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