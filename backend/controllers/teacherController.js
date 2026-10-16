const User = require("../models/User");
const Class = require("../models/Class");
const DayRecord = require("../models/DayRecord");
const AttendanceAudit = require("../models/AttendanceAudit");
const Notification = require("../models/Notification");

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

async function getAssignments(req, res) {
    try {
        const teacher = await User.findById(req.userId).populate("teacherAssignments.classId", "name joinCode");
        if (!teacher || teacher.role !== "teacher") {
            return res.status(403).json({ message: "Forbidden: Teacher account required" });
        }
        res.status(200).json(teacher.teacherAssignments || []);
    } catch (err) {
        res.status(500).json({ message: "Server error fetching assignments" });
    }
}

async function getTodaySchedule(req, res) {
    try {
        const teacher = await User.findById(req.userId);
        if (!teacher || teacher.role !== "teacher") {
            return res.status(403).json({ message: "Forbidden: Teacher account required" });
        }

        const dateStr = req.query.date;
        const targetDate = dateStr ? new Date(dateStr) : new Date();
        const dayKey = DAY_KEYS[targetDate.getDay()];

        const assignedClassIds = (teacher.teacherAssignments || []).map((a) => a.classId);
        const classes = await Class.find({ _id: { $in: assignedClassIds } });

        const todayPeriods = [];

        for (let c of classes) {
            const routineForDay = (c.routine || []).filter((r) => r.day === dayKey);

            if (routineForDay.length > 0) {
                for (let r of routineForDay) {
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
                const flatAssignments = (teacher.teacherAssignments || []).filter(
                    (a) => a.classId.toString() === c._id.toString()
                );
                for (let fa of flatAssignments) {
                    todayPeriods.push({
                        classId: c._id,
                        className: c.name,
                        subjectName: fa.subjectName,
                        timeSlot: "Scheduled Period",
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

async function getTeacherUnifiedSchedule(req, res) {
    try {
        const teacher = await User.findById(req.userId);
        if (!teacher || teacher.role !== "teacher") {
            return res.status(403).json({ message: "Forbidden: Teacher account required" });
        }

        const assignedClassIds = (teacher.teacherAssignments || []).map((a) => a.classId);
        const classes = await Class.find({ _id: { $in: assignedClassIds } });

        const scheduleByDay = {
            mon: [],
            tue: [],
            wed: [],
            thu: [],
            fri: [],
            sat: [],
            sun: []
        };

        for (let c of classes) {
            for (let r of c.routine || []) {
                const isTeacherForSlot =
                    (r.teacherId && r.teacherId.toString() === teacher._id.toString()) ||
                    (teacher.teacherAssignments || []).some(
                        (a) =>
                            a.classId.toString() === c._id.toString() &&
                            a.subjectName.trim().toLowerCase() === r.subjectName.trim().toLowerCase()
                    );

                if (isTeacherForSlot && scheduleByDay[r.day]) {
                    scheduleByDay[r.day].push({
                        classId: c._id,
                        className: c.name,
                        subjectName: r.subjectName,
                        timeSlot: r.timeSlot || "",
                        periodNumber: r.periodNumber || 1
                    });
                }
            }
        }

        // Sort period slots
        Object.keys(scheduleByDay).forEach((day) => {
            scheduleByDay[day].sort((a, b) => a.periodNumber - b.periodNumber);
        });

        res.status(200).json(scheduleByDay);
    } catch (err) {
        console.error("Error fetching teacher unified schedule:", err);
        res.status(500).json({ message: "Server error" });
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
                isAbsent: status === "missed"
            };
        });

        res.status(200).json({
            _id: classDoc._id,
            name: classDoc.name,
            joinCode: classDoc.joinCode,
            isAlreadySubmitted,
            students: rosterWithStatus
        });
    } catch (err) {
        console.error("Error fetching class roster:", err);
        res.status(500).json({ message: "Server error fetching roster" });
    }
}

async function getAllStudents(req, res) {
    try {
        const teacher = await User.findById(req.userId);
        if (!teacher || teacher.role !== "teacher") {
            return res.status(403).json({ message: "Forbidden: Teacher account required" });
        }

        const students = await User.find({ role: "student" }).select("username _id createdAt");
        const studentIds = students.map((s) => s._id);

        const classes = await Class.find({ students: { $in: studentIds } });
        const dayRecords = await DayRecord.find({ userId: { $in: studentIds } });

        const studentMap = {};
        students.forEach((s) => {
            studentMap[s._id.toString()] = {
                _id: s._id,
                username: s.username,
                classes: [],
                totalClasses: 0,
                attendedClasses: 0
            };
        });

        classes.forEach((c) => {
            c.students.forEach((sid) => {
                const sKey = sid.toString();
                if (studentMap[sKey]) {
                    studentMap[sKey].classes.push({ _id: c._id, name: c.name, joinCode: c.joinCode });
                }
            });
        });

        dayRecords.forEach((r) => {
            const sKey = r.userId.toString();
            if (studentMap[sKey]) {
                studentMap[sKey].totalClasses += r.totalClasses || 0;
                studentMap[sKey].attendedClasses += r.attendedClasses || 0;
            }
        });

        const result = Object.values(studentMap).map((st) => {
            const pct = st.totalClasses > 0 ? (st.attendedClasses / st.totalClasses) * 100 : 0;
            return {
                ...st,
                overallAttendancePct: Number(pct.toFixed(1))
            };
        });

        res.status(200).json(result);
    } catch (err) {
        console.error("Error fetching all students:", err);
        res.status(500).json({ message: "Server error" });
    }
}

async function addStudentToClass(req, res) {
    try {
        const { classId } = req.params;
        const { username } = req.body;

        if (!username || !username.trim()) {
            return res.status(400).json({ message: "Username is required" });
        }

        const student = await User.findOne({
            username: username.trim(),
            role: "student"
        });

        if (!student) {
            return res.status(404).json({ message: `Student username '${username}' not found.` });
        }

        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ message: "Class not found" });
        }

        const isAlreadyInClass = classDoc.students.some((s) => s.toString() === student._id.toString());
        if (isAlreadyInClass) {
            return res.status(400).json({ message: `'${student.username}' is already in ${classDoc.name}` });
        }

        classDoc.students.push(student._id);
        await classDoc.save();

        res.status(200).json({
            message: `Added '${student.username}' to ${classDoc.name}!`,
            student: { _id: student._id, username: student.username }
        });
    } catch (err) {
        console.error("Error adding student to class:", err);
        res.status(500).json({ message: "Server error" });
    }
}

async function removeStudentFromClass(req, res) {
    try {
        const { classId, studentId } = req.params;
        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ message: "Class not found" });
        }

        classDoc.students = classDoc.students.filter((s) => s.toString() !== studentId);
        await classDoc.save();

        res.status(200).json({ message: "Student removed from class roster" });
    } catch (err) {
        console.error("Error removing student from class:", err);
        res.status(500).json({ message: "Server error" });
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

        const previousAudit = await AttendanceAudit.findOne({
            classId,
            subjectName: subjectName.trim(),
            date: parsedDate
        });

        const actionType = previousAudit ? "CORRECTION" : "INITIAL_SUBMISSION";

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

            const dateFormatted = parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const notifMsg = isAbsent
                ? `Prof. ${teacher.username} marked you ABSENT for ${subjectName} on ${dateFormatted}.`
                : `Prof. ${teacher.username} logged your attendance for ${subjectName} on ${dateFormatted}: PRESENT.`;

            await Notification.create({
                userId: student._id,
                title: `Attendance Logged: ${subjectName}`,
                message: notifMsg,
                type: isAbsent ? "ATTENDANCE_WARNING" : "ATTENDANCE_LOGGED"
            });
        }

        const absentList = Array.from(absentSet);
        const presentCount = classDoc.students.length - absentList.length;

        await AttendanceAudit.create({
            teacherId: teacher._id,
            classId: classDoc._id,
            subjectName: subjectName.trim(),
            date: parsedDate,
            totalStudents: classDoc.students.length,
            presentCount,
            absentCount: absentList.length,
            absentStudentIds: absentList,
            actionType
        });

        res.status(200).json({
            message: "Attendance submitted successfully",
            updatedCount: classDoc.students.length
        });
    } catch (err) {
        console.error("Error submitting teacher attendance:", err);
        res.status(500).json({ message: "Server error submitting attendance" });
    }
}

