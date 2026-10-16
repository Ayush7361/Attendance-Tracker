const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function validateCredentials(username, password) {
    const name = String(username || "").trim();
    const pass = String(password || "");
    if (name.length < 3 || name.length > 32) {
        return "Username must be 3–32 characters";
    }
    if (pass.length < 6) {
        return "Password must be at least 6 characters";
    }
    return null;
}

async function register(req, res) {
    try {
        const { username, password, role } = req.body;
        const validationError = validateCredentials(username, password);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const existingUser = await User.findOne({ username: username.trim() });
        if (existingUser) {
            return res.status(400).json({ message: "Username already taken" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username: username.trim(),
            password: hashedPassword,
            role: role === "teacher" ? "teacher" : "student"
        });

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: "7d"
        });

        res.status(201).json({
            id: user._id,
            username: user.username,
            role: user.role,
            teacherAssignments: user.teacherAssignments || [],
            token
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function login(req, res) {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username: String(username || "").trim() }).populate("teacherAssignments.classId", "name");
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: "7d"
        });

        res.status(200).json({
            id: user._id,
            username: user.username,
            role: user.role,
            teacherAssignments: user.teacherAssignments || [],
            token
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function getMe(req, res) {
    try {
        const user = await User.findById(req.userId).select("-password").populate("teacherAssignments.classId", "name");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            id: user._id,
            username: user.username,
            role: user.role,
            teacherAssignments: user.teacherAssignments || []
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

function logout(req, res) {
    res.status(200).json({ message: "Logged out" });
}

module.exports = { register, login, getMe, logout };