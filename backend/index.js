const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/analyze", async (req, res) => {

    try {

        const response = await axios.post(
            "http://localhost:8000/repo-info",
            req.body
        );

        res.json(response.data);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});

app.listen(5000, () => {
    console.log("Server running");
});