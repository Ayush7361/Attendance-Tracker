const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    mon: { type: Number, default: 0 },
    tue: { type: Number, default: 0 },
    wed: { type: Number, default: 0 },
    thu: { type: Number, default: 0 },
    fri: { type: Number, default: 0 },
    sat: { type: Number, default: 0 }
});

module.exports = mongoose.model("Schedule", scheduleSchema);