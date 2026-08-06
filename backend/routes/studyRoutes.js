const express = require("express");
const router = express.Router();
const { getStudySessions, saveStudySession, deleteStudySession } = require("../controllers/studyController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, getStudySessions);
router.post("/", authMiddleware, saveStudySession);
router.delete("/:id", authMiddleware, deleteStudySession);

module.exports = router;
