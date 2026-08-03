const mongoose = require("mongoose");

const dayRecordSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    totalClasses: { type: Number, required: true },
    attendedClasses: { type: Number, required: true }
});

dayRecordSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DayRecord", dayRecordSchema);
