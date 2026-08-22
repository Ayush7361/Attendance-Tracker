const mongoose = require("mongoose");

const subjectGpaSchema = new mongoose.Schema({
    name: { type: String, required: true },
    credits: { type: Number, default: 3, min: 1, max: 10 },
    internalMarks: { type: Number, default: 0 },
    totalInternal: { type: Number, default: 50 },
    targetGrade: { type: String, default: "A" },
    finalExamWeight: { type: Number, default: 50 }
});

const gpaRecordSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    targetGpa: { type: Number, default: 8.5 },
    subjects: [subjectGpaSchema]
}, { timestamps: true });

module.exports = mongoose.model("GpaRecord", gpaRecordSchema);
