import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MonthSelector from "./components/MonthSelector";
import SummaryCards from "./components/SummaryCards";
import ProgressBar from "./components/ProgressBar";
import ScheduleForm from "./components/ScheduleForm";
import AttendanceCalendar from "./components/AttendanceCalendar";
import ResetSection from "./components/ResetSection";
import OverallSummary from "./components/OverallSummary";
import {
    getSchedule,
    saveSchedule,
    getMonthSummary,
    getOverallSummary,
    deleteDayRange,
    resetAll
} from "./api/attendanceApi";
import { logoutUser } from "./api/authApi";
import "./App.css";

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function monthNameToNumber(name) {
    return monthNames.indexOf(name) + 1;
}

function App() {
    const { user, login, logout } = useAuth();
    const [showRegister, setShowRegister] = useState(false);

    const currentMonthName = monthNames[new Date().getMonth()];
    const [month, setMonth] = useState(currentMonthName);
    const [year, setYear] = useState(new Date().getFullYear());
    const [schedule, setSchedule] = useState({ mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] });
    const [monthSummary, setMonthSummary] = useState({ total: 0, attended: 0 });
    const [overallData, setOverallData] = useState({ total: 0, attended: 0 });
    const [showOverall, setShowOverall] = useState(false);

    useEffect(() => {
        if (user) {
            loadSchedule();
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            loadMonthSummary();
            if (showOverall) {
                loadOverallSummary();
            }
        }
    }, [user, month, year]);

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
            const monthNumber = monthNameToNumber(month);
            const res = await getMonthSummary(year, monthNumber);
            setMonthSummary(res.data || { total: 0, attended: 0 });
        } catch (err) {
            console.error("Failed to load month summary", err);
        }
    }

    async function loadOverallSummary() {
        try {
            const res = await getOverallSummary();
            setOverallData(res.data || { total: 0, attended: 0 });
            setShowOverall(true);
        } catch (err) {
            console.error("Failed to load overall summary", err);
        }
    }

    function handleScheduleChange(day, value) {
        setSchedule({ ...schedule, [day]: value });
    }

    async function handleSaveSchedule() {
        try {
            await saveSchedule(schedule);
            alert("Weekly schedule saved successfully!");
        } catch (err) {
            alert("Failed to save weekly schedule.");
        }
    }

    function handleDaySaved() {
        loadMonthSummary();
        if (showOverall) {
            loadOverallSummary();
        }
    }

    async function handleResetMonth() {
        const confirmed = confirm("Clear all attendance data for " + month + " " + year + "?");
        if (!confirmed) return;

        const monthNumber = monthNameToNumber(month);
        const start = new Date(year, monthNumber - 1, 1);
        const end = new Date(year, monthNumber, 1);

        await deleteDayRange(start, end);
        handleDaySaved();
    }

    async function handleResetAll() {
        const confirmed = confirm("Delete ALL attendance records permanently?");
        if (!confirmed) return;
        await resetAll();
        handleDaySaved();
        setOverallData({ total: 0, attended: 0 });
    }

    async function handleLogout() {
        await logoutUser();
        logout();
    }

    if (!user) {
        return showRegister ? (
            <Register onSwitchToLogin={() => setShowRegister(false)} />
        ) : (
            <Login onSwitchToRegister={() => setShowRegister(true)} />
        );
    }

    const percentage = monthSummary.total === 0
        ? 0
        : ((monthSummary.attended / monthSummary.total) * 100).toFixed(1);

    return (
        <div className="app-layout">
            <header className="app-header">
                <div className="header-brand">
                    <div className="brand-logo">📊</div>
                    <div>
                        <h1 className="app-title">Attendance Dashboard</h1>
                        <p className="app-subtitle">Welcome back, <strong>{user.username}</strong></p>
                    </div>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                    🚪 Logout
                </button>
            </header>

            <main className="container">
                <div className="month-picker-bar glass-panel">
                    <MonthSelector month={month} onChange={setMonth} />
                </div>

                <SummaryCards total={monthSummary.total} attended={monthSummary.attended} percentage={percentage} />
                <ProgressBar percentage={percentage} />

                <ScheduleForm schedule={schedule} onChange={handleScheduleChange} onSave={handleSaveSchedule} />

                <AttendanceCalendar schedule={schedule} onDaySaved={handleDaySaved} />

                <ResetSection onResetMonth={handleResetMonth} onResetAll={handleResetAll} />

                <div className="overall-box glass-panel">
                    <h2 className="overall-heading">Overall Attendance (All Months)</h2>
                    <p className="overall-desc">Calculate aggregated attendance percentage across all logged days.</p>
                    <button className="overall-btn" onClick={loadOverallSummary}>
                        ⚡ Calculate Overall
                    </button>
                    {showOverall && <OverallSummary total={overallData.total} attended={overallData.attended} />}
                </div>
            </main>
        </div>
    );
}

export default App;