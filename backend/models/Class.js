const mongoose = require("mongoose");

const routineSlotSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
        required: true
    },
    subjectName: {
        type: String,
        required: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    periodNumber: {
        type: Number,
        default: 1
    },
    timeSlot: {
        type: String,
        default: ""
    }
}, { _id: false });

const classSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    joinCode: {
        type: String,
        unique: true,
        sparse: true
    },
    students: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    routine: [routineSlotSchema]
}, { timestamps: true });

module.exports = mongoose.model("Class", classSchema);
