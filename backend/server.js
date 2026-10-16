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
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://attendance-tracker-pi-blue.vercel.app",
    ...String(process.env.CLIENT_ORIGIN || "").split(",").map((origin) => origin.trim()).filter(Boolean)
];

connectDB();

app.use(express.json());
app.use(cors({
    origin(origin, callback) {
        // Requests without an Origin header include local scripts and health checks.
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Origin not allowed by CORS"));
    }
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

app.use((err, req, res, next) => {
    if (err?.message === "Origin not allowed by CORS") {
        return res.status(403).json({ message: "Origin is not allowed" });
    }
    console.error(err);
    return res.status(500).json({ message: "Server error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
