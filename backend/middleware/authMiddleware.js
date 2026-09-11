const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Not logged in" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userRole = decoded.role || "student";
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

async function requireTeacherRole(req, res, next) {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Not logged in" });
        }
        
        let userRole = req.userRole;
        if (!userRole || userRole !== "teacher") {
            const user = await User.findById(req.userId);
            if (user) {
                userRole = user.role;
                req.userRole = user.role;
            }
        }

        if (userRole !== "teacher") {
            return res.status(403).json({ message: "Forbidden: Teacher access required" });
        }

        next();
    } catch (err) {
        return res.status(500).json({ message: "Server error checking permissions" });
    }
}

module.exports = authMiddleware;
module.exports.requireTeacherRole = requireTeacherRole;