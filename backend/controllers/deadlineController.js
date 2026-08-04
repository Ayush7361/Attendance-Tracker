const Deadline = require("../models/Deadline");

function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function endOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

function getUrgencyStatus(dueDate, completed) {
    if (completed) return "completed";

    const today = startOfDay(new Date());
    const due = startOfDay(dueDate);
    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "overdue";
    if (diffDays === 0) return "dueToday";

    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    if (due <= endOfDay(weekEnd)) return "thisWeek";
    return "upcoming";
}

async function getDeadlines(req, res) {
    try {
        const filter = { userId: req.userId };

        if (req.query.type && req.query.type !== "All") {
            filter.type = req.query.type;
        }
        if (req.query.subject && req.query.subject !== "All") {
            filter.subject = req.query.subject;
        }

        const deadlines = await Deadline.find(filter).sort({ dueDate: 1 });
        res.status(200).json(deadlines);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function getDeadline(req, res) {
    try {
        const deadline = await Deadline.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!deadline) {
            return res.status(404).json({ message: "Deadline not found" });
        }

        res.status(200).json(deadline);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function createDeadline(req, res) {
    try {
        const { title, subject, type, dueDate, priority, description, estimatedHours, subtasks } = req.body;

        const deadline = await Deadline.create({
            userId: req.userId,
            title,
            subject,
            type,
            dueDate,
            priority: priority || "Medium",
            description: description || "",
            estimatedHours: estimatedHours ?? null,
            subtasks: subtasks || []
        });

        res.status(201).json(deadline);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function updateDeadline(req, res) {
    try {
        const deadline = await Deadline.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!deadline) {
            return res.status(404).json({ message: "Deadline not found" });
        }

        res.status(200).json(deadline);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function deleteDeadline(req, res) {
    try {
        const deadline = await Deadline.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!deadline) {
            return res.status(404).json({ message: "Deadline not found" });
        }

        res.status(200).json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function getAnalytics(req, res) {
    try {
        const deadlines = await Deadline.find({ userId: req.userId });

        const total = deadlines.length;
        const completed = deadlines.filter((d) => d.completed).length;
        const pending = total - completed;
        const completionRate = total === 0 ? 0 : Math.round((completed / total) * 1000) / 10;

        const statusBreakdown = { overdue: 0, dueToday: 0, thisWeek: 0, upcoming: 0 };

        deadlines.forEach((d) => {
            if (d.completed) return;
            const status = getUrgencyStatus(d.dueDate, d.completed);
            if (statusBreakdown[status] !== undefined) {
                statusBreakdown[status]++;
            }
        });

        res.status(200).json({ total, completed, pending, completionRate, statusBreakdown });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function getSubjects(req, res) {
    try {
        const subjects = await Deadline.distinct("subject", { userId: req.userId });
        res.status(200).json(subjects.sort());
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

function sameDay(a, b) {
    return startOfDay(a).getTime() === startOfDay(b).getTime();
}

async function getForecast(req, res) {
    try {
        const deadlines = await Deadline.find({
            userId: req.userId,
            completed: false
        });

        const today = startOfDay(new Date());
        const forecast = [];

        for (let i = 0; i < 7; i++) {
            const day = new Date(today);
            day.setDate(day.getDate() + i);

            const dayTasks = deadlines.filter((d) => sameDay(d.dueDate, day));
            const hours = dayTasks.reduce((sum, d) => sum + (d.estimatedHours || 0), 0);

            forecast.push({
                date: day.toISOString(),
                label: day.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
                hours: Math.round(hours * 10) / 10,
                taskCount: dayTasks.length
            });
        }

        const totalHours = forecast.reduce((s, d) => s + d.hours, 0);
        res.status(200).json({ forecast, totalHours: Math.round(totalHours * 10) / 10 });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function getInsights(req, res) {
    try {
        const deadlines = await Deadline.find({ userId: req.userId });
        const pending = deadlines.filter((d) => !d.completed);
        const overdue = pending.filter((d) => getUrgencyStatus(d.dueDate, false) === "overdue");

        const today = startOfDay(new Date());
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const dueThisWeek = pending.filter((d) => {
            const due = startOfDay(d.dueDate);
            return due >= today && due <= endOfDay(weekEnd);
        });

        const weekHours = dueThisWeek.reduce((s, d) => s + (d.estimatedHours || 0), 0);

        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentlyCompleted = deadlines.filter(
            (d) => d.completed && d.updatedAt && new Date(d.updatedAt) >= sevenDaysAgo
        );

        const insights = [];

        if (overdue.length > 0) {
            insights.push({
                type: "warning",
                message: "You have " + overdue.length + " overdue task" + (overdue.length === 1 ? "" : "s") + ". Consider rescheduling."
            });
        }

        if (weekHours >= 15) {
            insights.push({
                type: "heavy",
                message: "Heavy workload ahead: " + Math.round(weekHours * 10) / 10 + " estimated hours due in the next 7 days."
            });
        } else if (dueThisWeek.length >= 5) {
            insights.push({
                type: "busy",
                message: "Busy week: " + dueThisWeek.length + " tasks due in the next 7 days."
            });
        }

        if (recentlyCompleted.length >= 2) {
            insights.push({
                type: "positive",
                message: "You're on a roll! Completed " + recentlyCompleted.length + " tasks in the last 7 days."
            });
        }

        if (pending.length === 0 && deadlines.length > 0) {
            insights.push({
                type: "positive",
                message: "All caught up! No pending deadlines."
            });
        }

        if (insights.length === 0) {
            insights.push({
                type: "neutral",
                message: "Keep going. Add estimated hours to tasks for better workload forecasts."
            });
        }

        const overdueTasks = overdue.map((d) => ({
            _id: d._id,
            title: d.title,
            subject: d.subject,
            dueDate: d.dueDate
        }));

        res.status(200).json({ insights, overdueTasks, dueThisWeekCount: dueThisWeek.length });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

async function rescheduleDeadline(req, res) {
    try {
        const days = Number(req.body.days) || 7;
        const deadline = await Deadline.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!deadline) {
            return res.status(404).json({ message: "Deadline not found" });
        }

        const newDate = startOfDay(deadline.dueDate);
        newDate.setDate(newDate.getDate() + days);
        if (newDate < startOfDay(new Date())) {
            const today = startOfDay(new Date());
            today.setDate(today.getDate() + days);
            deadline.dueDate = today;
        } else {
            deadline.dueDate = newDate;
        }

        await deadline.save();
        res.status(200).json(deadline);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    getDeadlines,
    getDeadline,
    createDeadline,
    updateDeadline,
    deleteDeadline,
    getAnalytics,
    getSubjects,
    getForecast,
    getInsights,
    rescheduleDeadline
};
