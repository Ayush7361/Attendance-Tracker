require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Class = require("./models/Class");
const DayRecord = require("./models/DayRecord");
const {
    getTodaySchedule,
    getClassRoster,
    submitAttendance,
    getClassRoutine,
    saveClassRoutine
} = require("./controllers/teacherController");
const { getSubjectBreakdown } = require("./controllers/dayController");

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
        console.log("Connecting to DB for Routine & Subject Breakdown tests...");
        await mongoose.connect(mongoUri);

        const teacher = await User.findOne({ username: "teacher1" });
        const student1 = await User.findOne({ username: "student1" });
        const student2 = await User.findOne({ username: "student2" });
        const classDoc = await Class.findOne({ name: "IT-2" });

        if (!teacher || !student1 || !student2 || !classDoc) {
            throw new Error("Seed records missing");
        }

        console.log("✓ Seed records found.");

        // 1. Test getTodaySchedule for Monday 2026-09-14
        const { req: reqToday, res: resToday } = createMockReqRes({}, {}, { date: "2026-09-14" }, teacher._id.toString(), "teacher");
        await getTodaySchedule(reqToday, resToday);
        console.log("Today Schedule status:", resToday.statusCode, "Periods count:", resToday.data.periods.length);
        if (resToday.statusCode !== 200 || resToday.data.periods.length === 0) {
            throw new Error("getTodaySchedule failed");
        }

        // 2. Test getClassRoutine & saveClassRoutine
        const { req: reqGetR, res: resGetR } = createMockReqRes({}, { classId: classDoc._id.toString() }, {}, teacher._id.toString(), "teacher");
        await getClassRoutine(reqGetR, resGetR);
        console.log("Get Routine status:", resGetR.statusCode, "Slots count:", resGetR.data.length);
        if (resGetR.statusCode !== 200) {
            throw new Error("getClassRoutine failed");
        }

        // 3. Test submitAttendance for 2026-09-14
        const testDate = "2026-09-14";
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

        // 4. Test getClassRoster with date & subjectName to verify past record pre-fill
        const { req: reqRosEdit, res: resRosEdit } = createMockReqRes({}, { classId: classDoc._id.toString() }, { date: testDate, subjectName: "Data Structures" }, teacher._id.toString(), "teacher");
        await getClassRoster(reqRosEdit, resRosEdit);
        console.log("Edit Roster pre-fill status:", resRosEdit.statusCode, "isAlreadySubmitted:", resRosEdit.data.isAlreadySubmitted);
        if (resRosEdit.statusCode !== 200 || !resRosEdit.data.isAlreadySubmitted) {
            throw new Error("getClassRoster pre-fill verification failed");
        }

        // 5. Test getSubjectBreakdown for student1
        const { req: reqSb, res: resSb } = createMockReqRes({}, {}, {}, student1._id.toString(), "student");
        await getSubjectBreakdown(reqSb, resSb);
        console.log("Subject Breakdown status:", resSb.statusCode, "Subjects:", resSb.data);
        if (resSb.statusCode !== 200 || resSb.data.length === 0) {
            throw new Error("getSubjectBreakdown failed");
        }

        console.log("\n✅ ALL MASTER ROUTINE & SUBJECT BREAKDOWN TESTS PASSED! ✅\n");
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("Test failure:", err);
        process.exit(1);
    }
}

runTests();
