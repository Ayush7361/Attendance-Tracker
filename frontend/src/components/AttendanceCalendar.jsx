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
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [subjectsList, setSubjectsList] = useState([]);
    const [customSubjectInput, setCustomSubjectInput] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadMonthRecords();
    }, [visibleMonth]);

    useEffect(() => {
        const dateToLoad = selectedDate || new Date();
        handleDayClick(dateToLoad);
    }, [schedule]);

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

    function buildLoggedDates() {
        const logged = [];
        for (let i = 0; i < records.length; i++) {
            logged.push(parseServerDate(records[i].date));
        }
        return logged;
    }

    async function handleDayClick(date) {
        if (!date) return;
        setSelectedDate(date);
        const dateKey = formatDateKey(date);

        try {
            const res = await getDay(dateKey);
            if (res.data && Array.isArray(res.data.subjects) && res.data.subjects.length > 0) {
                setSubjectsList(res.data.subjects.map(s => ({
                    name: s.name,
                    attended: s.status === "attended"
                })));
            } else if (res.data) {
                setSubjectsFromSchedule(date, res.data.totalClasses, res.data.attendedClasses);
            } else {
                setSubjectsFromSchedule(date);
            }
        } catch (err) {
            setSubjectsFromSchedule(date);
        }
    }

    function setSubjectsFromSchedule(date, fallbackTotal, fallbackAttended) {
        const dayKey = dayKeyByIndex[date.getDay()];
        const scheduledSubjects = schedule ? schedule[dayKey] : [];

        if (Array.isArray(scheduledSubjects) && scheduledSubjects.length > 0) {
            setSubjectsList(scheduledSubjects.map((subName) => ({
                name: subName,
                attended: false
            })));
        } else if (typeof scheduledSubjects === "number" && scheduledSubjects > 0) {
            const list = [];
            for (let i = 1; i <= scheduledSubjects; i++) {
                list.push({ name: `Class ${i}`, attended: false });
            }
            setSubjectsList(list);
        } else if (fallbackTotal && fallbackTotal > 0) {
            const list = [];
            for (let i = 1; i <= fallbackTotal; i++) {
                list.push({ name: `Class ${i}`, attended: i <= (fallbackAttended || 0) });
            }
            setSubjectsList(list);
        } else {
            setSubjectsList([]);
        }
    }

    function setSubjectAttended(index, isAttended) {
        const updated = [...subjectsList];
        updated[index] = { ...updated[index], attended: isAttended };
        setSubjectsList(updated);
    }

    function handleAddCustomSubject(e) {
        e.preventDefault();
        const trimmed = customSubjectInput.trim();
        if (!trimmed) return;
        setSubjectsList([...subjectsList, { name: trimmed, attended: true }]);
        setCustomSubjectInput("");
    }

    function handleRemoveSubjectRow(index) {
        setSubjectsList(subjectsList.filter((_, idx) => idx !== index));
    }

    const totalCount = subjectsList.length;
    const attendedCount = subjectsList.filter(s => s.attended).length;

    async function handleSave() {
        if (!selectedDate) return;

        setSaving(true);
        try {
            const dateKey = formatDateKey(selectedDate);
            const formattedSubjects = subjectsList.map(s => ({
                name: s.name,
                status: s.attended ? "attended" : "missed"
            }));

            await saveDay({
                date: dateKey,
                totalClasses: totalCount,
                attendedClasses: attendedCount,
                subjects: formattedSubjects
            });

            await loadMonthRecords();

            if (onDaySaved) {
                onDaySaved();
            }
        } catch (err) {
            alert("Failed to save day record.");
        } finally {
            setSaving(false);
        }
    }

    function handleLogToday() {
        const today = new Date();
        setVisibleMonth(today);
        handleDayClick(today);
    }

    const loggedDates = buildLoggedDates();
    const isTodaySelected = selectedDate && formatDateKey(selectedDate) === formatDateKey(new Date());

    return (
        <div className="attendance-calendar-card card-panel">
            <div className="calendar-header">
                <h2>Attendance Calendar</h2>
                <button className="log-today-btn" onClick={handleLogToday}>
                    Today
                </button>
            </div>

            <div className="calendar-body">
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
                    <div className="day-checklist-panel">
                        <div className="checklist-header">
                            <h3>
                                {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                                {isTodaySelected && <span className="today-badge">Today</span>}
                            </h3>
                        </div>

                        <div className="subjects-checklist">
                            {subjectsList.map((sub, idx) => (
                                <div key={idx} className="subject-row">
                                    <span className="subject-name">{sub.name}</span>
                                    <div className="row-controls">
                                        <button
                                            type="button"
                                            className={`status-badge ${sub.attended ? "attended" : "missed"}`}
                                            onClick={() => setSubjectAttended(idx, !sub.attended)}
                                        >
                                            {sub.attended ? "Attended" : "Missed"}
                                        </button>
                                        <button
                                            type="button"
                                            className="remove-row-btn"
                                            onClick={() => handleRemoveSubjectRow(idx)}
                                            title="Remove subject"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleAddCustomSubject} className="add-extra-subject-form">
                            <input
                                type="text"
                                placeholder="Add class..."
                                value={customSubjectInput}
                                onChange={(e) => setCustomSubjectInput(e.target.value)}
                            />
                            <button type="submit">+ Add</button>
                        </form>

                        <div className="checklist-stats">
                            <span>Total: <strong>{totalCount}</strong></span>
                            <span>Attended: <strong>{attendedCount}</strong></span>
                        </div>

                        <button className="save-day-record-btn" onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Record"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AttendanceCalendar;