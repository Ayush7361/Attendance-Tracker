import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getSchedule, saveSchedule } from "../api/attendanceApi";
import MobileNotificationDrawer from "../components/MobileNotificationDrawer";
import { useToast } from "../context/ToastContext";
import "../styles/Routine.css";

const DAYS = [
    { id: "mon", label: "Monday" },
    { id: "tue", label: "Tuesday" },
    { id: "wed", label: "Wednesday" },
    { id: "thu", label: "Thursday" },
    { id: "fri", label: "Friday" },
    { id: "sat", label: "Saturday" },
    { id: "sun", label: "Sunday" }
];

function RoutinePage({ user, onLogout }) {
    const { showToast } = useToast();
    const [schedule, setSchedule] = useState({ mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] });
    const [activeDay, setActiveDay] = useState("mon");
    const [newSubjectInput, setNewSubjectInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSchedule();
    }, []);

    async function loadSchedule() {
        setIsLoading(true);
        try {
            const res = await getSchedule();
            if (res.data) setSchedule(res.data);
        } catch (err) {
            console.error("Failed to load schedule", err);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleAddClass(e) {
        e.preventDefault();
        if (!newSubjectInput.trim()) return;

        const updated = {
            ...schedule,
            [activeDay]: [...(schedule[activeDay] || []), newSubjectInput.trim()]
        };

        try {
            await saveSchedule(updated);
            setSchedule(updated);
            setNewSubjectInput("");
            if (showToast) showToast(`Added class to ${DAYS.find((d) => d.id === activeDay)?.label}`, "success");
        } catch (err) {
            console.error("Failed to add class", err);
        }
    }

    async function handleRemoveClass(dayKey, index) {
        const updatedDay = [...(schedule[dayKey] || [])];
        updatedDay.splice(index, 1);
        const updated = { ...schedule, [dayKey]: updatedDay };

        try {
            await saveSchedule(updated);
            setSchedule(updated);
            if (showToast) showToast("Class removed from routine", "info");
        } catch (err) {
            console.error("Failed to remove class", err);
        }
    }

    const totalWeeklyClasses = Object.values(schedule).reduce(
        (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
        0
    );

    return (
        <div className="app-layout routine-page">
            <header className="app-header">
                <div className="header-brand">
                    <div className="brand-badge" style={{ background: "#34d399" }}>RT</div>
                    <div>
                        <h1 className="app-title">Weekly Routine Grid</h1>
                        <p className="app-subtitle">Welcome back, {user.username}</p>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <MobileNotificationDrawer schedule={schedule} />
                    <button className="logout-btn" onClick={onLogout}>Logout</button>
                </div>
            </header>

            <main className="container">
                <Link to="/" className="back-link">← Back to Dashboard</Link>

                <div className="page-header-box">
                    <h2 className="page-title">Weekly Class Routine</h2>
                    <p className="page-subtitle">Interactive 7-day timetable grid for classes, labs, and study slots.</p>
                </div>

                <div className="routine-summary-card card-panel">
                    <div className="routine-summary-flex">
                        <div>
                            <h3 className="panel-heading" style={{ margin: 0 }}>Total Weekly Lectures</h3>
                            <p className="page-subtitle">{totalWeeklyClasses} classes scheduled per week</p>
                        </div>
                        <Link to="/attendance" className="routine-attendance-btn">
                            Log Today's Attendance →
                        </Link>
                    </div>
                </div>

                <div className="routine-editor-panel card-panel">
                    <div className="routine-day-tabs">
                        {DAYS.map((d) => {
                            const count = (schedule[d.id] || []).length;
                            return (
                                <button
                                    key={d.id}
                                    type="button"
                                    className={`routine-day-tab ${activeDay === d.id ? "active" : ""}`}
                                    onClick={() => setActiveDay(d.id)}
                                >
                                    <span>{d.label.slice(0, 3)}</span>
                                    {count > 0 && <span className="routine-count-dot">{count}</span>}
                                </button>
                            );
                        })}
                    </div>

                    <form onSubmit={handleAddClass} className="routine-add-form">
                        <input
                            type="text"
                            placeholder={`Add class to ${DAYS.find((d) => d.id === activeDay)?.label} (e.g. Operating Systems)`}
                            value={newSubjectInput}
                            onChange={(e) => setNewSubjectInput(e.target.value)}
                            className="routine-input"
                            required
                        />
                        <button type="submit" className="routine-add-btn">
                            + Add Class
                        </button>
                    </form>
                </div>

                <div className="routine-grid-container">
                    <h3 className="panel-heading">Visual 7-Day Timetable</h3>
                    <div className="routine-7day-grid">
                        {DAYS.map((d) => {
                            const list = schedule[d.id] || [];
                            return (
                                <div key={d.id} className={`routine-day-column ${activeDay === d.id ? "highlight" : ""}`}>
                                    <div className="routine-col-header">
                                        <h4>{d.label}</h4>
                                        <span className="routine-col-badge">{list.length}</span>
                                    </div>
                                    <div className="routine-col-body">
                                        {list.length === 0 ? (
                                            <div className="routine-col-empty">No classes</div>
                                        ) : (
                                            list.map((sub, idx) => (
                                                <div key={idx} className="routine-class-card">
                                                    <span className="routine-class-title">{sub}</span>
                                                    <div className="routine-class-actions">
                                                        <Link
                                                            to={`/study?subject=${encodeURIComponent(sub)}`}
                                                            className="routine-focus-link"
                                                            title={`Focus session for ${sub}`}
                                                        >
                                                            Focus
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            className="routine-remove-class"
                                                            onClick={() => handleRemoveClass(d.id, idx)}
                                                            title="Remove class"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default RoutinePage;
