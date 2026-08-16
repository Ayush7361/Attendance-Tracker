import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getDeadline, updateDeadline, deleteDeadline } from "../api/deadlinesApi";
import { getSemesterEvents } from "../api/semesterApi";
import {
    getUrgencyStatus,
    getUrgencyLabel,
    formatDueDate,
    getSubtaskProgress
} from "../utils/deadlineUtils";
import "../styles/Deadlines.css";

function DeadlineDetailPage({ user, onLogout }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [deadline, setDeadline] = useState(null);
    const [semesterEvents, setSemesterEvents] = useState([]);

    useEffect(() => {
        loadDeadline();
    }, [id]);

    async function loadDeadline() {
        try {
            const res = await getDeadline(id);
            setDeadline(res.data);
        } catch (err) {
            console.error("Failed to load deadline", err);
            navigate("/deadlines");
        }

        try {
            const eventsRes = await getSemesterEvents();
            setSemesterEvents(eventsRes.data || []);
        } catch (err) {
            console.error("Failed to load semester events for cross-link", err);
        }
    }

    async function toggleSubtask(index) {
        const subtasks = deadline.subtasks.map((s, i) =>
            i === index ? { ...s, done: !s.done } : s
        );
        const res = await updateDeadline(id, { subtasks });
        setDeadline(res.data);
    }

    async function toggleComplete() {
        const res = await updateDeadline(id, { completed: !deadline.completed });
        setDeadline(res.data);
    }

    async function handleDelete() {
        if (!confirm("Delete this deadline?")) return;
        await deleteDeadline(id);
        navigate("/deadlines");
    }

    if (!deadline) {
        return (
            <div className="app-layout deadlines-page">
                <main className="container"><p>Loading...</p></main>
            </div>
        );
    }

    const status = getUrgencyStatus(deadline.dueDate, deadline.completed);
    const progress = getSubtaskProgress(deadline.subtasks);

    const subjectLower = (deadline.subject || "").toLowerCase();
    const deadlineDate = new Date(deadline.dueDate);

    const relatedExam = semesterEvents.find((ev) => {
        const isExamType = ev.type === "Exam" || /exam|midterm|final|quiz|test/i.test(ev.type || "") || /exam|midterm|final|quiz|test/i.test(ev.title || "");
        if (!isExamType) return false;

        const evTitleLower = (ev.title || "").toLowerCase();
        const evDate = new Date(ev.date);
        const dayDiff = Math.abs((evDate - deadlineDate) / (1000 * 60 * 60 * 24));

        const matchesSubject = subjectLower && evTitleLower.includes(subjectLower);
        const matchesDateProximity = dayDiff <= 7;

        return matchesSubject || matchesDateProximity;
    });

    return (
        <div className="app-layout deadlines-page">
            <header className="app-header">
                <div className="header-brand">
                    <div className="brand-badge">DL</div>
                    <div>
                        <h1 className="app-title">Task Detail</h1>
                        <p className="app-subtitle">{user.username}</p>
                    </div>
                </div>
                <button className="logout-btn" onClick={onLogout}>Logout</button>
            </header>

            <main className="container">
                <Link to="/deadlines" className="back-link">← Back to Deadlines</Link>

                <div className="dl-detail">
                    {relatedExam && (
                        <div className="smart-crosslink-card">
                            <div className="smart-crosslink-badge-pill">🔗 SMART CROSS-LINK</div>
                            <div className="smart-crosslink-content">
                                <h4>Related exam on timeline</h4>
                                <p>
                                    <strong>{relatedExam.title}</strong> on <strong>{formatDueDate(relatedExam.date)}</strong>
                                </p>
                            </div>
                            <Link to="/timeline" className="smart-crosslink-link">
                                View on Timeline →
                            </Link>
                        </div>
                    )}

                    <div className="dl-detail-header">
                        <h2>{deadline.title}</h2>
                        <div className="dl-detail-meta">
                            <span>Subject: {deadline.subject}</span>
                            <span>Type: {deadline.type}</span>
                            <span>Due: {formatDueDate(deadline.dueDate)}</span>
                            <span>Priority: {deadline.priority}</span>
                            <span className={"dl-badge " + status}>
                                {getUrgencyLabel(deadline.dueDate, deadline.completed)}
                            </span>
                        </div>
                    </div>

                    {deadline.description && (
                        <div className="dl-section">
                            <h3>Description</h3>
                            <p>{deadline.description}</p>
                        </div>
                    )}

                    {deadline.estimatedHours != null && (
                        <div className="dl-section">
                            <h3>Estimated Hours</h3>
                            <p>{deadline.estimatedHours}h</p>
                        </div>
                    )}

                    <div className="dl-section">
                        <h3>Subtasks</h3>
                        {deadline.subtasks.length === 0 ? (
                            <p style={{ fontSize: "13px", color: "#666" }}>No subtasks added.</p>
                        ) : (
                            <div className="dl-subtask-list">
                                {deadline.subtasks.map((s, i) => (
                                    <label className="dl-subtask-item" key={i}>
                                        <input
                                            type="checkbox"
                                            checked={s.done}
                                            onChange={() => toggleSubtask(i)}
                                        />
                                        <span style={s.done ? { textDecoration: "line-through" } : {}}>
                                            {s.text}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                        {progress.total > 0 && (
                            <p className="dl-progress-text">
                                {progress.done}/{progress.total} completed ({progress.percent}%)
                            </p>
                        )}
                    </div>

                    <div className="dl-detail-actions">
                        <Link to={`/study?subject=${encodeURIComponent(deadline.subject)}`} className="dl-btn dl-btn-study">
                            ⏱️ Start Study Session
                        </Link>
                        <button className="dl-btn" onClick={toggleComplete}>
                            {deadline.completed ? "Mark Incomplete" : "Mark Complete"}
                        </button>
                        <Link to={"/deadlines/" + id + "/edit"} className="dl-btn">Edit</Link>
                        <button className="dl-btn dl-btn-danger" onClick={handleDelete}>Delete</button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default DeadlineDetailPage;
