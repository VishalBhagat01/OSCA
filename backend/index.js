"use strict";

const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const config = require("./config/env");
const app = require("./app");
const connectDB = require("./config/db");
const { socketCorsOptions } = require("./config/cors");

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
    cors: socketCorsOptions,
});

app.set("io", io);

io.on("connection", (socket) => {
    socket.on("disconnect", () => {
        // Client disconnected
    });
});

server.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});

// Graceful shutdown
function shutdown(signal) {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
        console.log("HTTP server closed.");
        io.close(() => {
            console.log("Socket.IO closed.");
            mongoose.connection.close(false).then(() => {
                console.log("MongoDB connection closed.");
                process.exit(0);
            });
        });
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
        console.error("Forced shutdown after timeout.");
        process.exit(1);
    }, 10000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
