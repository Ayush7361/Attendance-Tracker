require("dotenv").config();

if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not set. Add it to backend/.env before starting the server.");
    process.exit(1);
}

if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set. Add it to backend/.env before starting the server.");
    process.exit(1);
}

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const dayRoutes = require("./routes/dayRoutes");
const deadlineRoutes = require("./routes/deadlineRoutes");
const semesterRoutes = require("./routes/semesterRoutes");
const studyRoutes = require("./routes/studyRoutes");
const gpaRoutes = require("./routes/gpaRoutes");
const archiveRoutes = require("./routes/archiveRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

connectDB();

app.use(express.json());
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "https://attendance-tracker-pi-blue.vercel.app"]
}));

app.use("/api/auth", authRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/days", dayRoutes);
app.use("/api/deadlines", deadlineRoutes);
app.use("/api/semester-events", semesterRoutes);
app.use("/api/study-sessions", studyRoutes);
app.use("/api/gpa", gpaRoutes);
app.use("/api/archive", archiveRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});