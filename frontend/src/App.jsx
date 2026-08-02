import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MonthSelector from "./components/MonthSelector";
import SummaryCards from "./components/SummaryCards";
import ProgressBar from "./components/ProgressBar";
import ScheduleForm from "./components/ScheduleForm";
import WeeklyAttendanceForm from "./components/WeeklyAttendanceForm";
import ResetSection from "./components/ResetSection";
import OverallSummary from "./components/OverallSummary";
import { getSchedule, saveSchedule, getMonths, addWeek, resetMonth, resetAll } from "./api/attendanceApi";
import { logoutUser } from "./api/authApi";
import "./App.css";

const days = ["mon", "tue", "wed", "thu", "fri", "sat"];

function App() {
    const { user, login, logout } = useAuth();
    const [showRegister, setShowRegister] = useState(false);

    const [month, setMonth] = useState("January");
    const [schedule, setSchedule] = useState({ mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0 });
    const [weekAttendance, setWeekAttendance] = useState({ mon: "", tue: "", wed: "", thu: "", fri: "", sat: "" });
    const [monthData, setMonthData] = useState({});
    const [showOverall, setShowOverall] = useState(false);

    useEffect(() => {
        if (user) {
            loadSchedule();
            loadMonths();
        }
    }, [user]);

    async function loadSchedule() {
        const res = await getSchedule();
        if (res.data) {
            setSchedule(res.data);
        }
    }

    async function loadMonths() {
        const res = await getMonths();
        const data = {};
        for (let i = 0; i < res.data.length; i++) {
            const m = res.data[i];
            data[m.month] = { total: m.total, attended: m.attended };
        }
        setMonthData(data);
    }

    function handleScheduleChange(day, value) {
        setSchedule({ ...schedule, [day]: value });
    }

    async function handleSaveSchedule() {
        await saveSchedule(schedule);
        alert("Weekly schedule saved!");
    }

    function handleWeekChange(day, value) {
        setWeekAttendance({ ...weekAttendance, [day]: value });
    }

    async function handleAddWeek() {
        let scheduledTotal = 0;
        let attendedTotal = 0;

        for (let i = 0; i < days.length; i++) {
            const day = days[i];
            const scheduled = Number(schedule[day]) || 0;
            const attended = Number(weekAttendance[day]) || 0;

            if (attended > scheduled) {
                alert("Cannot attend more (" + attended + ") than scheduled (" + scheduled + ") on " + day.toUpperCase() + "!");
                return;
            }

            scheduledTotal += scheduled;
            attendedTotal += attended;
        }

        if (scheduledTotal === 0) {
            alert("Enter at least one scheduled class this week.");
            return;
        }

        await addWeek(month, scheduledTotal, attendedTotal);
        setWeekAttendance({ mon: "", tue: "", wed: "", thu: "", fri: "", sat: "" });
        loadMonths();
        alert("Week added for " + month + "!");
    }

    async function handleResetMonth() {
        const confirmed = confirm("Clear all data for " + month + "?");
        if (!confirmed) return;
        await resetMonth(month);
        loadMonths();
    }

    async function handleResetAll() {
        const confirmed = confirm("Delete ALL data permanently?");
        if (!confirmed) return;
        await resetAll();
        loadMonths();
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

    const current = monthData[month] || { total: 0, attended: 0 };
    const percentage = current.total === 0 ? 0 : ((current.attended / current.total) * 100).toFixed(1);

    return (
        <div className="container">
            <button onClick={handleLogout}>Logout</button>
            <MonthSelector month={month} onChange={setMonth} />
            <SummaryCards total={current.total} attended={current.attended} percentage={percentage} />
            <ProgressBar percentage={percentage} />

            <hr />
            <ScheduleForm schedule={schedule} onChange={handleScheduleChange} onSave={handleSaveSchedule} />

            <hr />
            <WeeklyAttendanceForm weekAttendance={weekAttendance} onChange={handleWeekChange} onSubmit={handleAddWeek} />

            <hr />
            <ResetSection onResetMonth={handleResetMonth} onResetAll={handleResetAll} />

            <div className="overall-box">
                <h2 className="overall-heading">Overall Attendance (All Months)</h2>
                <button className="overall-btn" onClick={() => setShowOverall(true)}>
                    Calculate Overall
                </button>
                {showOverall && <OverallSummary monthData={monthData} />}
            </div>
        </div>
    );
}

export default App;