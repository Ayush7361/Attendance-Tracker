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
import "../App.css";

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function monthNameToNumber(name) {
    return monthNames.indexOf(name) + 1;
}

function AttendancePage({ user, onLogout }) {
    const currentMonthName = monthNames[new Date().getMonth()];
    const [month, setMonth] = useState(currentMonthName);
    const [year, setYear] = useState(new Date().getFullYear());
    const [schedule, setSchedule] = useState({ mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] });
    const [monthSummary, setMonthSummary] = useState({ total: 0, attended: 0 });
    const [overallData, setOverallData] = useState({ total: 0, attended: 0 });
    const [showOverall, setShowOverall] = useState(false);
    const [showTimetable, setShowTimetable] = useState(false);

    useEffect(() => {
        loadSchedule();
    }, []);

    useEffect(() => {
        loadMonthSummary();
        if (showOverall) {
            loadOverallSummary();
        }
    }, [month, year]);

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
            alert("Schedule saved successfully!");
        } catch (err) {
            console.error("Failed to save schedule", err);
        }
    }

    async function handleDaySaved() {
        loadMonthSummary();
        if (showOverall) {
            loadOverallSummary();
        }
    }

    async function handleResetMonth() {
        if (!window.confirm(`Are you sure you want to clear all logged days in ${month}?`)) return;
        try {
            const m = monthNameToNumber(month);
            const start = `${year}-${String(m).padStart(2, "0")}-01`;
            const lastDay = new Date(year, m, 0).getDate();
            const end = `${year}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
            await deleteDayRange(start, end);
            loadMonthSummary();
            if (showOverall) loadOverallSummary();
        } catch (err) {
            console.error("Failed to reset month", err);
        }
    }

    async function handleResetAll() {
        if (!window.confirm("WARNING: This will permanently delete ALL logged attendance history! Continue?")) return;
        try {
            await resetAll();
            loadMonthSummary();
            if (showOverall) loadOverallSummary();
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
                <button className="logout-btn" onClick={onLogout}>
                    Logout
                </button>
            </header>

            <main className="container">
                <Link to="/" className="back-link">← Back to Dashboard</Link>

                <div className="page-header-box">
                    <h2 className="page-title">Attendance Tracker</h2>
                    <p className="page-subtitle">Daily class logs, subject schedules, and percentage targets.</p>
                </div>

                <div className="month-picker-bar card-panel">
                    <MonthSelector month={month} onChange={setMonth} />
                </div>

                <SummaryCards total={monthSummary.total} attended={monthSummary.attended} percentage={percentage} />
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
                    {showOverall && <OverallSummary total={overallData.total} attended={overallData.attended} />}
                </div>
            </main>
        </div>
    );
}

export default AttendancePage;