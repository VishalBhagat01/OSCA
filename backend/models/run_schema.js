const mongoose = require("mongoose");
const { ALL_RUN_STATUSES, RUN_STATUS, ALL_REVIEW_ACTIONS } = require("../constants/run.constants");

const RunSchema = new mongoose.Schema(
    {
        repository: {
            url: String,
        },

        issue: {
            number: Number,
            title: String,
            body: String,
            labels: [String],
            comments: [String],
        },

        status: {
            type: String,
            enum: ALL_RUN_STATUSES,
            default: RUN_STATUS.QUEUED,
        },

        reviews: [
            {
                action: {
                    type: String,
                    enum: ALL_REVIEW_ACTIONS,
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

        pullRequest: {
            number: Number,
            url: String,
            branch: String,
            commit: String,
            isDraft: Boolean,
        },

        executionTrace: [
            mongoose.Schema.Types.Mixed,
        ],
    },
    {
        timestamps: true,
    }
);

// Indexes for common query patterns
RunSchema.index({ status: 1 });
RunSchema.index({ createdAt: -1 });
RunSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.models.Run || mongoose.model("Run", RunSchema);
