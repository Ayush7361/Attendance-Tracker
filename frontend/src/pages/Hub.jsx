import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AcademicHealthScore from "../components/AcademicHealthScore";
import UnifiedActivityForecast from "../components/UnifiedActivityForecast";
import MobileNotificationDrawer from "../components/MobileNotificationDrawer";
import ClassJoinModal from "../components/ClassJoinModal";
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

function pickFocus({ todaysClasses, todayLogged, overdueCount, dueTodayCount, todayStudyMins }) {
    if (todaysClasses.length > 0 && !todayLogged) {
        return {
            title: "Log today's attendance",
            detail: `${todaysClasses.length} class${todaysClasses.length === 1 ? "" : "es"} on the timetable`,
            to: "/attendance",
            cta: "Log now"
        };
    }
    if (overdueCount > 0) {
        return {
            title: `${overdueCount} overdue task${overdueCount === 1 ? "" : "s"}`,
            detail: "Clear these first so they don't pile up.",
            to: "/deadlines",
            cta: "Open tasks"
        };
    }
    if (dueTodayCount > 0) {
        return {
            title: `${dueTodayCount} due today`,
            detail: "Finish what's on today's list.",
            to: "/deadlines",
            cta: "See tasks"
        };
    }
    if (todayStudyMins === 0) {
        return {
            title: "Start a study session",
            detail: "Nothing logged yet today.",
            to: "/study",
            cta: "Start timer"
        };
    }
    return {
        title: "You're caught up for now",
        detail: "Add a task or keep studying if you have more to do.",
        to: "/deadlines/new",
        cta: "Add a task"
    };
}

let hubCache = null;

