const express = require("express");
const cors = require("cors");

const runRoutes = require("./routes/run.route");


const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/runs", runRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "OSA Backend Running"
    });
});

module.exports = app;