require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Class = require("./models/Class");

async function seedData() {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/attendance-tracker";
        console.log("Connecting to MongoDB:", mongoUri);
        await mongoose.connect(mongoUri);

        const passwordHash = await bcrypt.hash("password123", 10);

        let student1 = await User.findOne({ username: "student1" });
        if (!student1) {
            student1 = await User.create({
                username: "student1",
                password: passwordHash,
                role: "student"
            });
            console.log("Created student1");
        }

        let student2 = await User.findOne({ username: "student2" });
        if (!student2) {
            student2 = await User.create({
                username: "student2",
                password: passwordHash,
                role: "student"
            });
            console.log("Created student2");
        }

        let teacher1 = await User.findOne({ username: "teacher1" });
        if (!teacher1) {
            teacher1 = await User.create({
                username: "teacher1",
                password: passwordHash,
                role: "teacher"
            });
        }

        let classDoc = await Class.findOne({ name: "IT-2" });
        
        const sampleRoutine = [
            { day: "mon", subjectName: "Data Structures", teacherId: teacher1._id, periodNumber: 1, timeSlot: "09:00 - 10:00 AM" },
            { day: "tue", subjectName: "Data Structures", teacherId: teacher1._id, periodNumber: 1, timeSlot: "10:00 - 11:00 AM" },
            { day: "wed", subjectName: "Data Structures", teacherId: teacher1._id, periodNumber: 1, timeSlot: "09:00 - 10:00 AM" },
            { day: "thu", subjectName: "Data Structures", teacherId: teacher1._id, periodNumber: 2, timeSlot: "11:00 - 12:00 PM" },
            { day: "fri", subjectName: "Data Structures", teacherId: teacher1._id, periodNumber: 1, timeSlot: "09:00 - 10:00 AM" },
            { day: "sat", subjectName: "Data Structures Lab", teacherId: teacher1._id, periodNumber: 1, timeSlot: "10:00 - 12:00 PM" }
        ];

        if (!classDoc) {
            classDoc = await Class.create({
                name: "IT-2",
                joinCode: "IT2-894A",
                students: [student1._id, student2._id],
                routine: sampleRoutine
            });
            console.log("Created Class IT-2 with joinCode IT2-894A");
        } else {
            classDoc.joinCode = "IT2-894A";
            classDoc.students = [student1._id, student2._id];
            classDoc.routine = sampleRoutine;
            await classDoc.save();
            console.log("Updated Class IT-2 joinCode IT2-894A");
        }

        teacher1.role = "teacher";
        teacher1.teacherAssignments = [
            {
                subjectName: "Data Structures",
                classId: classDoc._id
            }
        ];
        await teacher1.save();
        console.log("Updated teacher1 assignments");

        console.log("\n================ SEED COMPLETE ================");
        console.log("Class: IT-2 (ID: " + classDoc._id + " | Join Code: IT2-894A)");
        console.log("Master Routine: 6 weekly slots seeded (Mon-Sat)");
        console.log("Teacher: teacher1 / password123 (Role: teacher, Subject: Data Structures)");
        console.log("Students: student1 / password123, student2 / password123");
        console.log("===============================================\n");

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("Seed error:", err);
        process.exit(1);
    }
}

seedData();
