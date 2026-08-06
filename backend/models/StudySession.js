const mongoose = require("mongoose");

const studySessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        subject: {
            type: String,
            required: true,
            trim: true
        },
        duration: {
            type: Number, // in minutes
            required: true
        },
        mode: {
            type: String,
            enum: ["stopwatch", "custom"],
            default: "stopwatch"
        },
        date: {
            type: Date,
            default: Date.now
        },
        completed: {
            type: Boolean,
            default: true
        },
        notes: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("StudySession", studySessionSchema);
