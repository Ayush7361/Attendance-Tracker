import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { getMonthRecords, getDay, saveDay } from "../api/attendanceApi";

const dayKeyByIndex = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function formatDateKey(date) {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseServerDate(dateStr) {
    const d = new Date(dateStr);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function AttendanceCalendar({ schedule, onDaySaved }) {
    const [visibleMonth, setVisibleMonth] = useState(new Date());
    const [records, setRecords] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [formTotal, setFormTotal] = useState(0);
    const [formAttended, setFormAttended] = useState(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadMonthRecords();
    }, [visibleMonth]);

    async function loadMonthRecords() {
        try {
            const year = visibleMonth.getFullYear();
            const month = visibleMonth.getMonth() + 1;
            const res = await getMonthRecords(year, month);
            setRecords(res.data || []);
        } catch (err) {
            console.error("Failed to load month records", err);
        }
    }

    function buildModifiers() {
        const loggedGood = [];
        const loggedLow = [];

        for (let i = 0; i < records.length; i++) {
            const rec = records[i];
            const dateObj = parseServerDate(rec.date);
            const ratio = rec.totalClasses > 0 ? (rec.attendedClasses / rec.totalClasses) : 1;
            if (ratio >= 0.75) {
                loggedGood.push(dateObj);
            } else {
                loggedLow.push(dateObj);
            }
        }

        return { loggedGood, loggedLow };
    }

    async function handleDayClick(date) {
        if (!date) return;
        setSelectedDate(date);
        const dateKey = formatDateKey(date);

        try {
            const res = await getDay(dateKey);
            if (res.data) {
                setFormTotal(res.data.totalClasses);
                setFormAttended(res.data.attendedClasses);
            } else {
                const dayKey = dayKeyByIndex[date.getDay()];
                const scheduledCount = schedule ? (schedule[dayKey] || 0) : 0;
                setFormTotal(scheduledCount);
                setFormAttended(0);
            }
        } catch (err) {
            const dayKey = dayKeyByIndex[date.getDay()];
            const scheduledCount = schedule ? (schedule[dayKey] || 0) : 0;
            setFormTotal(scheduledCount);
            setFormAttended(0);
        }
    }

    async function handleSave() {
        if (!selectedDate) return;

        if (formAttended > formTotal) {
            alert("Attended classes cannot exceed total classes");
            return;
        }

        setSaving(true);
        try {
            const dateKey = formatDateKey(selectedDate);
            await saveDay(dateKey, formTotal, formAttended);
            await loadMonthRecords();

            if (onDaySaved) {
                onDaySaved();
            }
        } catch (err) {
            alert("Failed to save attendance record");
        } finally {
            setSaving(false);
        }
    }

    function handleLogToday() {
        const today = new Date();
        setVisibleMonth(today);
        handleDayClick(today);
    }

    const { loggedGood, loggedLow } = buildModifiers();

    return (
        <div className="attendance-calendar-container">
            <div className="calendar-header">
                <h2>Attendance Calendar</h2>
                <button className="log-today-btn" onClick={handleLogToday}>
                    Log today
                </button>
            </div>

            <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleDayClick}
                month={visibleMonth}
                onMonthChange={setVisibleMonth}
                modifiers={{ loggedGood, loggedLow }}
                modifiersClassNames={{ loggedGood: "day-logged-good", loggedLow: "day-logged-low" }}
            />

            {selectedDate && (
                <div className="day-edit-panel">
                    <h3>Log Attendance for {formatDateKey(selectedDate)}</h3>
                    <div className="edit-field">
                        <label>Total Classes</label>
                        <input
                            type="number"
                            min="0"
                            value={formTotal}
                            onChange={(e) => setFormTotal(Number(e.target.value))}
                        />
                    </div>
                    <div className="edit-field">
                        <label>Attended</label>
                        <input
                            type="number"
                            min="0"
                            value={formAttended}
                            onChange={(e) => setFormAttended(Number(e.target.value))}
                        />
                    </div>
                    <button className="save-day-btn" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save Record"}
                    </button>
                </div>
            )}
        </div>
    );
}

export default AttendanceCalendar;