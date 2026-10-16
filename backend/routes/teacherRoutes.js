const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { requireTeacherRole } = require("../middleware/authMiddleware");
const {
    getAssignments,
    getTodaySchedule,
    getTeacherUnifiedSchedule,
    getClassRoster,
    submitAttendance,
    getClassAnalytics,
    getAuditHistory,
    joinClassWithCode,
    getClassRoutine,
    saveClassRoutine,
    getTeacherCoveredSubjectsForStudent
} = require("../controllers/teacherController");

router.get("/assignments", authMiddleware, requireTeacherRole, getAssignments);
router.get("/today-schedule", authMiddleware, requireTeacherRole, getTodaySchedule);
router.get("/week-schedule", authMiddleware, requireTeacherRole, getTeacherUnifiedSchedule);
router.get("/class/:classId/roster", authMiddleware, requireTeacherRole, getClassRoster);
router.post("/attendance", authMiddleware, requireTeacherRole, submitAttendance);
router.get("/class/:classId/analytics", authMiddleware, requireTeacherRole, getClassAnalytics);
router.get("/audit-history", authMiddleware, requireTeacherRole, getAuditHistory);
router.get("/class/:classId/routine", authMiddleware, requireTeacherRole, getClassRoutine);
router.post("/class/:classId/routine", authMiddleware, requireTeacherRole, saveClassRoutine);

// Student endpoints
router.post("/class/join", authMiddleware, joinClassWithCode);
router.get("/covered-subjects", authMiddleware, getTeacherCoveredSubjectsForStudent);

module.exports = router;
