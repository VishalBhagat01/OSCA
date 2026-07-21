require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const connectDB = require('./config/db');
const runRoutes = require("./routes/run.route");


const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/runs", runRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "OSA Backend Running"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Backend running on ${PORT}`);
});