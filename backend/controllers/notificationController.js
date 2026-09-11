const Notification = require("../models/Notification");

async function getUserNotifications(req, res) {
    try {
        const notifications = await Notification.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(30);
        const unreadCount = await Notification.countDocuments({ userId: req.userId, isRead: false });

        res.status(200).json({
            notifications,
            unreadCount
        });
    } catch (err) {
        console.error("Error fetching notifications:", err);
        res.status(500).json({ message: "Server error" });
    }
}

async function markNotificationRead(req, res) {
    try {
        const { id } = req.params;
        await Notification.findOneAndUpdate({ _id: id, userId: req.userId }, { isRead: true });
        res.status(200).json({ message: "Notification marked read" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function markAllRead(req, res) {
    try {
        await Notification.updateMany({ userId: req.userId, isRead: false }, { isRead: true });
        res.status(200).json({ message: "All notifications marked read" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    getUserNotifications,
    markNotificationRead,
    markAllRead
};
