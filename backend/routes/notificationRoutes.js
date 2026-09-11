const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    getUserNotifications,
    markNotificationRead,
    markAllRead
} = require("../controllers/notificationController");

router.get("/", authMiddleware, getUserNotifications);
router.put("/read-all", authMiddleware, markAllRead);
router.put("/:id/read", authMiddleware, markNotificationRead);

module.exports = router;
