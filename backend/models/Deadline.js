const mongoose = require("mongoose");

const subtaskSchema = new mongoose.Schema({
    text: { type: String, required: true },
    done: { type: Boolean, default: false }
});

const resourceLinkSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true }
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
        enum: ["Assignment", "Exam", "Project"],
        required: true
    },
    dueDate: { type: Date, required: true },
    priority: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Medium"
    },
    status: {
        type: String,
        enum: ["To Do", "In Progress", "Under Review", "Completed"],
        default: "To Do"
    },
    description: { type: String, default: "" },
    estimatedHours: { type: Number, default: null },
    completed: { type: Boolean, default: false },
    subtasks: [subtaskSchema],
    resourceLinks: [resourceLinkSchema]
}, { timestamps: true });

module.exports = mongoose.model("Deadline", deadlineSchema);
