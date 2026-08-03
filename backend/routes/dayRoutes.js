const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    saveDay,
    getDay,
    getMonthSummary,
    getOverallSummary,
    getMonthRecords,
    deleteRange
} = require("../controllers/dayController");

router.post("/", authMiddleware, saveDay);
router.get("/", authMiddleware, getDay);
router.get("/summary/month", authMiddleware, getMonthSummary);
router.get("/summary/overall", authMiddleware, getOverallSummary);
router.get("/month-records", authMiddleware, getMonthRecords);
router.delete("/", authMiddleware, deleteRange);

module.exports = router;
