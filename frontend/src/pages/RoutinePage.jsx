import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getSchedule, saveSchedule, saveDay, getDay } from "../api/attendanceApi";
import MobileNotificationDrawer from "../components/MobileNotificationDrawer";
import { useToast } from "../context/ToastContext";
import { downloadICS } from "../utils/icsExport";
import "../styles/Routine.css";

const DAYS = [
    { id: "mon", label: "Monday", short: "Mon" },
    { id: "tue", label: "Tuesday", short: "Tue" },
    { id: "wed", label: "Wednesday", short: "Wed" },
    { id: "thu", label: "Thursday", short: "Thu" },
    { id: "fri", label: "Friday", short: "Fri" },
    { id: "sat", label: "Saturday", short: "Sat" },
    { id: "sun", label: "Sunday", short: "Sun" }
];

const DAY_INDEX_MAP = {
    0: "sun",
    1: "mon",
    2: "tue",
    3: "wed",
    4: "thu",
    5: "fri",
    6: "sat"
};

function normalizeClass(item) {
    if (typeof item === "string") {
        return {
            name: item,
            time: "09:00 AM",
            room: "",
            type: "Lecture"
        };
    }
    return {
        name: item.name || "Class",
        time: item.time || "",
        room: item.room || "",
        type: item.type || "Lecture"
    };
}

function getNextDateForDay(dayKey) {
    const today = new Date();
    const currentDayIdx = today.getDay();
    const targetDayIdx = Object.keys(DAY_INDEX_MAP).find(
        (key) => DAY_INDEX_MAP[key] === dayKey
    );
    let diff = Number(targetDayIdx) - currentDayIdx;
    if (diff < 0) diff += 7;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    return targetDate;
}

