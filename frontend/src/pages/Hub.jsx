import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AcademicHealthScore from "../components/AcademicHealthScore";
import UnifiedActivityForecast from "../components/UnifiedActivityForecast";
import MobileNotificationDrawer from "../components/MobileNotificationDrawer";
import { getSchedule, getOverallSummary, getDay } from "../api/attendanceApi";
import { getDeadlines, getDeadlineAnalytics, getWorkloadForecast } from "../api/deadlinesApi";
import { getStudySessions } from "../api/studyApi";
import { getSemesterEvents } from "../api/semesterApi";
import { getUrgencyStatus, formatDueDate } from "../utils/deadlineUtils";
import { computeHealthScore, formatStudyMinutes, getTimeGreeting } from "../utils/healthScore";
import "../styles/Hub.css";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function formatTodayKey() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function isToday(dateString) {
    const d = new Date(dateString);
    const today = new Date();
    return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
    );
}

function isThisWeek(dateString) {
    const d = new Date(dateString);
    const today = new Date();
    const day = today.getDay();
    const diffToMon = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(diffToMon);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    return d >= startOfWeek && d < endOfWeek;
}

function daysUntil(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function Hub({ user, onLogout }) {
    const [loading, setLoading] = useState(true);
    const [schedule, setSchedule] = useState(null);
    const [todayLogged, setTodayLogged] = useState(null);
    const [attendance, setAttendance] = useState({ total: 0, attended: 0 });
    const [deadlines, setDeadlines] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [events, setEvents] = useState([]);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        setLoading(true);
        const today = formatTodayKey();

        const results = await Promise.allSettled([
            getSchedule(),
            getDay(today),
            getOverallSummary(),
            getDeadlines(),
            getDeadlineAnalytics(),
            getWorkloadForecast(),
            getStudySessions(),
            getSemesterEvents()
        ]);

        if (results[0].status === "fulfilled" && results[0].value.data) {
            setSchedule(results[0].value.data);
        }

        if (results[1].status === "fulfilled") {
            setTodayLogged(results[1].value.data || null);
        }

        if (results[2].status === "fulfilled" && results[2].value.data) {
            setAttendance(results[2].value.data);
        }

        if (results[3].status === "fulfilled") {
            setDeadlines(results[3].value.data || []);
        }

        if (results[4].status === "fulfilled") {
            setAnalytics(results[4].value.data);
        }

        if (results[5].status === "fulfilled") {
            setForecast(results[5].value.data);
        }

        if (results[6].status === "fulfilled") {
            setSessions(results[6].value || []);
        }

        if (results[7].status === "fulfilled") {
            setEvents(results[7].value.data || []);
        }

        setLoading(false);
    }

    const todayKey = DAY_KEYS[new Date().getDay()];
    const todaysClasses = schedule?.[todayKey] || [];

    const attendancePct =
        attendance.total > 0
            ? (attendance.attended / attendance.total) * 100
            : 0;

    const pendingDeadlines = deadlines.filter((d) => !d.completed);
    const overdueCount = pendingDeadlines.filter(
        (d) => getUrgencyStatus(d.dueDate, false) === "overdue"
    ).length;
    const dueTodayCount = pendingDeadlines.filter(
        (d) => getUrgencyStatus(d.dueDate, false) === "dueToday"
    ).length;

    const todayStudyMins = sessions
        .filter((s) => isToday(s.date))
        .reduce((sum, s) => sum + (Number(s.duration) || 0), 0);

    const weekStudyMins = sessions
        .filter((s) => isThisWeek(s.date))
        .reduce((sum, s) => sum + (Number(s.duration) || 0), 0);

    const healthScore = computeHealthScore({
        attendancePct,
        attendanceHasData: attendance.total > 0,
        completionRate: analytics?.completionRate ?? 0,
        deadlinesHasData: analytics && analytics.total > 0,
        weekStudyMins
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcomingExams = [
        ...deadlines.filter((d) => !d.completed && d.type === "Exam"),
        ...events.filter((e) => {
            const t = (e.type || "").toLowerCase();
            return t.includes("exam") || t.includes("midterm") || t.includes("final");
        })
    ]
        .map((item) => ({
            title: item.title,
            date: item.dueDate || item.date,
            source: item.dueDate ? "deadline" : "timeline"
        }))
        .filter((item) => new Date(item.date) >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const nextExam = upcomingExams[0] || null;

    const upcomingDeadlines = pendingDeadlines
        .filter((d) => getUrgencyStatus(d.dueDate, false) !== "overdue")
        .slice(0, 4);

    const todayFormatted = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long"
    });

    return (
        <div className="hub-wrapper">
            <header className="hub-header">
                <div className="header-brand">
                    <div className="brand-badge">SD</div>
                    <div>
                        <h1 className="app-title">Study Dashboard</h1>
                        <p className="app-subtitle">Command Center</p>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <MobileNotificationDrawer
                        schedule={schedule}
                        todayLogged={todayLogged}
                        deadlines={deadlines}
                        events={events}
                    />
                    <button className="logout-btn" onClick={onLogout}>
                        Logout
                    </button>
                </div>
            </header>

            <main className="hub-container">
                <div className="hub-hero">
                    <h2 className="hub-greeting">
                        {getTimeGreeting()}, {user.username}
                    </h2>
                    <p className="hub-tagline">{todayFormatted}</p>
                </div>

                {loading ? (
                    <div className="hub-loading">Loading your dashboard...</div>
                ) : (
                    <>
                        {/* Live stat pills */}
                        <div className="hub-stat-pills">
                            <Link to="/attendance" className="hub-stat-pill pill-attendance">
                                <span className="pill-label">Attendance</span>
                                <span className="pill-value">
                                    {attendance.total > 0 ? `${attendancePct.toFixed(1)}%` : "—"}
                                </span>
                                {attendance.total > 0 && attendancePct < 75 && (
                                    <span className="pill-warn">Below 75%</span>
                                )}
                            </Link>

                            <Link to="/deadlines" className="hub-stat-pill pill-overdue">
                                <span className="pill-label">Overdue</span>
                                <span className="pill-value">{overdueCount}</span>
                            </Link>

                            <Link to="/deadlines" className="hub-stat-pill pill-today">
                                <span className="pill-label">Due Today</span>
                                <span className="pill-value">{dueTodayCount}</span>
                            </Link>

                            <Link to="/study" className="hub-stat-pill pill-study">
                                <span className="pill-label">Studied Today</span>
                                <span className="pill-value">{formatStudyMinutes(todayStudyMins)}</span>
                            </Link>

                            {nextExam && (
                                <Link to="/timeline" className="hub-stat-pill pill-exam">
                                    <span className="pill-label">Next Exam</span>
                                    <span className="pill-value">
                                        {daysUntil(nextExam.date) === 0
                                            ? "Today"
                                            : `${daysUntil(nextExam.date)}d`}
                                    </span>
                                    <span className="pill-sub">{nextExam.title}</span>
                                </Link>
                            )}
                        </div>

                        {/* Quick actions */}
                        <div className="hub-quick-actions">
                            <Link to="/attendance" className="hub-action-btn">
                                {todayLogged ? "View Today's Log" : "Log Attendance"}
                            </Link>
                            <Link to="/study" className="hub-action-btn hub-action-primary">
                                Start Study Session
                            </Link>
                            <Link to="/deadlines/new" className="hub-action-btn">
                                Add Deadline
                            </Link>
                        </div>

                        {/* Health score + main panels */}
                        <div className="hub-command-grid">
                            <AcademicHealthScore
                                score={healthScore}
                                components={healthScore.components}
                                belowAttendanceThreshold={healthScore.belowAttendanceThreshold}
                                attendanceThreshold={healthScore.attendanceThreshold}
                            />

                            <div className="hub-side-stack">
                                <div className="hub-panel hub-classes-panel">
                                    <div className="hub-panel-header-row">
                                        <h3 className="hub-panel-title">Classes Today</h3>
                                        {todaysClasses.length > 0 && (
                                            <span className="hub-class-count-badge">
                                                {todaysClasses.length} {todaysClasses.length === 1 ? "class" : "classes"}
                                            </span>
                                        )}
                                    </div>

                                    {todaysClasses.length === 0 ? (
                                        <div className="hub-classes-empty-box">
                                            <p className="hub-panel-empty">
                                                No classes scheduled for today on your weekly timetable.
                                            </p>
                                            <Link to="/attendance" className="hub-classes-empty-link">
                                                Manage Timetable →
                                            </Link>
                                        </div>
                                    ) : (
                                        <>
                                            <ul className="hub-class-list">
                                                {todaysClasses.map((subject, i) => (
                                                    <li key={i} className="hub-class-item">
                                                        <div className="hub-class-left">
                                                            <span className="hub-class-dot" />
                                                            <span className="hub-class-name">{subject}</span>
                                                        </div>
                                                        <Link
                                                            to={`/study?subject=${encodeURIComponent(subject)}`}
                                                            className="hub-class-study-link"
                                                            title={`Start study session for ${subject}`}
                                                        >
                                                            Focus
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>

                                            <div className="hub-attendance-crosslink-footer">
                                                {todayLogged ? (
                                                    <p className="hub-attendance-logged">
                                                        ✓ Logged today: {todayLogged.attendedClasses}/{todayLogged.totalClasses} attended
                                                    </p>
                                                ) : (
                                                    <p className="hub-attendance-unlogged">
                                                        ⚠️ Today's attendance pending
                                                    </p>
                                                )}
                                                <Link to="/attendance" className="hub-smart-attendance-btn">
                                                    {todayLogged ? "Update Attendance Log" : "Log Today's Attendance →"}
                                                </Link>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="hub-panel">
                                    <h3 className="hub-panel-title">Coming Up</h3>
                                    {upcomingDeadlines.length === 0 && !nextExam ? (
                                        <p className="hub-panel-empty">No upcoming deadlines. You're clear!</p>
                                    ) : (
                                        <ul className="hub-upcoming-list">
                                            {upcomingDeadlines.map((d) => (
                                                <li key={d._id}>
                                                    <Link to={`/deadlines/${d._id}`} className="hub-upcoming-item">
                                                        <span className="hub-upcoming-title">{d.title}</span>
                                                        <span className={`hub-upcoming-badge ${getUrgencyStatus(d.dueDate, false)}`}>
                                                            {formatDueDate(d.dueDate)}
                                                        </span>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Unified Activity & Workload Forecast */}
                        <UnifiedActivityForecast
                            forecastData={forecast}
                            sessions={sessions}
                        />

                        {/* Module navigation */}
                        <div className="hub-section-label">Modules</div>
                        <div className="hub-grid hub-grid-compact">
                            <Link to="/attendance" className="hub-card">
                                <div className="hub-card-header">
                                    <span className="hub-card-tag tag-attendance">Attendance</span>
                                    <h2>Attendance Tracker</h2>
                                </div>
                                <p>Daily class logs, subject schedules, and percentage targets.</p>
                                <span className="hub-card-link">Open →</span>
                            </Link>

                            <Link to="/deadlines" className="hub-card">
                                <div className="hub-card-header">
                                    <span className="hub-card-tag tag-deadlines">Tasks</span>
                                    <h2>Deadlines & Tasks</h2>
                                </div>
                                <p>Subtask checklists, urgency filters, and workload analytics.</p>
                                <span className="hub-card-link">Open →</span>
                            </Link>

                            <Link to="/timeline" className="hub-card">
                                <div className="hub-card-header">
                                    <span className="hub-card-tag tag-timeline">Timeline</span>
                                    <h2>Academic Timeline</h2>
                                </div>
                                <p>Semester events, exam schedules, and key academic dates.</p>
                                <span className="hub-card-link">Open →</span>
                            </Link>

                            <Link to="/study" className="hub-card">
                                <div className="hub-card-header">
                                    <span className="hub-card-tag tag-study">Study</span>
                                    <h2>Study Sessions</h2>
                                </div>
                                <p>Subject-tagged focus timer, cycle tracking, and daily analytics.</p>
                                <span className="hub-card-link">Open →</span>
                            </Link>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export default Hub;
