const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const GpaRecord = require("../models/GpaRecord");

// Get user GPA setup
router.get("/", authMiddleware, async (req, res) => {
    try {
        let record = await GpaRecord.findOne({ userId: req.userId });
        if (!record) {
            record = await GpaRecord.create({
                userId: req.userId,
                targetGpa: 8.5,
                subjects: [
                    { name: "Mathematics", credits: 4, internalMarks: 38, totalInternal: 50, targetGrade: "A", finalExamWeight: 50 },
                    { name: "Data Structures", credits: 4, internalMarks: 42, totalInternal: 50, targetGrade: "A+", finalExamWeight: 50 },
                    { name: "Computer Networks", credits: 3, internalMarks: 35, totalInternal: 50, targetGrade: "B+", finalExamWeight: 50 },
                    { name: "Digital Lab", credits: 1, internalMarks: 45, totalInternal: 50, targetGrade: "A+", finalExamWeight: 50 }
                ]
            });
        }
        res.json(record);
    } catch (err) {
        res.status(500).json({ message: "Error loading GPA record", error: err.message });
    }
});

// Update user GPA setup
router.put("/", authMiddleware, async (req, res) => {
    try {
        const { targetGpa, subjects } = req.body;
        let record = await GpaRecord.findOneAndUpdate(
            { userId: req.userId },
            { targetGpa, subjects },
            { new: true, upsert: true }
        );
        res.json(record);
    } catch (err) {
        res.status(500).json({ message: "Error updating GPA record", error: err.message });
    }
});

module.exports = router;
