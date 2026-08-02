const MonthRecord = require("../models/MonthRecord");

async function getMonths(req, res) {
    try {
        const months = await MonthRecord.find({ userId: req.userId });
        res.status(200).json(months);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function addWeek(req, res) {
    try {
        const { month, scheduled, attended } = req.body;

        if (attended > scheduled) {
            return res.status(400).json({ message: "Attended cannot exceed scheduled classes" });
        }

        const record = await MonthRecord.findOneAndUpdate(
            { userId: req.userId, month },
            {
                $inc: {
                    total: scheduled,
                    attended: attended
                }
            },
            { new: true, upsert: true }
        );

        res.status(200).json(record);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function resetMonth(req, res) {
    try {
        const { month } = req.params;
        await MonthRecord.findOneAndDelete({ userId: req.userId, month });
        res.status(200).json({ message: "Month cleared" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function resetAll(req, res) {
    try {
        await MonthRecord.deleteMany({ userId: req.userId });
        res.status(200).json({ message: "All data cleared" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = { getMonths, addWeek, resetMonth, resetAll };