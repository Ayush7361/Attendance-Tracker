const Schedule = require("../models/Schedule");

async function getSchedule(req, res) {
    try {
        let schedule = await Schedule.findOne({ userId: req.userId });

        if (!schedule) {
            schedule = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0 };
        }

        res.status(200).json(schedule);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function saveSchedule(req, res) {
    try {
        const { mon, tue, wed, thu, fri, sat } = req.body;

        const schedule = await Schedule.findOneAndUpdate(
            { userId: req.userId },
            { mon, tue, wed, thu, fri, sat },
            { new: true, upsert: true }
        );

        res.status(200).json(schedule);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = { getSchedule, saveSchedule };