async function getClassAnalytics(req, res) {
    try {
        const { classId } = req.params;
        const teacher = await User.findById(req.userId);
        if (!teacher || teacher.role !== "teacher") {
            return res.status(403).json({ message: "Forbidden: Teacher access required" });
        }

        const classDoc = await Class.findById(classId).populate("students", "username _id");
        if (!classDoc) {
            return res.status(404).json({ message: "Class not found" });
        }

        const studentIds = classDoc.students.map((s) => s._id);
        const dayRecords = await DayRecord.find({ userId: { $in: studentIds } });

        const studentStatsMap = {};
        classDoc.students.forEach((s) => {
            studentStatsMap[s._id.toString()] = {
                username: s.username,
                _id: s._id,
                total: 0,
                attended: 0
            };
        });

        dayRecords.forEach((r) => {
            const sid = r.userId.toString();
            if (studentStatsMap[sid]) {
                studentStatsMap[sid].total += r.totalClasses || 0;
                studentStatsMap[sid].attended += r.attendedClasses || 0;
            }
        });

        let totalClassHeld = 0;
        let totalClassAttended = 0;
        const atRiskStudents = [];

        Object.values(studentStatsMap).forEach((st) => {
            totalClassHeld += st.total;
            totalClassAttended += st.attended;
            const pct = st.total > 0 ? (st.attended / st.total) * 100 : 100;

            if (st.total > 0 && pct < 75) {
                atRiskStudents.push({
                    _id: st._id,
                    username: st.username,
                    total: st.total,
                    attended: st.attended,
                    percentage: Number(pct.toFixed(1))
                });
            }
        });

        const classAveragePct = totalClassHeld > 0 ? (totalClassAttended / totalClassHeld) * 100 : 0;

        res.status(200).json({
            classId: classDoc._id,
            className: classDoc.name,
            totalStudents: classDoc.students.length,
            classAveragePct: Number(classAveragePct.toFixed(1)),
            atRiskCount: atRiskStudents.length,
            atRiskStudents
        });
    } catch (err) {
        console.error("Error fetching class analytics:", err);
        res.status(500).json({ message: "Server error" });
    }
}

