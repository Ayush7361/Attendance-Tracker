const User = require("../models/User");
const Class = require("../models/Class");
const DayRecord = require("../models/DayRecord");

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

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

// Automatically returns today's scheduled classes and subjects for the teacher based on the Master Class Routine
async function getTodaySchedule(req, res) {
    try {
        const teacher = await User.findById(req.userId);
        if (!teacher || teacher.role !== "teacher") {
            return res.status(403).json({ message: "Forbidden: Teacher account required" });
        }

        const dateStr = req.query.date;
        const targetDate = dateStr ? new Date(dateStr) : new Date();
        const dayKey = DAY_KEYS[targetDate.getDay()]; // e.g. "mon", "tue"

        // Find all classes where teacher is assigned or has routine slots
        const assignedClassIds = (teacher.teacherAssignments || []).map((a) => a.classId);
        const classes = await Class.find({ _id: { $in: assignedClassIds } });

        const todayPeriods = [];

        for (let c of classes) {
            const routineForDay = (c.routine || []).filter((r) => r.day === dayKey);
            
            if (routineForDay.length > 0) {
                for (let r of routineForDay) {
                    // Check if teacher is assigned to this routine slot or assigned to the subject in general
                    const isTeacherForSlot =
                        (r.teacherId && r.teacherId.toString() === teacher._id.toString()) ||
                        (teacher.teacherAssignments || []).some(
                            (a) =>
                                a.classId.toString() === c._id.toString() &&
                                a.subjectName.trim().toLowerCase() === r.subjectName.trim().toLowerCase()
                        );

                    if (isTeacherForSlot) {
                        todayPeriods.push({
                            classId: c._id,
                            className: c.name,
                            subjectName: r.subjectName,
                            timeSlot: r.timeSlot || "",
                            periodNumber: r.periodNumber || 1,
                            day: dayKey
                        });
                    }
                }
            } else {
                // Fallback: If no routine slots defined yet, use flat teacherAssignments for this class
                const flatAssignments = (teacher.teacherAssignments || []).filter(
                    (a) => a.classId.toString() === c._id.toString()
                );
                for (let fa of flatAssignments) {
                    todayPeriods.push({
                        classId: c._id,
                        className: c.name,
                        subjectName: fa.subjectName,
                        timeSlot: "Scheduled Class",
                        periodNumber: 1,
                        day: dayKey
                    });
                }
            }
        }

        res.status(200).json({
            day: dayKey,
            date: targetDate,
            periods: todayPeriods
        });
    } catch (err) {
        console.error("Error fetching today schedule:", err);
        res.status(500).json({ message: "Server error fetching today schedule" });
    }
}

async function getClassRoster(req, res) {
    try {
        const { classId } = req.params;
        const { date, subjectName } = req.query;

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

        // If date and subjectName are provided, check existing DayRecord docs to pre-fill past attendance status for edits
        let existingStatuses = {};
        let isAlreadySubmitted = false;

        if (date && subjectName) {
            const targetDate = new Date(date);
            const studentIds = classDoc.students.map((s) => s._id);

            const records = await DayRecord.find({
                userId: { $in: studentIds },
                date: targetDate
            });

            for (let r of records) {
                const sub = (r.subjects || []).find(
                    (s) => s.name.trim().toLowerCase() === subjectName.trim().toLowerCase()
                );
                if (sub) {
                    existingStatuses[r.userId.toString()] = sub.status;
                    isAlreadySubmitted = true;
                }
            }
        }

        const rosterWithStatus = classDoc.students.map((s) => {
            const status = existingStatuses[s._id.toString()];
            return {
                _id: s._id,
                username: s.username,
                // If past record exists and status is 'missed', isAbsent = true. Otherwise false (default present).
                isAbsent: status === "missed"
            };
        });

        res.status(200).json({
            _id: classDoc._id,
            name: classDoc.name,
            isAlreadySubmitted,
            students: rosterWithStatus
        });
    } catch (err) {
        console.error("Error fetching class roster:", err);
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

async function getClassRoutine(req, res) {
    try {
        const { classId } = req.params;
        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ message: "Class not found" });
        }
        res.status(200).json(classDoc.routine || []);
    } catch (err) {
        res.status(500).json({ message: "Server error fetching routine" });
    }
}

async function saveClassRoutine(req, res) {
    try {
        const { classId } = req.params;
        const { routine } = req.body;

        if (!Array.isArray(routine)) {
            return res.status(400).json({ message: "Routine must be an array of slots" });
        }

        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ message: "Class not found" });
        }

        classDoc.routine = routine;
        await classDoc.save();

        res.status(200).json({ message: "Master Class Routine saved successfully", routine: classDoc.routine });
    } catch (err) {
        console.error("Error saving class routine:", err);
        res.status(500).json({ message: "Server error saving routine" });
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
    getTodaySchedule,
    getClassRoster,
    submitAttendance,
    getClassRoutine,
    saveClassRoutine,
    getTeacherCoveredSubjectsForStudent
};
