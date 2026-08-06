require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const dayRoutes = require("./routes/dayRoutes");
const deadlineRoutes = require("./routes/deadlineRoutes");
const semesterRoutes = require("./routes/semesterRoutes");
const studyRoutes = require("./routes/studyRoutes");

const app = express();

connectDB();

app.use(express.json());
app.use(cors({
    origin: ["http://localhost:5174", "https://attendance-tracker-pi-blue.vercel.app"]
}));

app.use("/api/auth", authRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/days", dayRoutes);
app.use("/api/deadlines", deadlineRoutes);
app.use("/api/semester-events", semesterRoutes);
app.use("/api/study-sessions", studyRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});