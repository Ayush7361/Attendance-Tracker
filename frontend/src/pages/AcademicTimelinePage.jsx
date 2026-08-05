import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getSemesterEvents, createSemesterEvent, deleteSemesterEvent } from "../api/semesterApi";
import { formatDueDate } from "../utils/deadlineUtils";
import "../styles/Timeline.css";

const CATEGORIES = [
    { id: "ALL", label: "All Events", icon: "🗓️" },
    { id: "SEMESTER", label: "Semester Events", icon: "🏫" },
    { id: "EXAM", label: "Exam Schedule", icon: "📝" },
    { id: "IMPORTANT", label: "Important Dates", icon: "📌" }
];

const TYPE_MAP = {
    SEMESTER: ["Semester Event", "Break", "Orientation", "Other"],
    EXAM: ["Exam", "Quiz", "Lab Exam", "Midterm", "Final"],
    IMPORTANT: ["Important Date", "Registration", "Fee Deadline"]
};

function AcademicTimelinePage({ user, onLogout }) {
    const [events, setEvents] = useState([]);
    const [activeTab, setActiveTab] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Form state
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [type, setType] = useState("Semester Event");

    useEffect(() => {
        loadEvents();
    }, []);

    async function loadEvents() {
        setIsLoading(true);
        try {
            const res = await getSemesterEvents();
            setEvents(res.data || []);
        } catch (err) {
            console.error("Failed to load academic events", err);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleAddEvent(e) {
        e.preventDefault();
        if (!title.trim() || !date) return;
        try {
            await createSemesterEvent({ title: title.trim(), date, type });
            setTitle("");
            setDate("");
            loadEvents();
        } catch (err) {
            console.error("Failed to create event", err);
        }
    }

    async function handleDeleteEvent(id) {
        try {
            await deleteSemesterEvent(id);
            loadEvents();
        } catch (err) {
            console.error("Failed to delete event", err);
        }
    }

    const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Filter events by tab and search
    const filteredEvents = sortedEvents.filter((ev) => {
        const matchesTab =
            activeTab === "ALL" ||
            (activeTab === "SEMESTER" && (TYPE_MAP.SEMESTER.includes(ev.type) || ev.type === "Break")) ||
            (activeTab === "EXAM" && (TYPE_MAP.EXAM.includes(ev.type) || ev.type === "Exam")) ||
            (activeTab === "IMPORTANT" && (TYPE_MAP.IMPORTANT.includes(ev.type) || ev.type === "Registration"));

        const matchesSearch =
            ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ev.type.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesTab && matchesSearch;
    });

    // Counts for stats
    const semesterCount = events.filter((e) => TYPE_MAP.SEMESTER.includes(e.type) || e.type === "Break").length;
    const examCount = events.filter((e) => TYPE_MAP.EXAM.includes(e.type) || e.type === "Exam").length;
    const importantCount = events.filter((e) => TYPE_MAP.IMPORTANT.includes(e.type) || e.type === "Registration").length;

    // Timeline bar calculation
    let timelineBar = null;
    if (sortedEvents.length >= 2) {
        const min = new Date(sortedEvents[0].date).getTime();
        const max = new Date(sortedEvents[sortedEvents.length - 1].date).getTime();
        const range = max - min || 1;

        timelineBar = (
            <div className="tl-bar-container">
                <div className="tl-bar-track">
                    {sortedEvents.map((ev) => {
                        const pos = ((new Date(ev.date).getTime() - min) / range) * 100;
                        const isExam = ev.type === "Exam" || TYPE_MAP.EXAM.includes(ev.type);
                        const isImportant = ev.type === "Registration" || TYPE_MAP.IMPORTANT.includes(ev.type);

                        let badgeClass = "tl-dot-semester";
                        if (isExam) badgeClass = "tl-dot-exam";
                        else if (isImportant) badgeClass = "tl-dot-important";

                        return (
                            <div
                                key={ev._id}
                                className="tl-marker"
                                style={{ left: `${Math.min(Math.max(pos, 3), 97)}%` }}
                                title={`${ev.title} (${ev.type}) — ${formatDueDate(ev.date)}`}
                            >
                                <span className={`tl-dot ${badgeClass}`} />
                                <span className="tl-marker-label">{ev.title}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="app-layout timeline-page">
            <header className="app-header">
                <div className="header-brand">
                    <div className="brand-badge brand-timeline">TL</div>
                    <div>
                        <h1 className="app-title">Academic Timeline</h1>
                        <p className="app-subtitle">Welcome back, {user.username}</p>
                    </div>
                </div>
                <button className="logout-btn" onClick={onLogout}>Logout</button>
            </header>

            <main className="container">
                <Link to="/" className="back-link">← Back to Dashboard</Link>

                {/* Stats Overview */}
                <div className="tl-stats-grid">
                    <div
                        className={`tl-stat-card ${activeTab === "SEMESTER" ? "active" : ""}`}
                        onClick={() => setActiveTab("SEMESTER")}
                    >
                        <div className="tl-stat-icon">🏫</div>
                        <div>
                            <h4>Semester Events</h4>
                            <p>{semesterCount} Events</p>
                        </div>
                    </div>
                    <div
                        className={`tl-stat-card ${activeTab === "EXAM" ? "active" : ""}`}
                        onClick={() => setActiveTab("EXAM")}
                    >
                        <div className="tl-stat-icon">📝</div>
                        <div>
                            <h4>Exam Schedule</h4>
                            <p>{examCount} Exams</p>
                        </div>
                    </div>
                    <div
                        className={`tl-stat-card ${activeTab === "IMPORTANT" ? "active" : ""}`}
                        onClick={() => setActiveTab("IMPORTANT")}
                    >
                        <div className="tl-stat-icon">📌</div>
                        <div>
                            <h4>Important Dates</h4>
                            <p>{importantCount} Dates</p>
                        </div>
                    </div>
                </div>

                {/* Visual Timeline */}
                <div className="tl-panel">
                    <h3 className="tl-panel-title">Visual Semester Overview</h3>
                    {timelineBar || (
                        <p className="tl-empty-hint">Add 2 or more dates to view the visual timeline bar.</p>
                    )}
                </div>

                {/* Add Event Section */}
                <div className="tl-panel">
                    <h3 className="tl-panel-title">Add Academic Event</h3>
                    <form className="tl-form" onSubmit={handleAddEvent}>
                        <div className="tl-form-row">
                            <input
                                className="tl-input"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Event title (e.g. Midterm Exam, Cultural Fest, Drop Date)"
                                required
                            />
                            <input
                                type="date"
                                className="tl-input"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                            <select
                                className="tl-select"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                <option value="Semester Event">Semester Event</option>
                                <option value="Exam">Exam</option>
                                <option value="Important Date">Important Date</option>
                                <option value="Break">Break / Recess</option>
                                <option value="Registration">Registration</option>
                                <option value="Other">Other</option>
                            </select>
                            <button type="submit" className="tl-btn-add">+ Add Event</button>
                        </div>
                    </form>
                </div>

                {/* Filter Tabs & Search */}
                <div className="tl-controls-bar">
                    <div className="tl-category-tabs">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                className={`tl-cat-tab ${activeTab === cat.id ? "active" : ""}`}
                                onClick={() => setActiveTab(cat.id)}
                            >
                                <span>{cat.icon}</span> {cat.label}
                            </button>
                        ))}
                    </div>

                    <input
                        type="text"
                        className="tl-search-input"
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Event List */}
                <div className="tl-event-list">
                    {isLoading ? (
                        <div className="tl-empty">Loading timeline events...</div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="tl-empty">
                            No events found for this filter. Add your semester events, exam schedules, or key dates above!
                        </div>
                    ) : (
                        filteredEvents.map((ev) => {
                            const isExam = ev.type === "Exam" || TYPE_MAP.EXAM.includes(ev.type);
                            const isImportant = ev.type === "Registration" || TYPE_MAP.IMPORTANT.includes(ev.type);

                            let badgeStyle = "badge-semester";
                            if (isExam) badgeStyle = "badge-exam";
                            else if (isImportant) badgeStyle = "badge-important";

                            const eventDate = new Date(ev.date);
                            const now = new Date();
                            const isPast = eventDate < now.setHours(0,0,0,0);

                            return (
                                <div key={ev._id} className={`tl-event-card ${isPast ? "past" : ""}`}>
                                    <div className="tl-event-date-box">
                                        <span className="tl-date-day">{eventDate.getDate()}</span>
                                        <span className="tl-date-month">
                                            {eventDate.toLocaleString("default", { month: "short" })}
                                        </span>
                                    </div>
                                    <div className="tl-event-info">
                                        <div className="tl-event-top">
                                            <h4 className="tl-event-title">{ev.title}</h4>
                                            <span className={`tl-type-badge ${badgeStyle}`}>{ev.type}</span>
                                        </div>
                                        <div className="tl-event-meta">
                                            📅 {formatDueDate(ev.date)} {isPast && "· (Past)"}
                                        </div>
                                    </div>
                                    <button
                                        className="tl-delete-btn"
                                        onClick={() => handleDeleteEvent(ev._id)}
                                        title="Delete Event"
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
}

export default AcademicTimelinePage;
