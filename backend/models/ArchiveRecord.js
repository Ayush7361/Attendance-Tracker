const mongoose = require("mongoose");

const archiveItemSchema = new mongoose.Schema({
    semesterName: { type: String, required: true },
    academicYear: { type: String, required: true },
    gpa: { type: Number, default: 0 },
    attendancePct: { type: Number, default: 0 },
    totalStudyHours: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    archivedAt: { type: Date, default: Date.now }
});

const archiveRecordSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    semesters: [archiveItemSchema]
}, { timestamps: true });

module.exports = mongoose.model("ArchiveRecord", archiveRecordSchema);
