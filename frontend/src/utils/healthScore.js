const DEFAULT_WEEKLY_GOAL_MINS = 600; // 10 hours
const ATTENDANCE_THRESHOLD = 75;

export function computeHealthScore({
    attendancePct = 0,
    attendanceHasData = false,
    completionRate = 0,
    deadlinesHasData = false,
    weekStudyMins = 0,
    weeklyGoalMins = DEFAULT_WEEKLY_GOAL_MINS
}) {
    const components = [];

    if (attendanceHasData) {
        components.push({
            key: "attendance",
            label: "Attendance",
            score: Math.min(100, Math.round(attendancePct)),
            weight: 0.4,
            detail: `${Math.round(attendancePct)}% overall`
        });
    }

    if (deadlinesHasData) {
        components.push({
            key: "deadlines",
            label: "Task Completion",
            score: Math.min(100, Math.round(completionRate)),
            weight: 0.35,
            detail: `${Math.round(completionRate)}% completed`
        });
    }

    const studyScore = Math.min(100, Math.round((weekStudyMins / weeklyGoalMins) * 100));
    components.push({
        key: "study",
        label: "Study Goal",
        score: studyScore,
        weight: 0.25,
        detail: `${Math.round(weekStudyMins / 60 * 10) / 10}h / ${weeklyGoalMins / 60}h this week`
    });

    const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
    const overall = Math.round(
        components.reduce((sum, c) => sum + c.score * (c.weight / totalWeight), 0)
    );

    return {
        overall,
        components: components.map((c) => ({
            ...c,
            weight: c.weight / totalWeight
        })),
        attendanceThreshold: ATTENDANCE_THRESHOLD,
        belowAttendanceThreshold: attendanceHasData && attendancePct < ATTENDANCE_THRESHOLD
    };
}

export function getHealthGrade(score) {
    if (score >= 85) return { label: "Excellent", color: "#10b981" };
    if (score >= 70) return { label: "Good", color: "#34d399" };
    if (score >= 55) return { label: "Fair", color: "#f59e0b" };
    return { label: "Needs Focus", color: "#ef4444" };
}

export function formatStudyMinutes(mins) {
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export function getTimeGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}
