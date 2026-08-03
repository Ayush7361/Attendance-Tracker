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

    const [month, setMonth] = useState("January");
    const [year, setYear] = useState(new Date().getFullYear());
    const [schedule, setSchedule] = useState({ mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0 });
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
        }
    }, [user, month, year]);

    async function loadSchedule() {
        const res = await getSchedule();
        if (res.data) {
            setSchedule(res.data);
        }
    }

    async function loadMonthSummary() {
        const monthNumber = monthNameToNumber(month);
        const res = await getMonthSummary(year, monthNumber);
        setMonthSummary(res.data);
    }

    async function loadOverallSummary() {
        const res = await getOverallSummary();
        setOverallData(res.data);
        setShowOverall(true);
    }

    function handleScheduleChange(day, value) {
        setSchedule({ ...schedule, [day]: value });
    }

    async function handleSaveSchedule() {
        await saveSchedule(schedule);
        alert("Weekly schedule saved!");
    }

    async function handleResetMonth() {
        const confirmed = confirm("Clear all data for " + month + "?");
        if (!confirmed) return;

        const monthNumber = monthNameToNumber(month);
        const start = new Date(year, monthNumber - 1, 1);
        const end = new Date(year, monthNumber, 1);

        await deleteDayRange(start, end);
        loadMonthSummary();
    }

    async function handleResetAll() {
        const confirmed = confirm("Delete ALL data permanently?");
        if (!confirmed) return;
        await resetAll();
        loadMonthSummary();
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
        <div className="container">
            <button onClick={handleLogout}>Logout</button>
            <MonthSelector month={month} onChange={setMonth} />
            <SummaryCards total={monthSummary.total} attended={monthSummary.attended} percentage={percentage} />
            <ProgressBar percentage={percentage} />

            <hr />
            <ScheduleForm schedule={schedule} onChange={handleScheduleChange} onSave={handleSaveSchedule} />

            <hr />
            <AttendanceCalendar schedule={schedule} onDaySaved={loadMonthSummary} />

            <hr />
            <ResetSection onResetMonth={handleResetMonth} onResetAll={handleResetAll} />

            <div className="overall-box">
                <h2 className="overall-heading">Overall Attendance (All Months)</h2>
                <button className="overall-btn" onClick={loadOverallSummary}>
                    Calculate Overall
                </button>
                {showOverall && <OverallSummary total={overallData.total} attended={overallData.attended} />}
            </div>
        </div>
    );
}

export default App;