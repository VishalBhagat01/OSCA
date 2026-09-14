"use strict";

const { SOCKET_EVENTS } = require("../constants/run.constants");

/**
 * Emits a run:update event over Socket.IO if io instance is present.
 * @param {object|null} io - Socket.IO server instance
 * @param {string} runId - Run document ID
 * @param {string} status - New run status
 */
function emitRunUpdate(io, runId, status) {
    if (!io || !runId) return;
    io.emit(SOCKET_EVENTS.RUN_UPDATE, {
        runId: runId.toString(),
        status,
    });
}

/**
 * Emits a run:event event over Socket.IO if io instance is present.
 * @param {object|null} io - Socket.IO server instance
 * @param {string} runId - Run document ID
 * @param {object} event - Live execution trace event
 * @param {Array} executionTrace - Full execution trace array
 */
function emitRunEvent(io, runId, event, executionTrace) {
    if (!io || !runId) return;
    io.emit(SOCKET_EVENTS.RUN_EVENT, {
        runId: runId.toString(),
        event,
        executionTrace,
    });
}

module.exports = {
    emitRunUpdate,
    emitRunEvent,
};
