const express = require("express");
const cors = require("cors");

const runRoutes = require("./routes/run.route");
const { requireApiKey } = require("./middleware/auth");


const app = express();

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim());

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Origin is not allowed by CORS."));
    },
    methods: ["GET", "POST", "DELETE"],
}));
app.use(express.json());

app.use("/api/runs", requireApiKey, runRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "OSA Backend Running"
    });
});

module.exports = app;
