const express = require("express");
const router = express.Router();
const { getMonths, addWeek, resetMonth, resetAll } = require("../controllers/monthController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, getMonths);
router.post("/add-week", authMiddleware, addWeek);
router.delete("/:month", authMiddleware, resetMonth);
router.delete("/", authMiddleware, resetAll);

module.exports = router;