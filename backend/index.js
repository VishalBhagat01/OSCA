const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: (process.env.FRONTEND_ORIGIN || "http://localhost:5173").split(","),
        methods: ["GET", "POST"],
    },
});

app.set("io", io);

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
