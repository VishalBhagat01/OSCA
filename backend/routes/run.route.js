const express = require("express");
const { createRun, getRuns, getRun, deleteRun, approveRun, rejectRun, retryRun, appendRunEvent } = require("../controllers/run.controller");
const router = express.Router();

router.post("/", createRun);
router.get("/", getRuns);
router.get("/:id", getRun);
router.delete("/:id", deleteRun);
router.post("/:id/approve", approveRun);
router.post("/:id/retry", retryRun);
router.post("/:id/reject", rejectRun);
router.post("/:id/events", appendRunEvent);

module.exports = router;