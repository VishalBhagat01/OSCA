"use strict";

const config = require("./env");

const DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
];

const envOrigins = config.frontendOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = new Set([...DEFAULT_ORIGINS, ...envOrigins]);

function isOriginAllowed(origin) {
    if (!origin) return true;
    if (allowedOrigins.has(origin)) return true;
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return true;
    if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return true;
    return false;
}

function corsOriginDelegate(origin, callback) {
    if (isOriginAllowed(origin)) {
        return callback(null, true);
    }
    return callback(new Error("Origin is not allowed by CORS."));
}

const expressCorsOptions = {
    origin: corsOriginDelegate,
    methods: ["GET", "POST", "DELETE"],
};

const socketCorsOptions = {
    origin: corsOriginDelegate,
    methods: ["GET", "POST"],
};

module.exports = {
    isOriginAllowed,
    corsOriginDelegate,
    expressCorsOptions,
    socketCorsOptions,
};
