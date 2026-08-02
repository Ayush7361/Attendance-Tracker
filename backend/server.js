require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const monthRoutes = require("./routes/monthRoutes");

const app = express();

connectDB();

app.use(express.json());
app.use(cors({
    origin: ["http://localhost:5173", "https://attendance-tracker-pi-blue.vercel.app"]
}));

app.use("/api/auth", authRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/months", monthRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});