const StudySession = require("../models/StudySession");

async function getStudySessions(req, res) {
    try {
        const sessions = await StudySession.find({ userId: req.userId }).sort({ date: -1 });
        res.status(200).json(sessions);
    } catch (err) {
        console.error("Error fetching study sessions:", err);
        res.status(500).json({ message: "Server error" });
    }
}

async function saveStudySession(req, res) {
    try {
        const { subject, duration, mode, date, completed, notes } = req.body;
        if (!subject || duration === undefined) {
            return res.status(400).json({ message: "Subject and duration are required" });
        }

        const session = new StudySession({
            userId: req.userId,
            subject,
            duration,
            mode: mode || "stopwatch",
            date: date || new Date(),
            completed: completed !== undefined ? completed : true,
            notes: notes || ""
        });

        await session.save();
        res.status(201).json(session);
    } catch (err) {
        console.error("Error saving study session:", err);
        res.status(500).json({ message: "Server error" });
    }
}

async function deleteStudySession(req, res) {
    try {
        const session = await StudySession.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!session) {
            return res.status(404).json({ message: "Study session not found" });
        }

        res.status(200).json({ message: "Session deleted successfully" });
    } catch (err) {
        console.error("Error deleting study session:", err);
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    getStudySessions,
    saveStudySession,
    deleteStudySession
};
