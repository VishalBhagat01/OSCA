"use strict";

const RUN_STATUS = Object.freeze({
    QUEUED: "queued",
    RUNNING: "running",
    PUBLISHING: "publishing",
    AWAITING_APPROVAL: "awaiting_approval",
    COMPLETED: "completed",
    FAILED: "failed",
    REJECTED: "rejected",
});

const ALL_RUN_STATUSES = Object.freeze(Object.values(RUN_STATUS));

const REVIEW_ACTION = Object.freeze({
    APPROVED: "approved",
    RETRY: "retry",
    REJECTED: "rejected",
});

const ALL_REVIEW_ACTIONS = Object.freeze(Object.values(REVIEW_ACTION));

const SOCKET_EVENTS = Object.freeze({
    RUN_UPDATE: "run:update",
    RUN_EVENT: "run:event",
});

module.exports = {
    RUN_STATUS,
    ALL_RUN_STATUSES,
    REVIEW_ACTION,
    ALL_REVIEW_ACTIONS,
    SOCKET_EVENTS,
};
