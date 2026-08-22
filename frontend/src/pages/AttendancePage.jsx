import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MonthSelector from "../components/MonthSelector";
import SummaryCards from "../components/SummaryCards";
import ProgressBar from "../components/ProgressBar";
import ScheduleForm from "../components/ScheduleForm";
import AttendanceCalendar from "../components/AttendanceCalendar";
import ResetSection from "../components/ResetSection";
import OverallSummary from "../components/OverallSummary";
import {
    getSchedule,
    saveSchedule,
    getMonthSummary,
    getOverallSummary,
    deleteDayRange,
    resetAll
} from "../api/attendanceApi";
import MobileNotificationDrawer from "../components/MobileNotificationDrawer";
import { useToast } from "../context/ToastContext";
import "../App.css";

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function monthNameToNumber(name) {
    return monthNames.indexOf(name) + 1;
}

function AttendancePage({ user, onLogout }) {
    const { showToast } = useToast();
    const currentMonthName = monthNames[new Date().getMonth()];
    const [month, setMonth] = useState(currentMonthName);
    const [year, setYear] = useState(new Date().getFullYear());
    const [schedule, setSchedule] = useState({ mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] });
    const [monthSummary, setMonthSummary] = useState({ total: 0, attended: 0 });
    const [overallData, setOverallData] = useState({ total: 0, attended: 0 });
    const [showOverall, setShowOverall] = useState(false);
    const [showTimetable, setShowTimetable] = useState(false);
    const [targetThreshold, setTargetThreshold] = useState(() => {
        const stored = localStorage.getItem("targetAttendanceThreshold");
        return stored ? Number(stored) : 75;
    });

    useEffect(() => {
        loadSchedule();
    }, []);

    useEffect(() => {
        loadMonthSummary();
        if (showOverall) {
            loadOverallSummary();
        }
    }, [month, year]);

    function handleTargetChange(e) {
        const val = Number(e.target.value);
        setTargetThreshold(val);
        localStorage.setItem("targetAttendanceThreshold", String(val));
        if (showToast) showToast(`Attendance target updated to ${val}%`, "success");
    }

    async function loadSchedule() {
        try {
            const res = await getSchedule();
            if (res.data) {
                setSchedule(res.data);
            }
        } catch (err) {
            console.error("Failed to load schedule", err);
        }
    }

    async function loadMonthSummary() {
        try {
            const monthNum = monthNameToNumber(month);
            const res = await getMonthSummary(year, monthNum);
            setMonthSummary(res.data);
        } catch (err) {
            console.error("Failed to load month summary", err);
        }
    }

    async function loadOverallSummary() {
        try {
            const res = await getOverallSummary();
            setOverallData(res.data);
            setShowOverall(true);
        } catch (err) {
            console.error("Failed to load overall summary", err);
        }
    }

    async function handleScheduleChange(newSchedule) {
        setSchedule(newSchedule);
    }

    async function handleSaveSchedule() {
        try {
            await saveSchedule(schedule);
            if (showToast) showToast("Schedule saved successfully!", "success");
        } catch (err) {
            console.error("Failed to save schedule", err);
            if (showToast) showToast("Failed to save schedule", "error");
        }
    }

    async function handleDaySaved() {
        loadMonthSummary();
        if (showOverall) {
            loadOverallSummary();
        }
    }

    async function handleResetMonth(start, end) {
        try {
            await deleteDayRange(start, end);
            loadMonthSummary();
            if (showOverall) loadOverallSummary();
            if (showToast) showToast("Month data reset", "info");
        } catch (err) {
            console.error("Failed to reset month", err);
        }
    }

    async function handleResetAll() {
        try {
            await resetAll();
            loadMonthSummary();
            if (showOverall) loadOverallSummary();
            if (showToast) showToast("All attendance data cleared", "info");
        } catch (err) {
            console.error("Failed to reset all", err);
        }
    }

    const percentage = monthSummary.total === 0
        ? 0
        : ((monthSummary.attended / monthSummary.total) * 100).toFixed(1);

    return (
        <div className="app-layout attendance-layout">
            <header className="app-header">
                <div className="header-brand">
                    <div className="brand-badge">AT</div>
                    <div>
                        <h1 className="app-title">Attendance</h1>
                        <p className="app-subtitle">Welcome back, {user.username}</p>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <MobileNotificationDrawer schedule={schedule} />
                    <button className="logout-btn" onClick={onLogout}>
                        Logout
                    </button>
                </div>
            </header>

            <main className="container">
                <Link to="/" className="back-link">← Back to Dashboard</Link>

                <div className="page-header-box">
                    <h2 className="page-title">Attendance Tracker</h2>
                    <p className="page-subtitle">Daily class logs, subject schedules, and safe bunk calculator.</p>
                </div>

                <div className="month-picker-bar card-panel" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                    <MonthSelector month={month} onChange={setMonth} />
                    <div className="target-goal-selector" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#94a3b8" }}>
                            Target Goal:
                        </label>
                        <select
                            value={targetThreshold}
                            onChange={handleTargetChange}
                            style={{
                                padding: "6px 12px",
                                borderRadius: "8px",
                                background: "rgba(15, 23, 42, 0.8)",
                                border: "1px solid rgba(255, 255, 255, 0.15)",
                                color: "#ffffff",
                                fontWeight: "700",
                                fontSize: "0.88rem",
                                cursor: "pointer"
                            }}
                        >
                            <option value={70}>70% Target</option>
                            <option value={75}>75% Target (Default)</option>
                            <option value={80}>80% Target</option>
                            <option value={85}>85% Target</option>
                            <option value={90}>90% Target</option>
                        </select>
                    </div>
                </div>

                <SummaryCards total={monthSummary.total} attended={monthSummary.attended} percentage={percentage} targetThreshold={targetThreshold} />
                <ProgressBar percentage={percentage} />

                <AttendanceCalendar schedule={schedule} onDaySaved={handleDaySaved} />

                <div className="timetable-collapsible card-panel">
                    <button
                        type="button"
                        className="timetable-toggle-btn"
                        onClick={() => setShowTimetable(!showTimetable)}
                    >
                        <span>Weekly Subject Timetable</span>
                        <span className={`toggle-arrow ${showTimetable ? "open" : ""}`}>▾</span>
                    </button>

                    {showTimetable && (
                        <ScheduleForm schedule={schedule} onChange={handleScheduleChange} onSave={handleSaveSchedule} />
                    )}
                </div>

                <ResetSection onResetMonth={handleResetMonth} onResetAll={handleResetAll} />

                <div className="overall-box card-panel">
                    <h2 className="overall-heading">Overall Attendance</h2>
                    <p className="overall-desc">Aggregated attendance percentage across all logged days.</p>
                    <button className="overall-btn" onClick={loadOverallSummary}>
                        Calculate Overall
                    </button>
                    {showOverall && <OverallSummary total={overallData.total} attended={overallData.attended} targetThreshold={targetThreshold} />}
                </div>
            </main>
        </div>
    );
}

export default AttendancePage;