import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getSemesterEvents, createSemesterEvent, deleteSemesterEvent } from "../api/semesterApi";
import { formatDueDate } from "../utils/deadlineUtils";
import "../styles/Timeline.css";

const CATEGORIES = [
    { id: "ALL", label: "All Events" },
    { id: "SEMESTER", label: "Semester Events" },
    { id: "EXAM", label: "Exam Schedule" },
    { id: "IMPORTANT", label: "Important Dates" }
];

const TYPE_MAP = {
    SEMESTER: ["Semester Event", "Break", "Orientation", "Other"],
    EXAM: ["Exam", "Quiz", "Lab Exam", "Midterm", "Final"],
    IMPORTANT: ["Important Date", "Fee Deadline"]
};

function AcademicTimelinePage({ user, onLogout }) {
    const [events, setEvents] = useState([]);
    const [activeTab, setActiveTab] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

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

    const filteredEvents = sortedEvents.filter((ev) => {
        const matchesTab =
            activeTab === "ALL" ||
            (activeTab === "SEMESTER" && (TYPE_MAP.SEMESTER.includes(ev.type) || ev.type === "Break")) ||
            (activeTab === "EXAM" && (TYPE_MAP.EXAM.includes(ev.type) || ev.type === "Exam")) ||
            (activeTab === "IMPORTANT" && (TYPE_MAP.IMPORTANT.includes(ev.type) || ev.type === "Important Date"));

        const matchesSearch =
            ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ev.type.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesTab && matchesSearch;
    });

    const semesterCount = events.filter((e) => TYPE_MAP.SEMESTER.includes(e.type) || e.type === "Break").length;
    const examCount = events.filter((e) => TYPE_MAP.EXAM.includes(e.type) || e.type === "Exam").length;
    const importantCount = events.filter((e) => TYPE_MAP.IMPORTANT.includes(e.type) || e.type === "Important Date").length;

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

                <div className="page-header-box">
                    <h2 className="page-title">Academic Timeline</h2>
                    <p className="page-subtitle">Manage semester events, exam schedules, and important dates.</p>
                </div>

                {/* Section Overview Cards */}
                <div className="tl-stats-grid">
                    <div
                        className={`tl-stat-card ${activeTab === "SEMESTER" ? "active" : ""}`}
                        onClick={() => setActiveTab("SEMESTER")}
                    >
                        <h4>Semester Events</h4>
                        <p>{semesterCount} Events</p>
                    </div>
                    <div
                        className={`tl-stat-card ${activeTab === "EXAM" ? "active" : ""}`}
                        onClick={() => setActiveTab("EXAM")}
                    >
                        <h4>Exam Schedule</h4>
                        <p>{examCount} Exams</p>
                    </div>
                    <div
                        className={`tl-stat-card ${activeTab === "IMPORTANT" ? "active" : ""}`}
                        onClick={() => setActiveTab("IMPORTANT")}
                    >
                        <h4>Important Dates</h4>
                        <p>{importantCount} Dates</p>
                    </div>
                </div>

                {/* Add Event Form Panel */}
                <div className="card-panel">
                    <h3 className="panel-heading">Add New Event</h3>
                    <form className="tl-form" onSubmit={handleAddEvent}>
                        <div className="tl-form-row">
                            <input
                                className="tl-input"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Event title (e.g. Midterm Exam, Cultural Fest, Fee Deadline)"
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
                                <option value="Other">Other</option>
                            </select>
                            <button type="submit" className="tl-btn-add">+ Add Event</button>
                        </div>
                    </form>
                </div>

                {/* Filter Tabs & Search Bar */}
                <div className="tl-controls-bar">
                    <div className="tl-category-tabs">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                className={`tl-cat-tab ${activeTab === cat.id ? "active" : ""}`}
                                onClick={() => setActiveTab(cat.id)}
                            >
                                {cat.label}
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
                            No events found. Use the form above to add semester events, exam schedules, or important dates.
                        </div>
                    ) : (
                        filteredEvents.map((ev) => {
                            const isExam = ev.type === "Exam" || TYPE_MAP.EXAM.includes(ev.type);
                            const isImportant = TYPE_MAP.IMPORTANT.includes(ev.type) || ev.type === "Important Date";

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
                                            Due {formatDueDate(ev.date)} {isPast && "· (Past)"}
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
