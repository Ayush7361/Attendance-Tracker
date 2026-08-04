const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    getDeadlines,
    getDeadline,
    createDeadline,
    updateDeadline,
    deleteDeadline,
    getAnalytics,
    getSubjects,
    getForecast,
    getInsights,
    rescheduleDeadline
} = require("../controllers/deadlineController");

router.get("/analytics", authMiddleware, getAnalytics);
router.get("/forecast", authMiddleware, getForecast);
router.get("/insights", authMiddleware, getInsights);
router.get("/subjects", authMiddleware, getSubjects);
router.post("/:id/reschedule", authMiddleware, rescheduleDeadline);
router.get("/", authMiddleware, getDeadlines);
router.get("/:id", authMiddleware, getDeadline);
router.post("/", authMiddleware, createDeadline);
router.put("/:id", authMiddleware, updateDeadline);
router.delete("/:id", authMiddleware, deleteDeadline);

module.exports = router;
