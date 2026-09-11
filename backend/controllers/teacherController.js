const User = require("../models/User");
const Class = require("../models/Class");
const DayRecord = require("../models/DayRecord");

async function getAssignments(req, res) {
    try {
        const teacher = await User.findById(req.userId).populate("teacherAssignments.classId", "name");
        if (!teacher || teacher.role !== "teacher") {
            return res.status(403).json({ message: "Forbidden: Teacher account required" });
        }
        res.status(200).json(teacher.teacherAssignments || []);
    } catch (err) {
        res.status(500).json({ message: "Server error fetching assignments" });
    }
}

async function getClassRoster(req, res) {
    try {
        const { classId } = req.params;
        const teacher = await User.findById(req.userId);
        
        if (!teacher || teacher.role !== "teacher") {
            return res.status(403).json({ message: "Forbidden: Teacher account required" });
        }

        const isAssigned = (teacher.teacherAssignments || []).some(
            (a) => a.classId && a.classId.toString() === classId
        );

        if (!isAssigned) {
            return res.status(403).json({ message: "Forbidden: You are not assigned to this class" });
        }

        const classDoc = await Class.findById(classId).populate("students", "username _id");
        if (!classDoc) {
            return res.status(404).json({ message: "Class not found" });
        }

        res.status(200).json({
            _id: classDoc._id,
            name: classDoc.name,
            students: classDoc.students
        });
    } catch (err) {
        res.status(500).json({ message: "Server error fetching roster" });
    }
}

async function submitAttendance(req, res) {
    try {
        const { classId, subjectName, date, absentStudentIds } = req.body;

        if (!classId || !subjectName || !date) {
            return res.status(400).json({ message: "classId, subjectName, and date are required" });
        }

        const teacher = await User.findById(req.userId);
        if (!teacher || teacher.role !== "teacher") {
            return res.status(403).json({ message: "Forbidden: Teacher account required" });
        }

        const isAssigned = (teacher.teacherAssignments || []).some(
            (a) =>
                a.classId &&
                a.classId.toString() === classId &&
                a.subjectName.trim().toLowerCase() === subjectName.trim().toLowerCase()
        );

        if (!isAssigned) {
            return res.status(403).json({
                message: "Forbidden: You are not assigned to this subject for this class"
            });
        }

        const classDoc = await Class.findById(classId).populate("students");
        if (!classDoc) {
            return res.status(404).json({ message: "Class not found" });
        }

        const parsedDate = new Date(date);

        const absentSet = new Set((absentStudentIds || []).map((id) => id.toString()));

        for (let student of classDoc.students) {
            const isAbsent = absentSet.has(student._id.toString());
            const status = isAbsent ? "missed" : "attended";

            let dayRecord = await DayRecord.findOne({
                userId: student._id,
                date: parsedDate
            });

            if (!dayRecord) {
                dayRecord = new DayRecord({
                    userId: student._id,
                    date: parsedDate,
                    totalClasses: 0,
                    attendedClasses: 0,
                    subjects: []
                });
            }

            const existingIndex = dayRecord.subjects.findIndex(
                (s) => s.name.trim().toLowerCase() === subjectName.trim().toLowerCase()
            );

            if (existingIndex >= 0) {
                dayRecord.subjects[existingIndex].status = status;
            } else {
                dayRecord.subjects.push({ name: subjectName, status });
            }

            let tot = 0;
            let att = 0;
            for (let s of dayRecord.subjects) {
                if (s.status !== "cancelled") {
                    tot++;
                    if (s.status === "attended") att++;
                }
            }

            dayRecord.totalClasses = tot;
            dayRecord.attendedClasses = att;

            await dayRecord.save();
        }

        res.status(200).json({
            message: "Attendance submitted successfully",
            updatedCount: classDoc.students.length
        });
    } catch (err) {
        console.error("Error submitting teacher attendance:", err);
        res.status(500).json({ message: "Server error submitting attendance" });
    }
}

async function getTeacherCoveredSubjectsForStudent(req, res) {
    try {
        const studentId = req.userId;
        const studentClasses = await Class.find({ students: studentId });
        if (!studentClasses || studentClasses.length === 0) {
            return res.status(200).json([]);
        }

        const classIds = studentClasses.map((c) => c._id);
        const teachers = await User.find({
            role: "teacher",
            "teacherAssignments.classId": { $in: classIds }
        });

        const coveredSubjects = [];
        for (let t of teachers) {
            for (let a of t.teacherAssignments) {
                if (classIds.some((cid) => cid.toString() === a.classId.toString())) {
                    coveredSubjects.push(a.subjectName);
                }
            }
        }

        res.status(200).json([...new Set(coveredSubjects)]);
    } catch (err) {
        res.status(500).json({ message: "Server error fetching covered subjects" });
    }
}

module.exports = {
    getAssignments,
    getClassRoster,
    submitAttendance,
    getTeacherCoveredSubjectsForStudent
};
