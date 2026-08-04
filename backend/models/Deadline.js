const mongoose = require("mongoose");

const subtaskSchema = new mongoose.Schema({
    text: { type: String, required: true },
    done: { type: Boolean, default: false }
});

const deadlineSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: { type: String, required: true },
    subject: { type: String, required: true },
    type: {
        type: String,
        enum: ["Assignment", "Exam", "Project", "Quiz", "Lab"],
        required: true
    },
    dueDate: { type: Date, required: true },
    priority: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Medium"
    },
    description: { type: String, default: "" },
    estimatedHours: { type: Number, default: null },
    completed: { type: Boolean, default: false },
    subtasks: [subtaskSchema]
}, { timestamps: true });

module.exports = mongoose.model("Deadline", deadlineSchema);
