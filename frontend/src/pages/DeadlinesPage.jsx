import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getDeadlines, getDeadlineAnalytics, getDeadlineSubjects } from "../api/deadlinesApi";
import { getSemesterEvents } from "../api/semesterApi";
import SemesterTimeline from "../components/SemesterTimeline";
import {
    DEADLINE_TYPES,
    getUrgencyStatus,
    getUrgencyLabel,
    formatDueDate,
    getSubtaskProgress,
    STATUS_LABELS
} from "../utils/deadlineUtils";
import "../styles/Deadlines.css";

function OverviewTab({ analytics }) {
    if (!analytics) return <p className="dl-empty">Loading...</p>;

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

function DeadlinesPage({ user, onLogout }) {
    const [tab, setTab] = useState("list");
    const [typeFilter, setTypeFilter] = useState("All");
    const [subjectFilter, setSubjectFilter] = useState("All");
    const [deadlines, setDeadlines] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [semesterEvents, setSemesterEvents] = useState([]);

    useEffect(() => {
        loadDeadlines();
        loadSubjects();
    }, [typeFilter, subjectFilter]);

    useEffect(() => {
        if (tab === "overview") {
            loadAnalytics();
        }
        if (tab === "smart") {
            loadSmartData();
        }
    }, [tab]);

    async function loadSmartData() {
        try {
            const eventsRes = await getSemesterEvents();
            setSemesterEvents(eventsRes.data);
        } catch (err) {
            console.error("Failed to load smart data", err);
        }
    }

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

    return (
        <div className="app-layout deadlines-page">
            <header className="app-header">
                <div className="header-brand">
                    <div className="brand-badge">DL</div>
                    <div>
                        <h1 className="app-title">Deadlines</h1>
                        <p className="app-subtitle">Welcome back, {user.username}</p>
                    </div>
                </div>
                <button className="logout-btn" onClick={onLogout}>Logout</button>
            </header>

            <main className="container">
                <Link to="/" className="back-link">← Back to Dashboard</Link>

                <div className="dl-toolbar">
                    <Link to="/deadlines/new" className="dl-btn dl-btn-primary">+ Add Deadline</Link>
                </div>

                <div className="dl-tabs">
                    <button
                        className={"dl-tab" + (tab === "list" ? " active" : "")}
                        onClick={() => setTab("list")}
                    >
                        List
                    </button>
                    <button
                        className={"dl-tab" + (tab === "overview" ? " active" : "")}
                        onClick={() => setTab("overview")}
                    >
                        Overview
                    </button>
                    <button
                        className={"dl-tab" + (tab === "smart" ? " active" : "")}
                        onClick={() => setTab("smart")}
                    >
                        Smart
                    </button>
                </div>

                {tab === "list" && (
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

                        <div className="dl-list">
                            {deadlines.length === 0 && (
                                <div className="dl-empty">No deadlines found. Add one to get started.</div>
                            )}
                            {deadlines.map((d) => {
                                const status = getUrgencyStatus(d.dueDate, d.completed);
                                const progress = getSubtaskProgress(d.subtasks);
                                return (
                                    <Link
                                        to={"/deadlines/" + d._id}
                                        key={d._id}
                                        className={"dl-row" + (d.completed ? " completed" : "")}
                                    >
                                        <div className="dl-row-top">
                                            <span className="dl-row-title">{d.title}</span>
                                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
                    </>
                )}

                {tab === "overview" && <OverviewTab analytics={analytics} />}

                {tab === "smart" && (
                    <div className="dl-smart-tab">
                        <SemesterTimeline events={semesterEvents} onRefresh={loadSmartData} />
                    </div>
                )}
            </main>
        </div>
    );
}

export default DeadlinesPage;
