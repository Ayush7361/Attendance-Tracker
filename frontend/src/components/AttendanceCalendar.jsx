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

    // Interactive Checklist state
    const [isHoliday, setIsHoliday] = useState(false);
    const [subjectsList, setSubjectsList] = useState([]);
    const [customSubjectInput, setCustomSubjectInput] = useState("");
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
        const holidayDates = [];

        for (let i = 0; i < records.length; i++) {
            const rec = records[i];
            const dateObj = parseServerDate(rec.date);

            if (rec.isHoliday) {
                holidayDates.push(dateObj);
            } else {
                const ratio = rec.totalClasses > 0 ? (rec.attendedClasses / rec.totalClasses) : 1;
                if (ratio >= 0.75) {
                    loggedGood.push(dateObj);
                } else {
                    loggedLow.push(dateObj);
                }
            }
        }

        return { loggedGood, loggedLow, holidayDates };
    }

    async function handleDayClick(date) {
        if (!date) return;
        setSelectedDate(date);
        const dateKey = formatDateKey(date);

        try {
            const res = await getDay(dateKey);
            if (res.data) {
                setIsHoliday(Boolean(res.data.isHoliday));
                if (Array.isArray(res.data.subjects) && res.data.subjects.length > 0) {
                    setSubjectsList(res.data.subjects);
                } else {
                    setSubjectsFromSchedule(date, res.data.totalClasses, res.data.attendedClasses);
                }
            } else {
                setIsHoliday(false);
                setSubjectsFromSchedule(date);
            }
        } catch (err) {
            setIsHoliday(false);
            setSubjectsFromSchedule(date);
        }
    }

    function setSubjectsFromSchedule(date, fallbackTotal, fallbackAttended) {
        const dayKey = dayKeyByIndex[date.getDay()];
        const scheduledSubjects = schedule ? schedule[dayKey] : [];

        if (Array.isArray(scheduledSubjects) && scheduledSubjects.length > 0) {
            setSubjectsList(scheduledSubjects.map((subName) => ({
                name: subName,
                status: "attended"
            })));
        } else if (typeof scheduledSubjects === "number" && scheduledSubjects > 0) {
            const list = [];
            for (let i = 1; i <= scheduledSubjects; i++) {
                list.push({ name: `Class ${i}`, status: i <= (fallbackAttended || scheduledSubjects) ? "attended" : "missed" });
            }
            setSubjectsList(list);
        } else if (fallbackTotal && fallbackTotal > 0) {
            const list = [];
            for (let i = 1; i <= fallbackTotal; i++) {
                list.push({ name: `Class ${i}`, status: i <= (fallbackAttended || 0) ? "attended" : "missed" });
            }
            setSubjectsList(list);
        } else {
            setSubjectsList([]);
        }
    }

    function handleSubjectStatusChange(index, status) {
        const updated = [...subjectsList];
        updated[index] = { ...updated[index], status };
        setSubjectsList(updated);
    }

    function handleAddCustomSubject(e) {
        e.preventDefault();
        const trimmed = customSubjectInput.trim();
        if (!trimmed) return;
        setSubjectsList([...subjectsList, { name: trimmed, status: "attended" }]);
        setCustomSubjectInput("");
    }

    function handleRemoveSubjectRow(index) {
        setSubjectsList(subjectsList.filter((_, idx) => idx !== index));
    }

    // Dynamic counts
    let totalCount = 0;
    let attendedCount = 0;
    if (!isHoliday) {
        for (let s of subjectsList) {
            if (s.status !== "cancelled") {
                totalCount++;
                if (s.status === "attended") {
                    attendedCount++;
                }
            }
        }
    }

    async function handleSave() {
        if (!selectedDate) return;

        setSaving(true);
        try {
            const dateKey = formatDateKey(selectedDate);
            await saveDay({
                date: dateKey,
                totalClasses: totalCount,
                attendedClasses: attendedCount,
                isHoliday: isHoliday,
                subjects: subjectsList
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

    const { loggedGood, loggedLow, holidayDates } = buildModifiers();

    return (
        <div className="attendance-calendar-card glass-panel">
            <div className="calendar-header">
                <div>
                    <h2>📅 Attendance Calendar</h2>
                    <p className="subtitle">Click any date to inspect, log, or mark holidays.</p>
                </div>
                <button className="log-today-btn" onClick={handleLogToday}>
                    ⚡ Log Today
                </button>
            </div>

            <div className="calendar-body">
                <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDayClick}
                    month={visibleMonth}
                    onMonthChange={setVisibleMonth}
                    modifiers={{ loggedGood, loggedLow, holiday: holidayDates }}
                    modifiersClassNames={{
                        loggedGood: "day-logged-good",
                        loggedLow: "day-logged-low",
                        holiday: "day-holiday"
                    }}
                />

                {/* Interactive Day Checklist Panel */}
                {selectedDate && (
                    <div className="day-checklist-panel glass-panel-inner">
                        <div className="checklist-header">
                            <div>
                                <h3>Log for {selectedDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}</h3>
                                <p className="date-key">{formatDateKey(selectedDate)}</p>
                            </div>
                            {/* Holiday Toggle Switch */}
                            <label className="holiday-toggle-label">
                                <input
                                    type="checkbox"
                                    checked={isHoliday}
                                    onChange={(e) => setIsHoliday(e.target.checked)}
                                />
                                <span className="holiday-toggle-text">🌴 Mark as Holiday</span>
                            </label>
                        </div>

                        {isHoliday ? (
                            <div className="holiday-banner">
                                <span>🎉 <strong>Holiday Marked</strong> — No classes counted for this day.</span>
                            </div>
                        ) : (
                            <>
                                {/* Subject Status Checklist */}
                                <div className="subjects-checklist">
                                    {subjectsList.length === 0 ? (
                                        <p className="no-subjects-text">No subjects scheduled for this day. Add a subject below!</p>
                                    ) : (
                                        subjectsList.map((sub, idx) => (
                                            <div key={idx} className={`subject-row status-${sub.status}`}>
                                                <span className="subject-row-name">{sub.name}</span>
                                                <div className="status-pill-group">
                                                    <button
                                                        type="button"
                                                        className={`status-pill pill-attended ${sub.status === "attended" ? "active" : ""}`}
                                                        onClick={() => handleSubjectStatusChange(idx, "attended")}
                                                    >
                                                        ✅ Attended
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`status-pill pill-missed ${sub.status === "missed" ? "active" : ""}`}
                                                        onClick={() => handleSubjectStatusChange(idx, "missed")}
                                                    >
                                                        ❌ Missed
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`status-pill pill-cancelled ${sub.status === "cancelled" ? "active" : ""}`}
                                                        onClick={() => handleSubjectStatusChange(idx, "cancelled")}
                                                    >
                                                        🚫 Cancelled
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="remove-row-btn"
                                                        onClick={() => handleRemoveSubjectRow(idx)}
                                                        title="Delete subject"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Add One-Off Extra Subject */}
                                <form onSubmit={handleAddCustomSubject} className="add-extra-subject-form">
                                    <input
                                        type="text"
                                        placeholder="+ Add extra class or lab for today..."
                                        value={customSubjectInput}
                                        onChange={(e) => setCustomSubjectInput(e.target.value)}
                                    />
                                    <button type="submit">+ Add</button>
                                </form>

                                {/* Live Summary Stats */}
                                <div className="checklist-stats">
                                    <span>Total Classes: <strong>{totalCount}</strong></span>
                                    <span>Attended: <strong>{attendedCount}</strong></span>
                                    <span>Ratio: <strong>{totalCount > 0 ? ((attendedCount / totalCount) * 100).toFixed(0) : 0}%</strong></span>
                                </div>
                            </>
                        )}

                        <button className="save-day-record-btn" onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "💾 Save Day Record"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AttendanceCalendar;