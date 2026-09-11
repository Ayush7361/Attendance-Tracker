require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Class = require("./models/Class");
const DayRecord = require("./models/DayRecord");
const { login } = require("./controllers/authController");
const { getAssignments, getClassRoster, submitAttendance } = require("./controllers/teacherController");
const { saveDay } = require("./controllers/dayController");

// Helper to mock req / res
function createMockReqRes(body = {}, params = {}, query = {}, userId = null, userRole = null) {
    const req = {
        body,
        params,
        query,
        userId,
        userRole,
        headers: {}
    };

    const res = {
        statusCode: 200,
        data: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.data = payload;
            return this;
        }
    };

    return { req, res };
}

async function runVerification() {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/attendance-tracker";
        console.log("Connecting to DB for verification...");
        await mongoose.connect(mongoUri);

        // 1. Fetch teacher1 user
        const teacher = await User.findOne({ username: "teacher1" });
        const student1 = await User.findOne({ username: "student1" });
        const student2 = await User.findOne({ username: "student2" });
        const classDoc = await Class.findOne({ name: "IT-2" });

        if (!teacher || !student1 || !student2 || !classDoc) {
            console.error("Seed data missing. Run seedTeacherData.js first.");
            process.exit(1);
        }

        console.log("✓ Seed records found.");

        // 2. Test getAssignments for teacher
        const { req: reqAsgn, res: resAsgn } = createMockReqRes({}, {}, {}, teacher._id.toString(), "teacher");
        await getAssignments(reqAsgn, resAsgn);
        console.log("Assignments status:", resAsgn.statusCode, resAsgn.data.length, "assignments");
        if (resAsgn.statusCode !== 200 || resAsgn.data.length === 0) {
            throw new Error("getAssignments test failed");
        }

        // 3. Test getClassRoster
        const { req: reqRoster, res: resRoster } = createMockReqRes({}, { classId: classDoc._id.toString() }, {}, teacher._id.toString(), "teacher");
        await getClassRoster(reqRoster, resRoster);
        console.log("Roster status:", resRoster.statusCode, "Students count:", resRoster.data.students.length);
        if (resRoster.statusCode !== 200 || resRoster.data.students.length !== 2) {
            throw new Error("getClassRoster test failed");
        }

        // 4. Test submitAttendance: Mark student2 absent, student1 present
        const testDate = "2026-09-12";
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

        // 5. Verify student1 DayRecord (Attended)
        const day1 = await DayRecord.findOne({ userId: student1._id, date: new Date(testDate) });
        console.log("Student 1 DayRecord:", { total: day1.totalClasses, attended: day1.attendedClasses, subjects: day1.subjects });
        if (day1.totalClasses !== 1 || day1.attendedClasses !== 1 || day1.subjects[0].status !== "attended") {
            throw new Error("Student 1 DayRecord verification failed");
        }

        // 6. Verify student2 DayRecord (Missed)
        const day2 = await DayRecord.findOne({ userId: student2._id, date: new Date(testDate) });
        console.log("Student 2 DayRecord:", { total: day2.totalClasses, attended: day2.attendedClasses, subjects: day2.subjects });
        if (day2.totalClasses !== 1 || day2.attendedClasses !== 0 || day2.subjects[0].status !== "missed") {
            throw new Error("Student 2 DayRecord verification failed");
        }

        // 7. Security test: Teacher unassigned submit -> Should fail 403
        const fakeSubmitBody = {
            classId: classDoc._id.toString(),
            subjectName: "Unassigned Subject",
            date: testDate,
            absentStudentIds: []
        };
        const { req: reqFake, res: resFake } = createMockReqRes(fakeSubmitBody, {}, {}, teacher._id.toString(), "teacher");
        await submitAttendance(reqFake, resFake);
        console.log("Fake submit status (expected 403):", resFake.statusCode, resFake.data.message);
        if (resFake.statusCode !== 403) {
            throw new Error("Teacher unassigned security test failed");
        }

        // 8. Security test: Student attempting self-modify Data Structures -> Should fail 403
        const studentSaveBody = {
            date: testDate,
            totalClasses: 1,
            attendedClasses: 1,
            subjects: [{ name: "Data Structures", status: "attended" }]
        };
        const { req: reqStuSave, res: resStuSave } = createMockReqRes(studentSaveBody, {}, {}, student2._id.toString(), "student");
        await saveDay(reqStuSave, resStuSave);
        console.log("Student self-modify status (expected 403):", resStuSave.statusCode, resStuSave.data.message);
        if (resStuSave.statusCode !== 403) {
            throw new Error("Student read-only security test failed");
        }

        console.log("\n✅ ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ✅\n");
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("Verification error:", err);
        process.exit(1);
    }
}

runVerification();
