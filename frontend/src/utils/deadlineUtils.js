export const DEADLINE_TYPES = ["All", "Assignment", "Exam", "Project", "Quiz", "Lab"];

export function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function getUrgencyStatus(dueDate, completed) {
    if (completed) return "completed";

    const today = startOfDay(new Date());
    const due = startOfDay(dueDate);
    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "overdue";
    if (diffDays === 0) return "dueToday";

    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);

    if (due <= weekEnd) return "thisWeek";
    return "upcoming";
}

export function getUrgencyLabel(dueDate, completed) {
    if (completed) return "Done";

    const today = startOfDay(new Date());
    const due = startOfDay(dueDate);
    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return Math.abs(diffDays) + " day" + (Math.abs(diffDays) === 1 ? "" : "s") + " overdue";
    if (diffDays === 0) return "Due Today";
    if (diffDays === 1) return "1 day left";
    return diffDays + " days left";
}

export function formatDueDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

export function getSubtaskProgress(subtasks) {
    if (!subtasks || subtasks.length === 0) return { done: 0, total: 0, percent: 0 };
    const done = subtasks.filter((s) => s.done).length;
    const total = subtasks.length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    return { done, total, percent };
}

export const STATUS_LABELS = {
    overdue: "Overdue",
    dueToday: "Due Today",
    thisWeek: "This Week",
    upcoming: "Upcoming"
};
