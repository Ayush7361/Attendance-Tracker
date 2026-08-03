import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { getMonthRecords, saveDay } from "../api/attendanceApi";

const dayKeyByIndex = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function formatDateKey(date) {
    const year = date.getFullYear();
    let month = String(date.getMonth() + 1);
    let day = String(date.getDate());

    if (month.length < 2) {
        month = "0" + month;
    }
    if (day.length < 2) {
        day = "0" + day;
    }

    return year + "-" + month + "-" + day;
}

function AttendanceCalendar({ schedule }) {
    const [visibleMonth, setVisibleMonth] = useState(new Date());
    const [records, setRecords] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [formTotal, setFormTotal] = useState(0);
    const [formAttended, setFormAttended] = useState(0);

    useEffect(() => {
        loadMonthRecords();
    }, [visibleMonth]);

    async function loadMonthRecords() {
        const year = visibleMonth.getFullYear();
        const month = visibleMonth.getMonth() + 1;
        const res = await getMonthRecords(year, month);
        setRecords(res.data);
    }

    function buildLoggedDates() {
        const logged = [];

        for (let i = 0; i < records.length; i++) {
            logged.push(new Date(records[i].date));
        }

        return logged;
    }

    async function handleDayClick(date) {
        setSelectedDate(date);

        const dateKey = formatDateKey(date);
        let existing = null;

        for (let i = 0; i < records.length; i++) {
            if (formatDateKey(new Date(records[i].date)) === dateKey) {
                existing = records[i];
            }
        }

        if (existing) {
            setFormTotal(existing.totalClasses);
            setFormAttended(existing.attendedClasses);
            return;
        }

        const dayKey = dayKeyByIndex[date.getDay()];
        const scheduledCount = schedule[dayKey] || 0;
        setFormTotal(scheduledCount);
        setFormAttended(0);
    }

    async function handleSave() {
        if (!selectedDate) {
            return;
        }

        if (formAttended > formTotal) {
            alert("Attended cannot be more than total classes");
            return;
        }

        const dateKey = formatDateKey(selectedDate);
        await saveDay(dateKey, formTotal, formAttended);
        await loadMonthRecords();
    }

    const loggedDates = buildLoggedDates();

    return (
        <div>
            <h2>Attendance Calendar</h2>
            <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleDayClick}
                month={visibleMonth}
                onMonthChange={setVisibleMonth}
                modifiers={{ logged: loggedDates }}
                modifiersClassNames={{ logged: "day-logged" }}
            />

            {selectedDate && (
                <div className="day-edit-panel">
                    <h3>{formatDateKey(selectedDate)}</h3>
                    <label>
                        Total Classes
                        <input
                            type="number"
                            min="0"
                            value={formTotal}
                            onChange={(e) => setFormTotal(Number(e.target.value))}
                        />
                    </label>
                    <label>
                        Attended
                        <input
                            type="number"
                            min="0"
                            value={formAttended}
                            onChange={(e) => setFormAttended(Number(e.target.value))}
                        />
                    </label>
                    <button onClick={handleSave}>Save</button>
                </div>
            )}
        </div>
    );
}

export default AttendanceCalendar;