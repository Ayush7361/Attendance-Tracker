const SemesterEvent = require("../models/SemesterEvent");

async function getEvents(req, res) {
    try {
        const events = await SemesterEvent.find({ userId: req.userId }).sort({ date: 1 });
        res.status(200).json(events);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function createEvent(req, res) {
    try {
        const { title, date, type } = req.body;
        const event = await SemesterEvent.create({
            userId: req.userId,
            title,
            date,
            type: type || "Other"
        });
        res.status(201).json(event);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function deleteEvent(req, res) {
    try {
        const event = await SemesterEvent.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        res.status(200).json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = { getEvents, createEvent, deleteEvent };