function RoutinePage({ user, onLogout }) {
    const { showToast } = useToast();
    const [schedule, setSchedule] = useState({ mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] });
    const [activeDay, setActiveDay] = useState(() => DAY_INDEX_MAP[new Date().getDay()] || "mon");
    const [isLoading, setIsLoading] = useState(true);

    // Form inputs for adding a rich class
    const [newSubjectInput, setNewSubjectInput] = useState("");
    const [newTimeInput, setNewTimeInput] = useState("");
    const [newRoomInput, setNewRoomInput] = useState("");
    const [newTypeInput, setNewTypeInput] = useState("Lecture");

    const todayKey = DAY_INDEX_MAP[new Date().getDay()];

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

        const newClassObj = {
            name: newSubjectInput.trim(),
            time: newTimeInput.trim() || "09:00 AM",
            room: newRoomInput.trim() || "",
            type: newTypeInput
        };

        const updated = {
            ...schedule,
            [activeDay]: [...(schedule[activeDay] || []), newClassObj]
        };

        try {
            await saveSchedule(updated);
            setSchedule(updated);
            setNewSubjectInput("");
            setNewTimeInput("");
            setNewRoomInput("");
            if (showToast) showToast(`Added class to ${DAYS.find((d) => d.id === activeDay)?.label}`, "success");
        } catch (err) {
            console.error("Failed to add class", err);
            if (showToast) showToast("Failed to add class", "error");
        }
    }

    async function handleRemoveClass(dayKey, index) {
        const updatedList = (schedule[dayKey] || []).filter((_, idx) => idx !== index);
        const updated = {
            ...schedule,
            [dayKey]: updatedList
        };

        try {
            await saveSchedule(updated);
            setSchedule(updated);
            if (showToast) showToast("Class removed from routine", "info");
        } catch (err) {
            console.error("Failed to remove class", err);
        }
    }

    // Analytics calculations
    const totalWeeklyClasses = Object.values(schedule).reduce(
        (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
        0
    );

    let busiestDayName = "None";
    let maxClasses = 0;
    DAYS.forEach((d) => {
        const count = (schedule[d.id] || []).length;
        if (count > maxClasses) {
            maxClasses = count;
            busiestDayName = d.label;
        }
    });

    const todaysClassesRaw = schedule[todayKey] || [];
    const todaysClasses = todaysClassesRaw.map(normalizeClass);

    // Export Routine to Calendar (.ics)
    function handleExportRoutineCalendar() {
        const exportItems = [];
        DAYS.forEach((d) => {
            const list = (schedule[d.id] || []).map(normalizeClass);
            const classDate = getNextDateForDay(d.id);
            list.forEach((cls) => {
                exportItems.push({
                    title: `Class: ${cls.name}`,
                    date: classDate.toISOString(),
                    description: `Room: ${cls.room || 'N/A'} | Type: ${cls.type} | Time: ${cls.time}`,
                    type: cls.type
                });
            });
        });

        if (exportItems.length === 0) {
            if (showToast) showToast("No classes in routine to export", "info");
            return;
        }

        downloadICS(exportItems, "my_weekly_routine.ics");
        if (showToast) showToast("Downloaded my_weekly_routine.ics!", "success");
    }

    // Copy Schedule to Clipboard
    function handleCopyScheduleText() {
        let text = "📚 My Weekly Class Routine:\n\n";
        DAYS.forEach((d) => {
            const list = (schedule[d.id] || []).map(normalizeClass);
            if (list.length > 0) {
                text += `${d.label}:\n`;
                list.forEach((c) => {
                    text += `  • ${c.name} ${c.time ? `(${c.time})` : ''} ${c.room ? `[${c.room}]` : ''} (${c.type})\n`;
                });
                text += "\n";
            }
        });

        navigator.clipboard.writeText(text);
        if (showToast) showToast("Schedule copied to clipboard!", "success");
    }

    return (
        <div className="app-layout routine-page">
            <header className="app-header">
                <Link to="/" className="header-brand-link" title="Return to Dashboard">
                    <div className="header-brand">
                        <div className="brand-badge" style={{ background: "#34d399" }}>RT</div>
                        <div>
                            <h1 className="app-title">Weekly Routine Grid</h1>
                            <p className="app-subtitle">Welcome back, {user.username}</p>
                        </div>
                    </div>
                </Link>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <MobileNotificationDrawer schedule={schedule} />
                    <button className="logout-btn" onClick={onLogout}>Logout</button>
                </div>
            </header>

            <main className="container">
                <Link to="/" className="back-link">← Back to Dashboard</Link>

                <div className="page-header-box">
                    <h2 className="page-title">Weekly Class Routine & Timetable</h2>
                    <p className="page-subtitle">Your weekly class timetable.</p>
                </div>

                {/* Today's Hero Live Class Banner */}
                <div className="routine-hero-card card-panel">
                    <div className="hero-card-header">
                        <div>
                            <span className="hero-today-tag">⚡ TODAY'S CLASS SCHEDULE</span>
                            <h3 className="hero-today-title">
                                {DAYS.find((d) => d.id === todayKey)?.label} ({todaysClasses.length} {todaysClasses.length === 1 ? "Class" : "Classes"})
                            </h3>
                        </div>
                        <Link to="/attendance" className="routine-attendance-btn">
                            Log Attendance Log →
                        </Link>
                    </div>

                    {todaysClasses.length === 0 ? (
                        <p className="hero-today-empty">No classes scheduled for today. Take time to relax or focus on self-study!</p>
                    ) : (
                        <div className="hero-today-grid">
                            {todaysClasses.map((cls, idx) => (
                                <div key={idx} className="hero-class-item">
                                    <div className="hero-class-info">
                                        <span className={`routine-type-pill pill-${cls.type.toLowerCase()}`}>
                                            {cls.type}
                                        </span>
                                        <h4 className="hero-class-name">{cls.name}</h4>
                                        <span className="hero-class-meta">
                                            {cls.time && <span>🕒 {cls.time}</span>}
                                            {cls.room && <span>📍 {cls.room}</span>}
                                        </span>
                                    </div>
                                    <Link
                                        to={`/study?subject=${encodeURIComponent(cls.name)}`}
                                        className="hero-focus-btn"
                                        title={`Start study session for ${cls.name}`}
                                    >
                                        Start Focus Session →
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Workload Analytics & Export Bar */}
                <div className="routine-summary-card card-panel">
                    <div className="routine-summary-flex">
                        <div>
                            <h3 className="panel-heading" style={{ margin: 0 }}>Weekly Academic Workload</h3>
                            <p className="page-subtitle" style={{ marginTop: "2px" }}>
                                {totalWeeklyClasses} total classes per week • Busiest Day: <strong>{busiestDayName} ({maxClasses} classes)</strong>
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button
                                type="button"
                                className="gpa-btn gpa-btn-primary"
                                onClick={handleExportRoutineCalendar}
                                style={{ fontSize: "0.82rem", padding: "8px 12px" }}
                            >
                                📅 Export Calendar (.ics)
                            </button>
                            <button
                                type="button"
                                className="gpa-btn gpa-btn-primary"
                                onClick={handleCopyScheduleText}
                                style={{ fontSize: "0.82rem", padding: "8px 12px" }}
                            >
                                📋 Copy Text
                            </button>
                        </div>
                    </div>
                </div>

                {/* Rich Class Add Form Panel */}
                <div className="routine-editor-panel card-panel">
                    <h3 className="panel-heading">Manage Classes for {DAYS.find((d) => d.id === activeDay)?.label}</h3>

                    <div className="routine-day-tabs">
                        {DAYS.map((d) => {
                            const count = (schedule[d.id] || []).length;
                            const isToday = d.id === todayKey;
                            return (
                                <button
                                    key={d.id}
                                    type="button"
                                    className={`routine-day-tab ${activeDay === d.id ? "active" : ""} ${isToday ? "is-today" : ""}`}
                                    onClick={() => setActiveDay(d.id)}
                                >
                                    <span>{d.short}</span>
                                    {count > 0 && <span className="routine-count-dot">{count}</span>}
                                </button>
                            );
                        })}
                    </div>

                    <form onSubmit={handleAddClass} className="routine-rich-add-form">
                        <div className="routine-form-grid">
                            <input
                                type="text"
                                placeholder={`Subject Name (e.g. Operating Systems)`}
                                value={newSubjectInput}
                                onChange={(e) => setNewSubjectInput(e.target.value)}
                                className="routine-input"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Time (e.g. 10:00 - 11:30 AM)"
                                value={newTimeInput}
                                onChange={(e) => setNewTimeInput(e.target.value)}
                                className="routine-input"
                            />
                            <input
                                type="text"
                                placeholder="Room/Lab (e.g. Lab 302)"
                                value={newRoomInput}
                                onChange={(e) => setNewRoomInput(e.target.value)}
                                className="routine-input"
                            />
                            <select
                                value={newTypeInput}
                                onChange={(e) => setNewTypeInput(e.target.value)}
                                className="routine-select"
                            >
                                <option value="Lecture">Lecture</option>
                                <option value="Lab">Lab / Practical</option>
                                <option value="Tutorial">Tutorial</option>
                                <option value="Seminar">Seminar / Workshop</option>
                            </select>
                        </div>
                        <button type="submit" className="routine-add-btn">
                            + Add Class to {DAYS.find((d) => d.id === activeDay)?.short}
                        </button>
                    </form>
                </div>

                {/* 7-Day Visual Timetable Grid Matrix */}
                <div className="routine-grid-container">
                    <h3 className="panel-heading">Visual 7-Day Timetable Matrix</h3>
                    <div className="routine-7day-grid">
                        {DAYS.map((d) => {
                            const list = (schedule[d.id] || []).map(normalizeClass);
                            const isToday = d.id === todayKey;
                            const isSelected = activeDay === d.id;

                            return (
                                <div key={d.id} className={`routine-day-column ${isToday ? "is-today" : ""} ${isSelected ? "highlight" : ""}`}>
                                    <div className="routine-col-header">
                                        <div>
                                            <h4>{d.label}</h4>
                                            {isToday && <span className="routine-today-badge">TODAY</span>}
                                        </div>
                                        <span className="routine-col-badge">{list.length}</span>
                                    </div>
                                    <div className="routine-col-body">
                                        {list.length === 0 ? (
                                            <div className="routine-col-empty">No classes</div>
                                        ) : (
                                            list.map((cls, idx) => (
                                                <div key={idx} className="routine-class-card">
                                                    <div className="routine-card-header-row">
                                                        <span className={`routine-type-pill pill-${cls.type.toLowerCase()}`}>
                                                            {cls.type}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="routine-remove-class"
                                                            onClick={() => handleRemoveClass(d.id, idx)}
                                                            title="Remove class"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>

                                                    <span className="routine-class-title">{cls.name}</span>

                                                    {(cls.time || cls.room) && (
                                                        <div className="routine-class-meta-row">
                                                            {cls.time && <span className="routine-meta-item">🕒 {cls.time}</span>}
                                                            {cls.room && <span className="routine-meta-item">📍 {cls.room}</span>}
                                                        </div>
                                                    )}

                                                    <div className="routine-class-actions">
                                                        <Link
                                                            to={`/study?subject=${encodeURIComponent(cls.name)}`}
                                                            className="routine-focus-link"
                                                            title={`Focus session for ${cls.name}`}
                                                        >
                                                            Start Focus →
                                                        </Link>
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
