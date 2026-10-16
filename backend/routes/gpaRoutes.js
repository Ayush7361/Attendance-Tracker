const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const GpaRecord = require("../models/GpaRecord");

// Get user GPA setup
router.get("/", authMiddleware, async (req, res) => {
    try {
        let record = await GpaRecord.findOne({ userId: req.userId });
        if (!record) {
            record = { targetGpa: 8.5, subjects: [] };
        }
        res.json(record);
    } catch (err) {
        res.status(500).json({ message: "Error loading GPA record" });
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
        res.status(500).json({ message: "Error updating GPA record" });
    }
});

module.exports = router;
