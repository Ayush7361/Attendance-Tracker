require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Class = require("./models/Class");
const DayRecord = require("./models/DayRecord");
const AttendanceAudit = require("./models/AttendanceAudit");
const Notification = require("./models/Notification");

const {
    submitAttendance,
    getClassAnalytics,
    getAuditHistory,
    joinClassWithCode
} = require("./controllers/teacherController");
const { getUserNotifications } = require("./controllers/notificationController");

function createMockReqRes(body = {}, params = {}, query = {}, userId = null, userRole = null) {
    const req = { body, params, query, userId, userRole, headers: {} };
    const res = {
        statusCode: 200,
        data: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.data = payload; return this; }
    };
    return { req, res };
}

async function runTests() {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/attendance-tracker";
        console.log("Connecting to DB for Advanced Suite tests...");
        await mongoose.connect(mongoUri);

        const teacher = await User.findOne({ username: "teacher1" });
        const student1 = await User.findOne({ username: "student1" });
        const student2 = await User.findOne({ username: "student2" });
        const classDoc = await Class.findOne({ name: "IT-2" });

        if (!teacher || !student1 || !student2 || !classDoc) {
            throw new Error("Seed records missing");
        }

        console.log("✓ Seed records found. JoinCode:", classDoc.joinCode);

        // 1. Test joinClassWithCode
        const { req: reqJoin, res: resJoin } = createMockReqRes({ joinCode: "IT2-894A" }, {}, {}, student1._id.toString(), "student");
        await joinClassWithCode(reqJoin, resJoin);
        console.log("Join Class status (expected 200 or 400 if already enrolled):", resJoin.statusCode, resJoin.data.message);

        // 2. Test submitAttendance: Mark student2 absent, student1 present -> Creates Audit + Notifications
        const testDate = "2026-09-18";
        const submitBody = {
            classId: classDoc._id.toString(),
            subjectName: "Data Structures",
            date: testDate,
            absentStudentIds: [student2._id.toString()]
        };
        const { req: reqSub, res: resSub } = createMockReqRes(submitBody, {}, {}, teacher._id.toString(), "teacher");
        await submitAttendance(reqSub, resSub);
        console.log("Submit Attendance status:", resSub.statusCode, resSub.data);
        if (resSub.statusCode !== 200) {
            throw new Error("submitAttendance failed");
        }

        // 3. Verify AttendanceAudit document created
        const audit = await AttendanceAudit.findOne({ classId: classDoc._id, subjectName: "Data Structures" }).sort({ createdAt: -1 });
        console.log("Audit created:", { actionType: audit.actionType, present: audit.presentCount, absent: audit.absentCount });
        if (!audit) {
            throw new Error("AttendanceAudit record creation failed");
        }

        // 4. Verify Notification document created for student2
        const notif = await Notification.findOne({ userId: student2._id }).sort({ createdAt: -1 });
        console.log("Student 2 Notification:", { title: notif.title, message: notif.message, type: notif.type });
        if (!notif) {
            throw new Error("Notification record creation failed");
        }

        // 5. Test getClassAnalytics
        const { req: reqAna, res: resAna } = createMockReqRes({}, { classId: classDoc._id.toString() }, {}, teacher._id.toString(), "teacher");
        await getClassAnalytics(reqAna, resAna);
        console.log("Class Analytics status:", resAna.statusCode, "Avg:", resAna.data.classAveragePct + "%", "At risk count:", resAna.data.atRiskCount);
        if (resAna.statusCode !== 200) {
            throw new Error("getClassAnalytics failed");
        }

        // 6. Test getAuditHistory
        const { req: reqAud, res: resAud } = createMockReqRes({}, {}, {}, teacher._id.toString(), "teacher");
        await getAuditHistory(reqAud, resAud);
        console.log("Audit History status:", resAud.statusCode, "Audit entries count:", resAud.data.length);
        if (resAud.statusCode !== 200 || resAud.data.length === 0) {
            throw new Error("getAuditHistory failed");
        }

        // 7. Test getUserNotifications for student2
        const { req: reqNf, res: resNf } = createMockReqRes({}, {}, {}, student2._id.toString(), "student");
        await getUserNotifications(reqNf, resNf);
        console.log("Student Notifications status:", resNf.statusCode, "Notifications count:", resNf.data.notifications.length);
        if (resNf.statusCode !== 200 || resNf.data.notifications.length === 0) {
            throw new Error("getUserNotifications failed");
        }

        console.log("\n✅ ALL ADVANCED ENTERPRISE SUITE TESTS PASSED! ✅\n");
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("Test failure:", err);
        process.exit(1);
    }
}

runTests();
