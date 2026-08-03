const Schedule = require("../models/Schedule");

async function getSchedule(req, res) {
    try {
        let schedule = await Schedule.findOne({ userId: req.userId });

        if (!schedule) {
            schedule = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
        }

        res.status(200).json(schedule);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function saveSchedule(req, res) {
    try {
        const { mon, tue, wed, thu, fri, sat, sun } = req.body;

        const schedule = await Schedule.findOneAndUpdate(
            { userId: req.userId },
            {
                mon: mon || [],
                tue: tue || [],
                wed: wed || [],
                thu: thu || [],
                fri: fri || [],
                sat: sat || [],
                sun: sun || []
            },
            { new: true, upsert: true }
        );

        res.status(200).json(schedule);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = { getSchedule, saveSchedule };