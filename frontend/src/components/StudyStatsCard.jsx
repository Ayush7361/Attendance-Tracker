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
    
    // Get start of current week (Monday)
    const day = today.getDay();
    const diffToMon = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(today.setDate(diffToMon));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    return d >= startOfWeek && d < endOfWeek;
}

function computeSubjectBreakdown(sessions) {
    const map = {};
    sessions.forEach((s) => {
        const sub = s.subject || "General Study";
        const mins = Number(s.duration) || 0;
        map[sub] = (map[sub] || 0) + mins;
    });
    return map;
}

function formatMinutes(totalMins) {
    if (totalMins < 60) return `${totalMins}m`;
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function StudyStatsCard({ sessions = [] }) {
    const todaySessions = sessions.filter((s) => isToday(s.date));
    const weekSessions = sessions.filter((s) => isThisWeek(s.date));

    const todayTotalMins = todaySessions.reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
    const weekTotalMins = weekSessions.reduce((acc, s) => acc + (Number(s.duration) || 0), 0);

    const todayBreakdown = computeSubjectBreakdown(todaySessions);
    const weekBreakdown = computeSubjectBreakdown(weekSessions);

    return (
        <div className="study-stats-wrapper">
            <h3 className="section-subtitle">Study Summaries</h3>
            <div className="cards study-cards-grid">
                {/* Today's Summary */}
                <div className="card study-summary-card">
                    <span className="card-period-label">TODAY</span>
                    <h3>Total Time Studied</h3>
                    <p className="card-total-time">{formatMinutes(todayTotalMins)}</p>
                    
                    <div className="subject-breakdown-list">
                        {Object.keys(todayBreakdown).length === 0 ? (
                            <span className="no-breakdown-hint">No sessions logged today</span>
                        ) : (
                            Object.entries(todayBreakdown).map(([sub, mins]) => (
                                <div key={sub} className="breakdown-item">
                                    <span className="breakdown-sub-name">{sub}</span>
                                    <span className="breakdown-sub-time">{formatMinutes(mins)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* This Week's Summary */}
                <div className="card study-summary-card">
                    <span className="card-period-label">THIS WEEK</span>
                    <h3>Total Time Studied</h3>
                    <p className="card-total-time">{formatMinutes(weekTotalMins)}</p>

                    <div className="subject-breakdown-list">
                        {Object.keys(weekBreakdown).length === 0 ? (
                            <span className="no-breakdown-hint">No sessions logged this week</span>
                        ) : (
                            Object.entries(weekBreakdown).map(([sub, mins]) => (
                                <div key={sub} className="breakdown-item">
                                    <span className="breakdown-sub-name">{sub}</span>
                                    <span className="breakdown-sub-time">{formatMinutes(mins)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudyStatsCard;
