const express = require("express");
const { createRun,getRuns,getRun,deleteRun } = require("../controllers/run.controller");
const router = express.Router();

router.post("/" , createRun);
router.get("/" , getRuns);
router.get("/:id", getRun);
router.delete("/:id", deleteRun);

module.exports = router;