function Hub({ user, onLogout }) {
    const [schedule, setSchedule] = useState(() => hubCache?.schedule || null);
    const [todayLogged, setTodayLogged] = useState(() => hubCache?.todayLogged || null);
    const [attendance, setAttendance] = useState(() => hubCache?.attendance || { total: 0, attended: 0 });
    const [deadlines, setDeadlines] = useState(() => hubCache?.deadlines || []);
    const [analytics, setAnalytics] = useState(() => hubCache?.analytics || null);
    const [forecast, setForecast] = useState(() => hubCache?.forecast || null);
    const [sessions, setSessions] = useState(() => hubCache?.sessions || []);
    const [events, setEvents] = useState(() => hubCache?.events || []);
    const [loading, setLoading] = useState(() => !hubCache);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        if (!hubCache) {
            setLoading(true);
        }
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

        const nextSchedule = (results[0].status === "fulfilled" && results[0].value.data) ? results[0].value.data : schedule;
        const nextTodayLogged = (results[1].status === "fulfilled") ? (results[1].value.data || null) : todayLogged;
        const nextAttendance = (results[2].status === "fulfilled" && results[2].value.data) ? results[2].value.data : attendance;
        const nextDeadlines = (results[3].status === "fulfilled") ? (results[3].value.data || []) : deadlines;
        const nextAnalytics = (results[4].status === "fulfilled") ? results[4].value.data : analytics;
        const nextForecast = (results[5].status === "fulfilled") ? results[5].value.data : forecast;
        const nextSessions = (results[6].status === "fulfilled") ? (results[6].value || []) : sessions;
        const nextEvents = (results[7].status === "fulfilled") ? (results[7].value.data || []) : events;

        if (results[0].status === "fulfilled" && results[0].value.data) setSchedule(results[0].value.data);
        if (results[1].status === "fulfilled") setTodayLogged(results[1].value.data || null);
        if (results[2].status === "fulfilled" && results[2].value.data) setAttendance(results[2].value.data);
        if (results[3].status === "fulfilled") setDeadlines(results[3].value.data || []);
        if (results[4].status === "fulfilled") setAnalytics(results[4].value.data);
        if (results[5].status === "fulfilled") setForecast(results[5].value.data);
        if (results[6].status === "fulfilled") setSessions(results[6].value || []);
        if (results[7].status === "fulfilled") setEvents(results[7].value.data || []);

        hubCache = {
            schedule: nextSchedule,
            todayLogged: nextTodayLogged,
            attendance: nextAttendance,
            deadlines: nextDeadlines,
            analytics: nextAnalytics,
            forecast: nextForecast,
            sessions: nextSessions,
            events: nextEvents
        };

        setLoading(false);
    }

    const todayKey = DAY_KEYS[new Date().getDay()];
    const todaysClasses = schedule?.[todayKey] || [];

    const attendancePct =
        attendance.total > 0
            ? (attendance.attended / attendance.total) * 100
            : 0;

    const pendingDeadlines = deadlines.filter((d) => !d.completed);
    const overdueItems = pendingDeadlines.filter(
        (d) => getUrgencyStatus(d.dueDate, false) === "overdue"
    );
    const dueTodayItems = pendingDeadlines.filter(
        (d) => getUrgencyStatus(d.dueDate, false) === "dueToday"
    );
    const overdueCount = overdueItems.length;
    const dueTodayCount = dueTodayItems.length;

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
        .slice(0, 5);

    const todayFormatted = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long"
    });

    const focus = pickFocus({
        todaysClasses,
        todayLogged,
        overdueCount,
        dueTodayCount,
        todayStudyMins
    });

    const attentionItems = [
        ...overdueItems.slice(0, 3).map((d) => ({
            id: d._id,
            title: d.title,
            meta: "Overdue",
            tone: "danger",
            to: `/deadlines/${d._id}`
        })),
        ...dueTodayItems.slice(0, 3).map((d) => ({
            id: d._id,
            title: d.title,
            meta: "Due today",
            tone: "warn",
            to: `/deadlines/${d._id}`
        }))
    ].slice(0, 4);

    const tools = [
        { to: "/attendance", label: "Attendance", hint: attendance.total > 0 ? `${attendancePct.toFixed(0)}%` : "Set up" },
        { to: "/schedule", label: "Routine", hint: "Timetable" },
        { to: "/deadlines", label: "Tasks", hint: pendingDeadlines.length ? `${pendingDeadlines.length} open` : "None" },
        { to: "/study", label: "Study", hint: todayStudyMins ? formatStudyMinutes(todayStudyMins) : "Timer" },
        { to: "/gpa", label: "GPA", hint: "Marks" },
        { to: "/timeline", label: "Calendar", hint: nextExam ? `${daysUntil(nextExam.date)}d` : "Dates" },
        { to: "/archive", label: "Archive", hint: "Past terms" }
    ];

    return (
        <div className="hub-wrapper">
            <header className="hub-header">
                <Link to="/" className="header-brand-link" title="Today">
                    <div className="header-brand">
                        <div className="brand-badge">SD</div>
                        <div>
                            <h1 className="app-title">Today</h1>
                            <p className="app-subtitle">{todayFormatted}</p>
                        </div>
                    </div>
                </Link>
                <div className="hub-header-actions">
                    <button type="button" className="hub-join-btn" onClick={() => setShowJoinModal(true)}>
                        Join class
                    </button>
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
                    <p className="hub-tagline">Here’s what needs your time today.</p>
                </div>

                {loading ? (
                    <div className="hub-loading">Loading today…</div>
                ) : (
                    <>
                        <section className="hub-focus">
                            <div>
                                <p className="hub-focus-kicker">Do this next</p>
                                <h3 className="hub-focus-title">{focus.title}</h3>
                                <p className="hub-focus-detail">{focus.detail}</p>
                            </div>
                            <Link to={focus.to} className="hub-focus-cta">
                                {focus.cta}
                            </Link>
                        </section>

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
                                <span className="pill-label">Due today</span>
                                <span className="pill-value">{dueTodayCount}</span>
                            </Link>

                            <Link to="/study" className="hub-stat-pill pill-study">
                                <span className="pill-label">Studied today</span>
                                <span className="pill-value">{formatStudyMinutes(todayStudyMins)}</span>
                            </Link>

                            {nextExam && (
                                <Link to="/timeline" className="hub-stat-pill pill-exam">
                                    <span className="pill-label">Next exam</span>
                                    <span className="pill-value">
                                        {daysUntil(nextExam.date) === 0
                                            ? "Today"
                                            : `${daysUntil(nextExam.date)}d`}
                                    </span>
                                    <span className="pill-sub">{nextExam.title}</span>
                                </Link>
                            )}
                        </div>

                        {showJoinModal && (
                            <ClassJoinModal
                                onClose={() => setShowJoinModal(false)}
                                onSuccess={loadDashboard}
                            />
                        )}

                        <div className="hub-command-grid hub-action-center-grid">
                            <div className="hub-panel hub-classes-panel">
                                <div className="hub-panel-header-row">
                                    <h3 className="hub-panel-title">Classes today</h3>
                                    {todaysClasses.length > 0 && (
                                        <span className="hub-class-count-badge">
                                            {todaysClasses.length} {todaysClasses.length === 1 ? "class" : "classes"}
                                        </span>
                                    )}
                                </div>

                                {todaysClasses.length === 0 ? (
                                    <div className="hub-classes-empty-box">
                                        <p className="hub-panel-empty">
                                            No classes on today’s timetable.
                                        </p>
                                        <Link to="/schedule" className="hub-classes-empty-link">
                                            Edit routine
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        <ul className="hub-class-list">
                                            {todaysClasses.map((subject, i) => (
                                                <li key={`${subject}-${i}`} className="hub-class-item">
                                                    <div className="hub-class-left">
                                                        <span className="hub-class-dot" />
                                                        <span className="hub-class-name">{subject}</span>
                                                    </div>
                                                    <Link
                                                        to={`/study?subject=${encodeURIComponent(subject)}`}
                                                        className="hub-class-study-link"
                                                    >
                                                        Study
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>

                                        <div className="hub-attendance-crosslink-footer">
                                            {todayLogged ? (
                                                <p className="hub-attendance-logged">
                                                    Logged: {todayLogged.attendedClasses}/{todayLogged.totalClasses} attended
                                                </p>
                                            ) : (
                                                <p className="hub-attendance-unlogged">
                                                    Attendance not logged yet
                                                </p>
                                            )}
                                            <Link to="/attendance" className="hub-smart-attendance-btn">
                                                {todayLogged ? "Update log" : "Log attendance"}
                                            </Link>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="hub-panel">
                                <h3 className="hub-panel-title">
                                    {attentionItems.length ? "Needs attention" : "Coming up"}
                                </h3>
                                {attentionItems.length > 0 ? (
                                    <ul className="hub-upcoming-list">
                                        {attentionItems.map((item) => (
                                            <li key={item.id}>
                                                <Link to={item.to} className="hub-upcoming-item">
                                                    <span className="hub-upcoming-title">{item.title}</span>
                                                    <span className={`hub-upcoming-badge ${item.tone === "danger" ? "overdue" : "dueToday"}`}>
                                                        {item.meta}
                                                    </span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                ) : upcomingDeadlines.length === 0 && !nextExam ? (
                                    <p className="hub-panel-empty">Nothing due. You’re clear.</p>
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
                                {attentionItems.length > 0 && upcomingDeadlines.length > 0 && (
                                    <Link to="/deadlines" className="hub-panel-more">
                                        All upcoming tasks
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="hub-tools">
                            <p className="hub-section-label">Jump to</p>
                            <div className="hub-tools-row">
                                {tools.map((tool) => (
                                    <Link key={tool.to} to={tool.to} className="hub-tool-chip">
                                        <span className="hub-tool-label">{tool.label}</span>
                                        <span className="hub-tool-hint">{tool.hint}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="hub-analytics-collapsible card-panel">
                            <button
                                type="button"
                                className="analytics-toggle-btn"
                                onClick={() => setShowAnalytics(!showAnalytics)}
                            >
                                <div className="toggle-left">
                                    <span>This week</span>
                                    <span className="toggle-sub">
                                        Score {healthScore.overall}/100 · {formatStudyMinutes(weekStudyMins)} studied
                                    </span>
                                </div>
                                <span className={`toggle-arrow ${showAnalytics ? "open" : ""}`}>▾</span>
                            </button>

                            {showAnalytics && (
                                <div className="analytics-expand-body">
                                    <AcademicHealthScore
                                        score={healthScore}
                                        components={healthScore.components}
                                        belowAttendanceThreshold={healthScore.belowAttendanceThreshold}
                                        attendanceThreshold={healthScore.attendanceThreshold}
                                    />
                                    <UnifiedActivityForecast
                                        forecastData={forecast}
                                        sessions={sessions}
                                    />
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export default Hub;
