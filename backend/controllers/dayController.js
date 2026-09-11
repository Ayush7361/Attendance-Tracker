const mongoose = require("mongoose");
const DayRecord = require("../models/DayRecord");
const Class = require("../models/Class");
const User = require("../models/User");

async function saveDay(req, res) {
    try {
        const { date, totalClasses, attendedClasses, isHoliday, subjects } = req.body;
        const parsedDate = new Date(date);

        // Server-side check for teacher-covered subjects
        const studentClasses = await Class.find({ students: req.userId });
        if (studentClasses && studentClasses.length > 0) {
            const classIds = studentClasses.map((c) => c._id);
            const teachers = await User.find({
                role: "teacher",
                "teacherAssignments.classId": { $in: classIds }
            });

            const coveredSubjects = new Set();
            teachers.forEach((t) => {
                (t.teacherAssignments || []).forEach((a) => {
                    if (a.classId && classIds.some((cid) => cid.toString() === a.classId.toString())) {
                        coveredSubjects.add(a.subjectName.trim().toLowerCase());
                    }
                });
            });

            if (coveredSubjects.size > 0 && Array.isArray(subjects)) {
                const existingRecord = await DayRecord.findOne({ userId: req.userId, date: parsedDate });

                for (let s of subjects) {
                    const subLower = (s.name || "").trim().toLowerCase();
                    if (coveredSubjects.has(subLower)) {
                        const existingSub = existingRecord
                            ? existingRecord.subjects.find((es) => es.name.trim().toLowerCase() === subLower)
                            : null;

                        if (!existingSub || existingSub.status !== s.status) {
                            return res.status(403).json({
                                message: `Attendance for '${s.name}' is teacher-verified and cannot be self-reported.`
                            });
                        }
                    }
                }
            }
        }

        let finalTotal = Number(totalClasses) || 0;
        let finalAttended = Number(attendedClasses) || 0;

        if (isHoliday) {
            finalTotal = 0;
            finalAttended = 0;
        } else if (Array.isArray(subjects) && subjects.length > 0) {
            let tot = 0;
            let att = 0;
            for (let s of subjects) {
                if (s.status !== "cancelled") {
                    tot++;
                    if (s.status === "attended") {
                        att++;
                    }
                }
            }
            finalTotal = tot;
            finalAttended = att;
        }

        const record = await DayRecord.findOneAndUpdate(
            { userId: req.userId, date: parsedDate },
            {
                totalClasses: finalTotal,
                attendedClasses: finalAttended,
                isHoliday: Boolean(isHoliday),
                subjects: Array.isArray(subjects) ? subjects : []
            },
            { new: true, upsert: true }
        );
        res.status(200).json(record);
    } catch (err) {
        console.error("Error in saveDay:", err);
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

async function getSubjectBreakdown(req, res) {
    try {
        const records = await DayRecord.find({ userId: req.userId });
        const subjectMap = {};

        for (let r of records) {
            for (let s of r.subjects || []) {
                const name = (s.name || "").trim();
                if (!name) continue;

                if (!subjectMap[name]) {
                    subjectMap[name] = { total: 0, attended: 0, missed: 0, cancelled: 0 };
                }

                if (s.status === "attended") {
                    subjectMap[name].attended++;
                    subjectMap[name].total++;
                } else if (s.status === "missed") {
                    subjectMap[name].missed++;
                    subjectMap[name].total++;
                } else if (s.status === "cancelled") {
                    subjectMap[name].cancelled++;
                }
            }
        }

        const result = Object.keys(subjectMap).map((name) => {
            const stats = subjectMap[name];
            const pct = stats.total > 0 ? (stats.attended / stats.total) * 100 : 0;

            // Safe bunk & recovery formula for 75% target
            const maxBunks = Math.max(0, Math.floor((stats.attended - 0.75 * stats.total) / 0.75));
            const recoveryNeeded = stats.total > 0 && pct < 75 ? Math.max(0, Math.ceil((0.75 * stats.total - stats.attended) / 0.25)) : 0;

            return {
                subjectName: name,
                total: stats.total,
                attended: stats.attended,
                missed: stats.missed,
                cancelled: stats.cancelled,
                percentage: Number(pct.toFixed(1)),
                safeBunks: maxBunks,
                recoveryNeeded
            };
        });

        res.status(200).json(result);
    } catch (err) {
        console.error("Error fetching subject breakdown:", err);
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
    getSubjectBreakdown,
    deleteRange
};
