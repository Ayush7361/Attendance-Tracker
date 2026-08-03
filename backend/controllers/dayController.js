const mongoose = require("mongoose");
const DayRecord = require("../models/DayRecord");

async function saveDay(req, res) {
    try {
        const { date, totalClasses, attendedClasses } = req.body;
        const parsedDate = new Date(date);

        const record = await DayRecord.findOneAndUpdate(
            { userId: req.userId, date: parsedDate },
            { totalClasses, attendedClasses },
            { new: true, upsert: true }
        );
        res.status(200).json(record);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function getDay(req, res) {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ message: "Date is required" });
        }
        const parsedDate = new Date(date);
        const record = await DayRecord.findOne({ userId: req.userId, date: parsedDate });
        res.status(200).json(record || null);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function getMonthSummary(req, res) {
    try {
        const { year, month } = req.query;
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);

        const result = await DayRecord.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(req.userId), date: { $gte: start, $lt: end } } },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalClasses" },
                    attended: { $sum: "$attendedClasses" }
                }
            }
        ]);

        const summary = result[0] || { total: 0, attended: 0 };
        res.status(200).json({ total: summary.total, attended: summary.attended });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function getOverallSummary(req, res) {
    try {
        const result = await DayRecord.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalClasses" },
                    attended: { $sum: "$attendedClasses" }
                }
            }
        ]);

        const summary = result[0] || { total: 0, attended: 0 };
        res.status(200).json({ total: summary.total, attended: summary.attended });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function getMonthRecords(req, res) {
    try {
        const { year, month } = req.query;
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);

        const records = await DayRecord.find({
            userId: req.userId,
            date: { $gte: start, $lt: end }
        });
        res.status(200).json(records);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function deleteRange(req, res) {
    try {
        const { start, end, all } = req.body || {};
        if (all) {
            await DayRecord.deleteMany({ userId: req.userId });
        } else if (start && end) {
            await DayRecord.deleteMany({
                userId: req.userId,
                date: { $gte: new Date(start), $lt: new Date(end) }
            });
        } else {
            return res.status(400).json({ message: "Invalid parameters for deletion" });
        }
        res.status(200).json({ message: "Records deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    saveDay,
    getDay,
    getMonthSummary,
    getOverallSummary,
    getMonthRecords,
    deleteRange
};
