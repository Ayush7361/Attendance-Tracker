const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["student", "teacher"],
        default: "student"
    },
    teacherAssignments: [
        {
            subjectName: { type: String, required: true },
            classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true }
        }
    ]
});

module.exports = mongoose.model("User", userSchema);