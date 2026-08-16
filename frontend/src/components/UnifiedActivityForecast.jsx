import { useState, useMemo } from "react";
import "../styles/UnifiedActivityForecast.css";

function formatDateKey(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatMinsToHours(mins) {
    if (mins <= 0) return "0m";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

function UnifiedActivityForecast({ forecastData, sessions = [] }) {
    const [activeTab, setActiveTab] = useState("forecast"); // "forecast" | "focus"

    // 1. Calculate Streaks and Past 7 Days Focus
    const {
        currentStreak,
        longestStreak,
        totalMins,
        past7Days
    } = useMemo(() => {
        const map = new Map();
        let totalMinsSum = 0;

        sessions.forEach((s) => {
            if (!s.date) return;
            const d = new Date(s.date);
            const key = formatDateKey(d);
            const dur = Number(s.duration) || 0;
            if (dur <= 0) return;

            totalMinsSum += dur;
            map.set(key, (map.get(key) || 0) + dur);
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Streaks Calculation
        let currentS = 0;
        let checkDate = new Date(today);
        const todayKey = formatDateKey(today);
        const todayHasSession = (map.get(todayKey) || 0) > 0;

        if (!todayHasSession) {
            checkDate.setDate(checkDate.getDate() - 1);
        }

        while (true) {
            const k = formatDateKey(checkDate);
            if ((map.get(k) || 0) > 0) {
                currentS++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        // Longest Streak
        const allActiveDates = Array.from(map.keys())
            .filter((k) => (map.get(k) || 0) > 0)
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
                if (diffDays === 1) tempS++;
                else if (diffDays > 1) tempS = 1;
            }
            if (tempS > maxS) maxS = tempS;
            prevD = dObj;
        });

        // Past 7 Days Focus
        const past7 = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = formatDateKey(d);
            const mins = map.get(key) || 0;

            let level = 0;
            if (mins > 0 && mins < 30) level = 1;
            else if (mins >= 30 && mins < 60) level = 2;
            else if (mins >= 60 && mins < 120) level = 3;
            else if (mins >= 120) level = 4;

            const isToday = i === 0;
            const label = isToday
                ? "Today"
                : d.toLocaleDateString("en-US", { weekday: "short" });

            past7.push({
                date: d,
                dateKey: key,
                label,
                mins,
                level,
                isToday
            });
        }

        return {
            currentStreak: currentS,
            longestStreak: maxS,
            totalMins: totalMinsSum,
            past7Days: past7
        };
    }, [sessions]);

    // 2. Forecast Data
    const forecastList = forecastData?.forecast || [];
    const totalForecastHours = forecastData?.totalHours || 0;
    const maxForecastHours = Math.max(...forecastList.map((d) => d.hours), 1);

    return (
        <div className="unified-activity-card">
            {/* Top Streaks & Focus Header */}
            <div className="unified-card-header">
                <div>
                    <h3 className="unified-card-title">Activity & Workload Pace</h3>
                    <p className="unified-card-subtitle">Streaks, 7-day focus history & workload forecast</p>
                </div>

                {/* Compact Streak Pills */}
                <div className="unified-streak-pills">
                    <div className="streak-pill pill-flame">
                        <span className="streak-pill-icon">🔥</span>
                        <span className="streak-pill-val">{currentStreak}d Streak</span>
                    </div>

                    <div className="streak-pill pill-trophy">
                        <span className="streak-pill-icon">🏆</span>
                        <span className="streak-pill-val">{longestStreak}d Best</span>
                    </div>

                    <div className="streak-pill pill-timer">
                        <span className="streak-pill-icon">⏱️</span>
                        <span className="streak-pill-val">{formatMinsToHours(totalMins)} Total</span>
                    </div>
                </div>
            </div>

            {/* Mobile-Friendly View Switcher Tabs */}
            <div className="unified-tab-bar">
                <button
                    type="button"
                    className={`unified-tab-btn ${activeTab === "forecast" ? "active" : ""}`}
                    onClick={() => setActiveTab("forecast")}
                >
                    📅 Workload Forecast ({totalForecastHours}h)
                </button>
                <button
                    type="button"
                    className={`unified-tab-btn ${activeTab === "focus" ? "active" : ""}`}
                    onClick={() => setActiveTab("focus")}
                >
                    🔥 Past 7 Days Focus
                </button>
            </div>

            {/* Main Content View */}
            <div className="unified-card-body">
                {/* View 1: Workload Forecast (Next 7 Days) */}
                {activeTab === "forecast" && (
                    <div className="forecast-view-box">
                        <div className="view-summary-line">
                            <span>Estimated task hours due over the next 7 days</span>
                            <strong className="summary-highlight">{totalForecastHours}h total</strong>
                        </div>

                        <div className="unified-forecast-chart">
                            {forecastList.map((day) => {
                                const heightPercent = (day.hours / maxForecastHours) * 100;
                                return (
                                    <div key={day.date} className="forecast-col">
                                        <div className="forecast-bar-track">
                                            <div
                                                className={`forecast-bar-fill ${day.hours > 0 ? "has-hours" : ""}`}
                                                style={{ height: `${heightPercent}%` }}
                                            />
                                        </div>
                                        <span className="forecast-val">{day.hours}h</span>
                                        <span className="forecast-day-lbl">{day.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* View 2: Past 7 Days Focus Activity */}
                {activeTab === "focus" && (
                    <div className="focus-view-box">
                        <div className="view-summary-line">
                            <span>Focus time logged in the last 7 days</span>
                            <strong className="summary-highlight">
                                {formatMinsToHours(past7Days.reduce((acc, d) => acc + d.mins, 0))} logged
                            </strong>
                        </div>

                        <div className="past-7days-grid">
                            {past7Days.map((day) => (
                                <div key={day.dateKey} className="past-day-card">
                                    <span className="past-day-lbl">{day.label}</span>
                                    <div className={`past-day-tile level-${day.level} ${day.isToday ? "today-tile" : ""}`}>
                                        <span className="past-day-mins">
                                            {day.mins > 0 ? formatMinsToHours(day.mins) : "0m"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UnifiedActivityForecast;
