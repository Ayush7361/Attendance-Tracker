const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    mon: { type: mongoose.Schema.Types.Mixed, default: [] },
    tue: { type: mongoose.Schema.Types.Mixed, default: [] },
    wed: { type: mongoose.Schema.Types.Mixed, default: [] },
    thu: { type: mongoose.Schema.Types.Mixed, default: [] },
    fri: { type: mongoose.Schema.Types.Mixed, default: [] },
    sat: { type: mongoose.Schema.Types.Mixed, default: [] },
    sun: { type: mongoose.Schema.Types.Mixed, default: [] }
});

module.exports = mongoose.model("Schedule", scheduleSchema);