async function getAuditHistory(req, res) {
    try {
        const teacher = await User.findById(req.userId);
        if (!teacher || teacher.role !== "teacher") {
            return res.status(403).json({ message: "Forbidden: Teacher access required" });
        }

        const audits = await AttendanceAudit.find({ teacherId: req.userId })
            .populate("classId", "name")
            .populate("absentStudentIds", "username")
            .sort({ createdAt: -1 })
            .limit(40);

        res.status(200).json(audits);
    } catch (err) {
        console.error("Error fetching audit history:", err);
        res.status(500).json({ message: "Server error" });
    }
}

async function joinClassWithCode(req, res) {
    try {
        const { joinCode } = req.body;
        if (!joinCode) {
            return res.status(400).json({ message: "joinCode is required" });
        }

        const classDoc = await Class.findOne({ joinCode: joinCode.trim().toUpperCase() });
        if (!classDoc) {
            return res.status(404).json({ message: "Invalid Class Join Code" });
        }

        const isAlreadyEnrolled = classDoc.students.some((s) => s.toString() === req.userId);
        if (isAlreadyEnrolled) {
            return res.status(400).json({ message: "You are already enrolled in this class" });
        }

        classDoc.students.push(req.userId);
        await classDoc.save();

        res.status(200).json({
            message: `Successfully joined ${classDoc.name}!`,
            className: classDoc.name
        });
    } catch (err) {
        console.error("Error joining class:", err);
        res.status(500).json({ message: "Server error joining class" });
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
    getTeacherUnifiedSchedule,
    getClassRoster,
    getAllStudents,
    addStudentToClass,
    removeStudentFromClass,
    submitAttendance,
    getClassAnalytics,
    getAuditHistory,
    joinClassWithCode,
    getClassRoutine,
    saveClassRoutine,
    getTeacherCoveredSubjectsForStudent
};
