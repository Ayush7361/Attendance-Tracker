const mongoose = require("mongoose");
const DayRecord = require("../models/DayRecord");
const Class = require("../models/Class");
const User = require("../models/User");
const { parseDateKey, monthRangeUtc, isFutureDateKey } = require("../utils/dateKey");
const { mergeStudentSubjects, recalcTotals } = require("../utils/attendanceMath");

async function getCoveredSubjectSet(studentId) {
    const studentClasses = await Class.find({ students: studentId });
    if (!studentClasses.length) return new Set();

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
    return coveredSubjects;
}

async function saveDay(req, res) {
    try {
        const { date, isHoliday, subjects } = req.body;
        const parsedDate = parseDateKey(date);
        if (!parsedDate) {
            return res.status(400).json({ message: "A valid date is required" });
        }
        if (isFutureDateKey(date)) {
            return res.status(400).json({ message: "Future classes cannot be logged as attendance" });
        }

        const coveredSubjects = await getCoveredSubjectSet(req.userId);
        const existingRecord = await DayRecord.findOne({ userId: req.userId, date: parsedDate });

        let nextSubjects = mergeStudentSubjects(
            existingRecord?.subjects || [],
            Array.isArray(subjects) ? subjects : [],
            coveredSubjects
        );

        if (isHoliday) {
            nextSubjects = nextSubjects.filter((s) => s.source === "teacher");
        }
        const { totalClasses: finalTotal, attendedClasses: finalAttended } = recalcTotals(nextSubjects);

        const record = await DayRecord.findOneAndUpdate(
            { userId: req.userId, date: parsedDate },
            {
                totalClasses: finalTotal,
                attendedClasses: finalAttended,
                isHoliday: Boolean(isHoliday) && nextSubjects.every((s) => s.source !== "teacher"),
                subjects: nextSubjects
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
        const parsedDate = parseDateKey(date);
        if (!parsedDate) {
            return res.status(400).json({ message: "A valid date is required" });
        }
        const record = await DayRecord.findOne({ userId: req.userId, date: parsedDate });
        res.status(200).json(record || null);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function getMonthSummary(req, res) {
    try {
        const { year, month } = req.query;
        const { start, end } = monthRangeUtc(year, month);

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
        const { start, end } = monthRangeUtc(year, month);

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

        const targetThreshold = Number(req.query.targetThreshold) || 75;
        const targetDec = targetThreshold / 100;

        const result = Object.keys(subjectMap).map((name) => {
            const stats = subjectMap[name];
            const pct = stats.total > 0 ? (stats.attended / stats.total) * 100 : 0;
            const isSafe = pct >= targetThreshold;

            let maxBunks = 0;
            let recoveryNeeded = 0;
            if (stats.total > 0) {
                if (isSafe) {
                    maxBunks = Math.max(0, Math.floor((stats.attended - targetDec * stats.total) / targetDec));
                } else {
                    const num = targetDec * stats.total - stats.attended;
                    const den = 1 - targetDec;
                    recoveryNeeded = den > 0 ? Math.ceil(num / den) : 0;
                }
            }

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
                date: { $gte: parseDateKey(start), $lt: parseDateKey(end) }
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
