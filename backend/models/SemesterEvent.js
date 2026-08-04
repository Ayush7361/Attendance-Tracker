const mongoose = require("mongoose");

const semesterEventSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    type: {
        type: String,
        enum: ["Exam", "Break", "Registration", "Other"],
        default: "Other"
    }
}, { timestamps: true });

module.exports = mongoose.model("SemesterEvent", semesterEventSchema);
