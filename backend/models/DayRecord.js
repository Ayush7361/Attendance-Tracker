const mongoose = require("mongoose");

const subjectStatusSchema = new mongoose.Schema({
    name: { type: String, required: true },
    status: {
        type: String,
        enum: ["attended", "missed", "cancelled"],
        default: "attended"
    }
}, { _id: false });

const dayRecordSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    totalClasses: { type: Number, required: true },
    attendedClasses: { type: Number, required: true },
    isHoliday: { type: Boolean, default: false },
    subjects: [subjectStatusSchema]
});

dayRecordSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DayRecord", dayRecordSchema);
