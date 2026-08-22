const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const ArchiveRecord = require("../models/ArchiveRecord");

// Get archived semesters
router.get("/", authMiddleware, async (req, res) => {
    try {
        let record = await ArchiveRecord.findOne({ userId: req.userId });
        if (!record) {
            record = await ArchiveRecord.create({ userId: req.userId, semesters: [] });
        }
        res.json(record.semesters);
    } catch (err) {
        res.status(500).json({ message: "Error loading archives", error: err.message });
    }
});

// Add a new semester to archive
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { semesterName, academicYear, gpa, attendancePct, totalStudyHours, notes } = req.body;
        let record = await ArchiveRecord.findOne({ userId: req.userId });
        if (!record) {
            record = new ArchiveRecord({ userId: req.userId, semesters: [] });
        }
        record.semesters.push({
            semesterName,
            academicYear,
            gpa,
            attendancePct,
            totalStudyHours,
            notes,
            archivedAt: new Date()
        });
        await record.save();
        res.json(record.semesters);
    } catch (err) {
        res.status(500).json({ message: "Error saving archive", error: err.message });
    }
});

// Delete an archived semester
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        let record = await ArchiveRecord.findOne({ userId: req.userId });
        if (record) {
            record.semesters = record.semesters.filter((s) => s._id.toString() !== req.params.id);
            await record.save();
        }
        res.json(record ? record.semesters : []);
    } catch (err) {
        res.status(500).json({ message: "Error deleting archive item", error: err.message });
    }
});

module.exports = router;
