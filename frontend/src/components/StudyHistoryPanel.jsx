import { useState } from "react";

function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit"
    });
}

function StudyHistoryPanel({ sessions = [], onDeleteSession }) {
    const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("All");
    const [dateRangeFilter, setDateRangeFilter] = useState("All");

    // Extract unique subjects from sessions
    const subjectList = ["All", ...new Set(sessions.map((s) => s.subject).filter(Boolean))];

    // Filter sessions
    const filteredSessions = sessions.filter((s) => {
        if (selectedSubjectFilter !== "All" && s.subject !== selectedSubjectFilter) {
            return false;
        }

        if (dateRangeFilter === "Today") {
            const d = new Date(s.date);
            const today = new Date();
            const isToday =
                d.getDate() === today.getDate() &&
                d.getMonth() === today.getMonth() &&
                d.getFullYear() === today.getFullYear();
            if (!isToday) return false;
        } else if (dateRangeFilter === "This Week") {
            const d = new Date(s.date);
            const today = new Date();
            const day = today.getDay();
            const diffToMon = today.getDate() - day + (day === 0 ? -6 : 1);
            const startOfWeek = new Date(today.setDate(diffToMon));
            startOfWeek.setHours(0, 0, 0, 0);
            if (d < startOfWeek) return false;
        }

        return true;
    });

    return (
        <div className="history-panel card-panel">
            <div className="history-header">
                <h2>Session History Log</h2>
                <span className="history-count-badge">{filteredSessions.length} recorded</span>
            </div>

            {/* Filter Controls */}
            <div className="history-filter-bar">
                <div className="filter-group">
                    <label className="filter-label">Filter Subject:</label>
                    <select
                        value={selectedSubjectFilter}
                        onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                        className="filter-select"
                    >
                        {subjectList.map((sub) => (
                            <option key={sub} value={sub}>
                                {sub}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Date Range:</label>
                    <select
                        value={dateRangeFilter}
                        onChange={(e) => setDateRangeFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="All">All Time</option>
                        <option value="Today">Today</option>
                        <option value="This Week">This Week</option>
                    </select>
                </div>
            </div>

            {/* Scrollable Sessions List */}
            <div className="history-list-container">
                {filteredSessions.length === 0 ? (
                    <div className="history-empty-state">
                        <p>No study sessions match the selected filters.</p>
                    </div>
                ) : (
                    filteredSessions.map((session) => {
                        const isCompleted = session.completed !== false;
                        const id = session._id || session.id;

                        return (
                            <div key={id} className="history-item-row">
                                <div className="history-item-main">
                                    <div className="history-item-top">
                                        <span className="history-subject-tag">{session.subject}</span>
                                        <span className="history-mode-badge">
                                            {session.mode === "custom" ? "Custom" : "Stopwatch"}
                                        </span>
                                        <span className={`history-status-badge ${isCompleted ? "completed" : "stopped"}`}>
                                            {isCompleted ? "Completed" : "Stopped Early"}
                                        </span>
                                    </div>
                                    <div className="history-item-details">
                                        <span className="history-duration">{session.duration} min focus</span>
                                        <span className="history-bullet">•</span>
                                        <span className="history-date">{formatDate(session.date)}</span>
                                    </div>
                                </div>

                                {onDeleteSession && id && (
                                    <button
                                        type="button"
                                        className="history-delete-btn"
                                        onClick={() => onDeleteSession(id)}
                                        title="Delete session"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default StudyHistoryPanel;
