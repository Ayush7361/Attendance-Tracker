const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { requireTeacherRole } = require("../middleware/authMiddleware");
const {
    getAssignments,
    getClassRoster,
    submitAttendance,
    getTeacherCoveredSubjectsForStudent
} = require("../controllers/teacherController");

router.get("/assignments", authMiddleware, requireTeacherRole, getAssignments);
router.get("/class/:classId/roster", authMiddleware, requireTeacherRole, getClassRoster);
router.post("/attendance", authMiddleware, requireTeacherRole, submitAttendance);

// Student read-only helper route to know which subjects are teacher-covered for their class
router.get("/covered-subjects", authMiddleware, getTeacherCoveredSubjectsForStudent);

module.exports = router;
