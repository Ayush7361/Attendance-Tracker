import { useMemo, useState } from "react";
import "../styles/StudyHeatmap.css";

function formatDateKey(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatNiceDate(d) {
    return d.toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function formatMinsToHours(mins) {
    if (mins <= 0) return "0m";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

function StudyHeatmap({ sessions = [] }) {
    const [hoveredDay, setHoveredDay] = useState(null);

    // Compute heatmap data and streak stats
    const {
        weeks,
        monthLabels,
        currentStreak,
        longestStreak,
        totalActiveDays,
        totalMins
    } = useMemo(() => {
        // 1. Build map of date -> { totalMins, subjects: { [sub]: mins } }
        const map = new Map();
        let totalMinsSum = 0;

        sessions.forEach((s) => {
            if (!s.date) return;
            const d = new Date(s.date);
            const key = formatDateKey(d);
            const dur = Number(s.duration) || 0;
            if (dur <= 0) return;

            totalMinsSum += dur;

            if (!map.has(key)) {
                map.set(key, { totalMins: 0, subjects: {} });
            }
            const entry = map.get(key);
            entry.totalMins += dur;
            const sub = s.subject || "General Study";
            entry.subjects[sub] = (entry.subjects[sub] || 0) + dur;
        });

        // 2. Determine 24-week grid range ending on upcoming Saturday
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(today);
        const dayOfWeek = endOfWeek.getDay(); // 0 is Sun, 6 is Sat
        endOfWeek.setDate(endOfWeek.getDate() + (6 - dayOfWeek));

        const NUM_WEEKS = 24;
        const startDate = new Date(endOfWeek);
        startDate.setDate(startDate.getDate() - (NUM_WEEKS * 7 - 1));

        const weeksArr = [];
        const monthLabelArr = [];

        let currentPointer = new Date(startDate);
        let lastMonth = -1;

        for (let w = 0; w < NUM_WEEKS; w++) {
            const daysInWeek = [];
            for (let d = 0; d < 7; d++) {
                const dateCopy = new Date(currentPointer);
                const dateKey = formatDateKey(dateCopy);
                const data = map.get(dateKey) || { totalMins: 0, subjects: {} };

                const m = dateCopy.getMonth();
                if (d === 0 && m !== lastMonth) {
                    monthLabelArr.push({
                        weekIndex: w,
                        label: dateCopy.toLocaleString("default", { month: "short" })
                    });
                    lastMonth = m;
                }

                daysInWeek.push({
                    date: dateCopy,
                    dateKey,
                    totalMins: data.totalMins,
                    subjects: data.subjects,
                    isFuture: dateCopy > today,
                    isToday: formatDateKey(dateCopy) === formatDateKey(today)
                });

                currentPointer.setDate(currentPointer.getDate() + 1);
            }
            weeksArr.push(daysInWeek);
        }

        // 3. Compute Streaks
        // Generate daily keys backwards from today
        let currentS = 0;
        let checkDate = new Date(today);
        const todayKey = formatDateKey(today);
        const todayHasSession = (map.get(todayKey)?.totalMins || 0) > 0;

        if (!todayHasSession) {
            // Check yesterday
            checkDate.setDate(checkDate.getDate() - 1);
        }

        while (true) {
            const k = formatDateKey(checkDate);
            const mData = map.get(k);
            if (mData && mData.totalMins > 0) {
                currentS++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        // Longest Streak calculation
        const allActiveDates = Array.from(map.keys())
            .filter((k) => map.get(k).totalMins > 0)
            .sort();

        let maxS = 0;
        let tempS = 0;
        let prevD = null;

        allActiveDates.forEach((k) => {
            const dObj = new Date(k);
            if (!prevD) {
                tempS = 1;
            } else {
                const diffDays = Math.round((dObj - prevD) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    tempS++;
                } else if (diffDays > 1) {
                    tempS = 1;
                }
            }
            if (tempS > maxS) maxS = tempS;
            prevD = dObj;
        });

        const activeDaysCount = allActiveDates.length;

        return {
            weeks: weeksArr,
            monthLabels: monthLabelArr,
            currentStreak: currentS,
            longestStreak: maxS,
            totalActiveDays: activeDaysCount,
            totalMins: totalMinsSum
        };
    }, [sessions]);

    // Helper for tile color intensity level (0 to 4)
    function getLevelClass(mins, isFuture) {
        if (isFuture) return "tile-future";
        if (mins <= 0) return "tile-level-0";
        if (mins < 30) return "tile-level-1";
        if (mins < 60) return "tile-level-2";
        if (mins < 120) return "tile-level-3";
        return "tile-level-4";
    }

    return (
        <div className="study-heatmap-container">
            {/* Header & Streak Counters */}
            <div className="heatmap-header">
                <div className="heatmap-title-box">
                    <h3 className="heatmap-title">Study Activity & Streaks</h3>
                    <p className="heatmap-subtitle">Visual focus tracking & streak performance over the past 6 months</p>
                </div>

                <div className="heatmap-stat-pills">
                    <div className="heatmap-pill pill-streak">
                        <span className="pill-icon">🔥</span>
                        <div>
                            <span className="pill-val">{currentStreak} {currentStreak === 1 ? "Day" : "Days"}</span>
                            <span className="pill-lbl">Current Streak</span>
                        </div>
                    </div>

                    <div className="heatmap-pill pill-best">
                        <span className="pill-icon">🏆</span>
                        <div>
                            <span className="pill-val">{longestStreak} {longestStreak === 1 ? "Day" : "Days"}</span>
                            <span className="pill-lbl">Best Streak</span>
                        </div>
                    </div>

                    <div className="heatmap-pill pill-active">
                        <span className="pill-icon">⚡</span>
                        <div>
                            <span className="pill-val">{totalActiveDays} Days</span>
                            <span className="pill-lbl">Active Days</span>
                        </div>
                    </div>

                    <div className="heatmap-pill pill-total">
                        <span className="pill-icon">⏱️</span>
                        <div>
                            <span className="pill-val">{formatMinsToHours(totalMins)}</span>
                            <span className="pill-lbl">Total Focused</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Heatmap Grid Section */}
            <div className="heatmap-grid-wrapper">
                <div className="heatmap-grid-scroll">
                    {/* Month Header Row */}
                    <div className="heatmap-months-row">
                        <div className="day-label-spacer" />
                        {weeks.map((_, wIdx) => {
                            const mLabel = monthLabels.find((m) => m.weekIndex === wIdx);
                            return (
                                <div key={wIdx} className="month-label-col">
                                    {mLabel ? mLabel.label : ""}
                                </div>
                            );
                        })}
                    </div>

                    {/* Matrix Grid (7 rows for Sun-Sat) */}
                    <div className="heatmap-matrix">
                        <div className="day-labels-col">
                            <span>Mon</span>
                            <span />
                            <span>Wed</span>
                            <span />
                            <span>Fri</span>
                            <span />
                            <span />
                        </div>

                        <div className="weeks-container">
                            {weeks.map((week, wIdx) => (
                                <div key={wIdx} className="heatmap-week-col">
                                    {week.map((day) => {
                                        const lvlClass = getLevelClass(day.totalMins, day.isFuture);
                                        return (
                                            <div
                                                key={day.dateKey}
                                                className={`heatmap-tile ${lvlClass} ${day.isToday ? "tile-today" : ""}`}
                                                onMouseEnter={() => setHoveredDay(day)}
                                                onMouseLeave={() => setHoveredDay(null)}
                                            >
                                                {/* Built-in Tooltip */}
                                                <div className="tile-tooltip">
                                                    <div className="tooltip-date">{formatNiceDate(day.date)}</div>
                                                    <div className="tooltip-mins">
                                                        {day.totalMins > 0
                                                            ? `${formatMinsToHours(day.totalMins)} focused`
                                                            : "No study logged"}
                                                    </div>
                                                    {Object.keys(day.subjects).length > 0 && (
                                                        <ul className="tooltip-sub-list">
                                                            {Object.entries(day.subjects).map(([sub, mins]) => (
                                                                <li key={sub}>
                                                                    <span>{sub}:</span> <strong>{formatMinsToHours(mins)}</strong>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Legend */}
                <div className="heatmap-footer">
                    <span className="heatmap-footer-note">
                        {hoveredDay ? (
                            <>
                                <strong>{formatNiceDate(hoveredDay.date)}</strong>:{" "}
                                {hoveredDay.totalMins > 0 ? formatMinsToHours(hoveredDay.totalMins) : "No activity"}
                            </>
                        ) : (
                            "Hover over any day tile for detailed subject study logs"
                        )}
                    </span>

                    <div className="heatmap-legend">
                        <span className="legend-lbl">Less</span>
                        <div className="heatmap-tile tile-level-0 legend-sample" />
                        <div className="heatmap-tile tile-level-1 legend-sample" />
                        <div className="heatmap-tile tile-level-2 legend-sample" />
                        <div className="heatmap-tile tile-level-3 legend-sample" />
                        <div className="heatmap-tile tile-level-4 legend-sample" />
                        <span className="legend-lbl">More</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudyHeatmap;
