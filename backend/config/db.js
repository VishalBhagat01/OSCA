const mongoose = require("mongoose");
const config = require("./env");

const connectDB = async () => {
    try {
        await mongoose.connect(config.mongoUri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("DB Connected");
    } catch (error) {
        console.error("DB connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
