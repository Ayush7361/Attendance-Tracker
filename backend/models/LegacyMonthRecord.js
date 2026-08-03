const mongoose = require("mongoose");

const monthRecordSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    month: {
        type: String,
        required: true
    },
    total: {
        type: Number,
        default: 0
    },
    attended: {
        type: Number,
        default: 0
    }
});

monthRecordSchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("MonthRecord", monthRecordSchema);