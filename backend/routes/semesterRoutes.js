const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getEvents, createEvent, deleteEvent } = require("../controllers/semesterController");

router.get("/", authMiddleware, getEvents);
router.post("/", authMiddleware, createEvent);
router.delete("/:id", authMiddleware, deleteEvent);

module.exports = router;
