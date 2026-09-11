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

        // 1. Create or find Students
        let student1 = await User.findOne({ username: "student1" });
        if (!student1) {
            student1 = await User.create({
                username: "student1",
                password: passwordHash,
                role: "student"
            });
            console.log("Created student1");
        } else {
            console.log("student1 already exists");
        }

        let student2 = await User.findOne({ username: "student2" });
        if (!student2) {
            student2 = await User.create({
                username: "student2",
                password: passwordHash,
                role: "student"
            });
            console.log("Created student2");
        } else {
            console.log("student2 already exists");
        }

        // 2. Create or find Class IT-2
        let classDoc = await Class.findOne({ name: "IT-2" });
        if (!classDoc) {
            classDoc = await Class.create({
                name: "IT-2",
                students: [student1._id, student2._id]
            });
            console.log("Created Class IT-2 with enrolled students");
        } else {
            // Update students array
            classDoc.students = [student1._id, student2._id];
            await classDoc.save();
            console.log("Updated Class IT-2 roster");
        }

        // 3. Create or find Teacher
        let teacher1 = await User.findOne({ username: "teacher1" });
        if (!teacher1) {
            teacher1 = await User.create({
                username: "teacher1",
                password: passwordHash,
                role: "teacher",
                teacherAssignments: [
                    {
                        subjectName: "Data Structures",
                        classId: classDoc._id
                    }
                ]
            });
            console.log("Created teacher1 assigned to Data Structures (IT-2)");
        } else {
            teacher1.role = "teacher";
            teacher1.teacherAssignments = [
                {
                    subjectName: "Data Structures",
                    classId: classDoc._id
                }
            ];
            await teacher1.save();
            console.log("Updated teacher1 assignments");
        }

        console.log("\n================ SEED COMPLETE ================");
        console.log("Class: IT-2 (ID: " + classDoc._id + ")");
        console.log("Teacher: teacher1 / password123 (Role: teacher, Subject: Data Structures)");
        console.log("Students: student1 / password123, student2 / password123 (Role: student)");
        console.log("===============================================\n");

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("Seed error:", err);
        process.exit(1);
    }
}

seedData();
