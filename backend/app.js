"use strict";

const express = require("express");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");

const runRoutes = require("./routes/run.route");
const { requireApiKey } = require("./middleware/auth");
const { expressCorsOptions } = require("./config/cors");

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors(expressCorsOptions));
app.use(express.json({ limit: "2mb" }));

app.use("/api/runs", requireApiKey, runRoutes);

app.get("/", (_req, res) => {
    res.json({
        message: "OSA Backend Running",
    });
});

// Centralized error handler
app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err);
    res.status(err.status || err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

module.exports = app;
