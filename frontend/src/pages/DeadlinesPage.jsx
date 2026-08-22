import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getDeadlines, getDeadlineAnalytics, getDeadlineSubjects } from "../api/deadlinesApi";
import { getSemesterEvents, createSemesterEvent, deleteSemesterEvent } from "../api/semesterApi";
import {
    DEADLINE_TYPES,
    getUrgencyStatus,
    getUrgencyLabel,
    formatDueDate,
    getSubtaskProgress,
    STATUS_LABELS
} from "../utils/deadlineUtils";
import { downloadICS } from "../utils/icsExport";
import MobileNotificationDrawer from "../components/MobileNotificationDrawer";
import { useToast } from "../context/ToastContext";
import "../styles/Deadlines.css";
import "../styles/Timeline.css";

function OverviewTab({ analytics }) {
    if (!analytics) return <p className="dl-empty">Loading analytics...</p>;

    const maxCount = Math.max(
        analytics.statusBreakdown.overdue,
        analytics.statusBreakdown.dueToday,
        analytics.statusBreakdown.thisWeek,
        1
    );

    return (
        <div>
            <div className="dl-stats">
                <div className="dl-stat-box">
                    <h4>Total</h4>
                    <p>{analytics.total}</p>
                </div>
                <div className="dl-stat-box">
                    <h4>Completed</h4>
                    <p>{analytics.completed}</p>
                </div>
                <div className="dl-stat-box">
                    <h4>Pending</h4>
                    <p>{analytics.pending}</p>
                </div>
                <div className="dl-stat-box">
                    <h4>Completion Rate</h4>
                    <p>{analytics.completionRate}%</p>
                </div>
            </div>

            <div className="dl-status-bars">
                <h3>Status Breakdown (pending only)</h3>
                {["overdue", "dueToday", "thisWeek"].map((key) => (
                    <div className="dl-bar-row" key={key}>
                        <span className="dl-bar-label">{STATUS_LABELS[key]}</span>
                        <div className="dl-bar-track">
                            <div
                                className="dl-bar-fill"
                                style={{ width: (analytics.statusBreakdown[key] / maxCount) * 100 + "%" }}
                            />
                        </div>
                        <span className="dl-bar-count">{analytics.statusBreakdown[key]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TimelineTab() {
    const { showToast } = useToast();
    const [events, setEvents] = useState([]);
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [type, setType] = useState("Semester Event");

    useEffect(() => {
        loadEvents();
    }, []);

    async function loadEvents() {
        try {
            const res = await getSemesterEvents();
            setEvents(res.data || []);
        } catch (err) {
            console.error("Failed to load events", err);
        }
    }

    async function handleAdd(e) {
        e.preventDefault();
        if (!title.trim() || !date) return;
        try {
            await createSemesterEvent({ title: title.trim(), date, type });
            setTitle("");
            setDate("");
            loadEvents();
            if (showToast) showToast("Semester event added!", "success");
        } catch (err) {
            console.error("Failed to add event", err);
        }
    }

    async function handleDelete(id) {
        try {
            await deleteSemesterEvent(id);
            loadEvents();
            if (showToast) showToast("Event removed", "info");
        } catch (err) {
            console.error("Failed to delete event", err);
        }
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="card-panel">
                <h3 className="panel-heading">+ Add Semester Event / Exam</h3>
                <form onSubmit={handleAdd} className="tl-form-row">
                    <input
                        type="text"
                        placeholder="Event Title (e.g. Midterm Exams)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="tl-input"
                        required
                    />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="tl-input"
                        required
                    />
                    <select value={type} onChange={(e) => setType(e.target.value)} className="tl-select">
                        <option value="Semester Event">Semester Event</option>
                        <option value="Exam">Exam / Quiz</option>
                        <option value="Important Date">Important Date</option>
                    </select>
                    <button type="submit" className="tl-btn-add">+ Add</button>
                </form>
            </div>

            <div className="card-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <h3 className="panel-heading" style={{ margin: 0 }}>Upcoming Milestones</h3>
                    <button
                        type="button"
                        className="dl-btn"
                        onClick={() => downloadICS(events, "semester_timeline.ics")}
                        style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                    >
                        📅 Export Timeline (.ics)
                    </button>
                </div>

                <div className="tl-event-list">
                    {events.length === 0 ? (
                        <p className="tl-empty">No semester events logged yet.</p>
                    ) : (
                        events.map((ev) => (
                            <div key={ev._id} className="tl-event-card">
                                <div className="tl-event-info">
                                    <div className="tl-event-top">
                                        <span className="tl-event-title">{ev.title}</span>
                                        <span className="tl-type-badge badge-semester">{ev.type}</span>
                                    </div>
                                    <div className="tl-event-meta">Date: {ev.date}</div>
                                </div>
                                <button type="button" className="tl-delete-btn" onClick={() => handleDelete(ev._id)}>
                                    ✕
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function DeadlinesPage({ user, onLogout }) {
    const { showToast } = useToast();
    const [tab, setTab] = useState("list");
    const [typeFilter, setTypeFilter] = useState("All");
    const [subjectFilter, setSubjectFilter] = useState("All");
    const [deadlines, setDeadlines] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        loadDeadlines();
        loadSubjects();
    }, [typeFilter, subjectFilter]);

    useEffect(() => {
        if (tab === "overview") {
            loadAnalytics();
        }
    }, [tab]);

    async function loadDeadlines() {
        try {
            const params = {};
            if (typeFilter !== "All") params.type = typeFilter;
            if (subjectFilter !== "All") params.subject = subjectFilter;
            const res = await getDeadlines(params);
            setDeadlines(res.data);
        } catch (err) {
            console.error("Failed to load deadlines", err);
        }
    }

    async function loadSubjects() {
        try {
            const res = await getDeadlineSubjects();
            setSubjects(res.data);
        } catch (err) {
            console.error("Failed to load subjects", err);
        }
    }

    async function loadAnalytics() {
        try {
            const res = await getDeadlineAnalytics();
            setAnalytics(res.data);
        } catch (err) {
            console.error("Failed to load analytics", err);
        }
    }

    function handleExportCalendar() {
        if (deadlines.length === 0) {
            if (showToast) showToast("No deadlines available to export", "info");
            return;
        }
        downloadICS(deadlines, "my_deadlines.ics");
        if (showToast) showToast("Downloaded my_deadlines.ics", "success");
    }

    return (
        <div className="app-layout deadlines-page">
            <header className="app-header">
                <div className="header-brand">
                    <div className="brand-badge brand-deadlines">DL</div>
                    <div>
                        <h1 className="app-title">Deadlines & Tasks</h1>
                        <p className="app-subtitle">Welcome back, {user.username}</p>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <MobileNotificationDrawer deadlines={deadlines} />
                    <button className="logout-btn" onClick={onLogout}>Logout</button>
                </div>
            </header>

            <main className="container">
                <Link to="/" className="back-link">← Back to Dashboard</Link>

                <div className="page-header-box">
                    <h2 className="page-title">Deadlines & Academic Hub</h2>
                    <p className="page-subtitle">Tasks, subtask checklists, calendar export, and semester timeline.</p>
                </div>

                <div className="dl-toolbar" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <Link to="/deadlines/new" className="dl-btn dl-btn-primary">+ Add Deadline</Link>
                    <button type="button" className="dl-btn" onClick={handleExportCalendar}>
                        📅 Export to Calendar (.ics)
                    </button>
                </div>

                <div className="dl-tabs">
                    <button
                        className={"dl-tab" + (tab === "list" ? " active" : "")}
                        onClick={() => setTab("list")}
                    >
                        Task List
                    </button>
                    <button
                        className={"dl-tab" + (tab === "kanban" ? " active" : "")}
                        onClick={() => setTab("kanban")}
                    >
                        📋 Kanban Board
                    </button>
                    <button
                        className={"dl-tab" + (tab === "timeline" ? " active" : "")}
                        onClick={() => setTab("timeline")}
                    >
                        📅 Semester Timeline
                    </button>
                    <button
                        className={"dl-tab" + (tab === "overview" ? " active" : "")}
                        onClick={() => setTab("overview")}
                    >
                        Analytics & Overview
                    </button>
                </div>

                {(tab === "list" || tab === "kanban") && (
                    <>
                        <div className="dl-toolbar">
                            {DEADLINE_TYPES.map((t) => (
                                <button
                                    key={t}
                                    className={"dl-btn" + (typeFilter === t ? " active" : "")}
                                    onClick={() => setTypeFilter(t)}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        <div className="dl-toolbar">
                            <label>
                                Subject:{" "}
                                <select
                                    className="dl-select"
                                    value={subjectFilter}
                                    onChange={(e) => setSubjectFilter(e.target.value)}
                                >
                                    <option value="All">All Subjects</option>
                                    {subjects.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </>
                )}

                {tab === "list" && (
                    <div className="dl-list">
                        {deadlines.length === 0 && (
                            <div className="dl-empty">No deadlines found. Add one to get started.</div>
                        )}
                        {deadlines.map((d) => {
                            const status = getUrgencyStatus(d.dueDate, d.completed);
                            const progress = getSubtaskProgress(d.subtasks);
                            const stage = d.status || (d.completed ? "Completed" : "To Do");

                            return (
                                <Link
                                    to={"/deadlines/" + d._id}
                                    key={d._id}
                                    className={"dl-row" + (d.completed ? " completed" : "")}
                                >
                                    <div className="dl-row-top">
                                        <span className="dl-row-title">{d.title}</span>
                                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                                            <span className="dl-stage-tag">{stage}</span>
                                            {d.resourceLinks?.length > 0 && (
                                                <span className="dl-resource-tag">🔗 {d.resourceLinks.length}</span>
                                            )}
                                            {progress.total > 0 && (
                                                <span className="dl-progress-tag">
                                                    {progress.done}/{progress.total}
                                                </span>
                                            )}
                                            <span className={"dl-badge " + status}>
                                                {getUrgencyLabel(d.dueDate, d.completed)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="dl-row-meta">
                                        {d.subject} · {d.type} · Due {formatDueDate(d.dueDate)}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {tab === "kanban" && (
                    <div className="dl-kanban-board">
                        {["To Do", "In Progress", "Under Review", "Completed"].map((stageCol) => {
                            const colDeadlines = deadlines.filter(
                                (d) => (d.status || (d.completed ? "Completed" : "To Do")) === stageCol
                            );

                            return (
                                <div className="dl-kanban-col" key={stageCol}>
                                    <div className="dl-kanban-col-header">
                                        <h4>{stageCol}</h4>
                                        <span className="dl-kanban-count">{colDeadlines.length}</span>
                                    </div>

                                    <div className="dl-kanban-cards">
                                        {colDeadlines.length === 0 ? (
                                            <div className="dl-kanban-empty">Empty</div>
                                        ) : (
                                            colDeadlines.map((d) => {
                                                const status = getUrgencyStatus(d.dueDate, d.completed);
                                                const progress = getSubtaskProgress(d.subtasks);

                                                return (
                                                    <Link
                                                        to={"/deadlines/" + d._id}
                                                        key={d._id}
                                                        className="dl-kanban-card"
                                                    >
                                                        <div className="kanban-card-top">
                                                            <span className="kanban-card-title">{d.title}</span>
                                                            <span className={`dl-badge ${status}`}>
                                                                {formatDueDate(d.dueDate)}
                                                            </span>
                                                        </div>

                                                        <div className="kanban-card-sub">{d.subject}</div>

                                                        <div className="kanban-card-meta">
                                                            <span className="kanban-type-tag">{d.type}</span>
                                                            {d.resourceLinks?.length > 0 && (
                                                                <span className="dl-resource-tag">🔗 {d.resourceLinks.length} links</span>
                                                            )}
                                                            {progress.total > 0 && (
                                                                <span className="dl-progress-tag">
                                                                    {progress.done}/{progress.total}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </Link>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {tab === "timeline" && <TimelineTab />}

                {tab === "overview" && <OverviewTab analytics={analytics} />}
            </main>
        </div>
    );
}

export default DeadlinesPage;
