/**
 * Shared run status constants and UI configuration.
 */

export const RUN_STATUS = Object.freeze({
  QUEUED: "queued",
  RUNNING: "running",
  PUBLISHING: "publishing",
  AWAITING_APPROVAL: "awaiting_approval",
  COMPLETED: "completed",
  FAILED: "failed",
  REJECTED: "rejected",
});

export const ACTIVE_STATUSES = Object.freeze([
  RUN_STATUS.RUNNING,
  RUN_STATUS.QUEUED,
  RUN_STATUS.PUBLISHING,
]);

export const STATUS_FILTERS = Object.freeze([
  { id: "all", label: "All Runs" },
  { id: "running", label: "Active", statuses: ["running", "queued", "publishing"] },
  { id: "awaiting_approval", label: "Awaiting Review", statuses: ["awaiting_approval"] },
  { id: "completed", label: "Completed", statuses: ["completed"] },
  { id: "failed", label: "Failed", statuses: ["failed", "rejected"] },
]);
