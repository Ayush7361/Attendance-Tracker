const mongoose = require("mongoose");

const attendanceAuditSchema = new mongoose.Schema({
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        required: true
    },
    subjectName: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    totalStudents: {
        type: Number,
        default: 0
    },
    presentCount: {
        type: Number,
        default: 0
    },
    absentCount: {
        type: Number,
        default: 0
    },
    absentStudentIds: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    actionType: {
        type: String,
        enum: ["INITIAL_SUBMISSION", "CORRECTION"],
        default: "INITIAL_SUBMISSION"
    }
}, { timestamps: true });

module.exports = mongoose.model("AttendanceAudit", attendanceAuditSchema);
