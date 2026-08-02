const express = require("express");
const router = express.Router();
const { getSchedule, saveSchedule } = require("../controllers/scheduleController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, getSchedule);
router.put("/", authMiddleware, saveSchedule);

module.exports = router;