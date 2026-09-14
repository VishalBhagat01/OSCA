"use strict";

const path = require("path");
const dotenv = require("dotenv");

// Load .env from backend root if not already loaded
dotenv.config({ path: path.join(__dirname, "../.env") });

const port = parseInt(process.env.PORT, 10) || 5000;
const mongoUri = process.env.MONGO_URL || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/osa";
const backendUrl = process.env.BACKEND_URL || `http://127.0.0.1:${port}`;

const config = Object.freeze({
    port,
    mongoUri,
    backendUrl,
    frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    apiKey: process.env.API_KEY || "",
    githubToken: process.env.GITHUB_TOKEN || "",
    agent: Object.freeze({
        apiUrl: process.env.AGENT_API_URL || "http://127.0.0.1:8000",
        apiKey: process.env.AGENT_API_KEY || "",
        callbackToken: process.env.AGENT_CALLBACK_TOKEN || "",
        timeoutMs: parseInt(process.env.AGENT_TIMEOUT_MS, 10) || 900000,
        draftTimeoutMs: parseInt(process.env.AGENT_DRAFT_TIMEOUT_MS, 10) || 60000,
    }),
});

module.exports = config;
