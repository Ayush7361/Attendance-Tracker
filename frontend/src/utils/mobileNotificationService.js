// Mobile Notification Service
// Manages native phone push notifications, service workers, and academic alert generation

export function initServiceWorker() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker
            .register("/sw.js")
            .then((reg) => console.log("Service Worker registered:", reg.scope))
            .catch((err) => console.error("Service Worker registration failed:", err));
    }
}

export function getNotificationPermission() {
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
}

export async function requestMobileNotificationPermission() {
    if (!("Notification" in window)) {
        alert("Mobile Push Notifications are not supported in this browser.");
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            // Trigger confirmation notification
            sendNativePhoneNotification({
                title: "🔔 Mobile Alerts Enabled!",
                body: "You will now receive native alerts for class reminders, overdue deadlines, and exams.",
                url: "/"
            });
            return true;
        }
        return false;
    } catch (err) {
        console.error("Failed to request notification permission:", err);
        return false;
    }
}

export function sendNativePhoneNotification({ title, body, url = "/" }) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const options = {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        vibrate: [200, 100, 200],
        data: { url },
        tag: title
    };

    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, options);
        });
    } else {
        new Notification(title, options);
    }
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function getDismissedNotifIds() {
    try {
        const data = localStorage.getItem("sd_dismissed_notifs");
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function saveDismissedNotifId(id) {
    try {
        const current = getDismissedNotifIds();
        if (!current.includes(id)) {
            current.push(id);
            localStorage.setItem("sd_dismissed_notifs", JSON.stringify(current));
        }
    } catch (err) {
        console.error("Failed to save dismissed notification", err);
    }
}

export function clearDismissedNotifs() {
    try {
        localStorage.removeItem("sd_dismissed_notifs");
    } catch (err) {
        console.error("Failed to clear dismissed notifications", err);
    }
}

export function generateAcademicAlerts({ schedule, todayLogged, deadlines = [], events = [] }) {
    const alerts = [];
    const dismissedIds = getDismissedNotifIds();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Classes & Attendance Alert
    const todayKey = DAY_KEYS[today.getDay()];
    const todaysClasses = schedule?.[todayKey] || [];

    if (todaysClasses.length > 0) {
        const notifId = `att_${today.toISOString().split("T")[0]}`;
        if (!dismissedIds.includes(notifId)) {
            alerts.push({
                id: notifId,
                type: "attendance",
                icon: "📅",
                title: "Classes Today & Attendance Log",
                message: todayLogged
                    ? `Logged: ${todayLogged.attendedClasses}/${todayLogged.totalClasses} classes attended today.`
                    : `You have ${todaysClasses.length} ${todaysClasses.length === 1 ? "class" : "classes"} scheduled today (${todaysClasses.join(", ")}). Tap to log!`,
                url: "/attendance",
                urgent: !todayLogged
            });
        }
    }

    // 2. Urgent Deadlines
    deadlines.forEach((d) => {
        if (d.completed) return;
        const due = new Date(d.dueDate);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

        let icon = "📝";
        let title = "";
        let urgent = false;

        if (diffDays < 0) {
            icon = "🚨";
            title = `Overdue: ${d.title}`;
            urgent = true;
        } else if (diffDays === 0) {
            icon = "⏰";
            title = `Due Today: ${d.title}`;
            urgent = true;
        } else if (diffDays <= 3) {
            icon = "📌";
            title = `Due in ${diffDays}d: ${d.title}`;
        } else {
            return;
        }

        const notifId = `dl_${d._id}_${diffDays}`;
        if (!dismissedIds.includes(notifId)) {
            alerts.push({
                id: notifId,
                type: "deadline",
                icon,
                title,
                message: `${d.subject} · Priority: ${d.priority}`,
                url: `/deadlines/${d._id}`,
                urgent
            });
        }
    });

    // 3. Upcoming Exams on Academic Timeline
    events.forEach((ev) => {
        const isExam = ev.type === "Exam" || /exam|midterm|final|quiz/i.test(ev.type || "") || /exam|midterm|final|quiz/i.test(ev.title || "");
        if (!isExam) return;

        const evDate = new Date(ev.date);
        evDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((evDate - today) / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 5) {
            const notifId = `exam_${ev._id}_${diffDays}`;
            if (!dismissedIds.includes(notifId)) {
                alerts.push({
                    id: notifId,
                    type: "exam",
                    icon: "🎓",
                    title: `Upcoming Exam: ${ev.title}`,
                    message: diffDays === 0 ? "Scheduled for TODAY!" : `Scheduled in ${diffDays} day${diffDays === 1 ? "" : "s"}.`,
                    url: "/timeline",
                    urgent: diffDays <= 2
                });
            }
        }
    });

    // Sort urgent first
    return alerts.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
}
