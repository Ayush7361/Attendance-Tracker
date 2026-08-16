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

    // Splits logged records into three buckets based on attendance ratio,
    // so the calendar can show a different marker per day status.
    function buildDayStatusModifiers() {
        const fullyAttended = [];
        const partiallyMissed = [];
        const noneAttended = [];

        for (let i = 0; i < records.length; i++) {
            const rec = records[i];
            const total = rec.totalClasses || 0;
            const attended = rec.attendedClasses || 0;
            if (total === 0) continue;

            const date = parseServerDate(rec.date);

            if (attended === total) {
                fullyAttended.push(date);
            } else if (attended === 0) {
                noneAttended.push(date);
            } else {
                partiallyMissed.push(date);
            }
        }

        return { fullyAttended, partiallyMissed, noneAttended };
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
                    status: s.status || "attended"
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
                status: "attended"
            })));
        } else if (typeof scheduledSubjects === "number" && scheduledSubjects > 0) {
            const list = [];
            for (let i = 1; i <= scheduledSubjects; i++) {
                list.push({ name: `Class ${i}`, status: "attended" });
            }
            setSubjectsList(list);
        } else if (fallbackTotal && fallbackTotal > 0) {
            const list = [];
            for (let i = 1; i <= fallbackTotal; i++) {
                list.push({
                    name: `Class ${i}`,
                    status: i <= (fallbackAttended || 0) ? "attended" : "missed"
                });
            }
            setSubjectsList(list);
        } else {
            setSubjectsList([]);
        }
    }

    function setSubjectStatus(index, newStatus) {
        const updated = [...subjectsList];
        updated[index] = { ...updated[index], status: newStatus };
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

    const totalCount = subjectsList.length;
    const attendedCount = subjectsList.filter(s => s.status === "attended").length;
    const missedCount = subjectsList.filter(s => s.status === "missed").length;
    const cancelledCount = subjectsList.filter(s => s.status === "cancelled").length;
    const heldCount = totalCount - cancelledCount;

    async function handleSave() {
        if (!selectedDate) return;

        setSaving(true);
        try {
            const dateKey = formatDateKey(selectedDate);
            const formattedSubjects = subjectsList.map(s => ({
                name: s.name,
                status: s.status || "attended"
            }));

            await saveDay({
                date: dateKey,
                totalClasses: heldCount,
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

    function handleMarkAllStatus(status) {
        setSubjectsList((prev) => prev.map((s) => ({ ...s, status })));
    }

    const { fullyAttended, partiallyMissed, noneAttended } = buildDayStatusModifiers();
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
                    modifiers={{ fullyAttended, partiallyMissed, noneAttended }}
                    modifiersClassNames={{
                        fullyAttended: "day-logged-good",
                        partiallyMissed: "day-logged-partial",
                        noneAttended: "day-logged-bad"
                    }}
                />

                {selectedDate && (
                    <div className="day-checklist-panel">
                        <div className="checklist-header">
                            <h3 className="checklist-date-heading">
                                <span>{selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                                {isTodaySelected && <span className="today-badge">Today</span>}
                            </h3>
                        </div>

                        {subjectsList.length > 0 && (
                            <div className="checklist-quick-actions">
                                <button type="button" className="quick-action-btn btn-all-attended" onClick={() => handleMarkAllStatus("attended")}>
                                    ✓ All Attended
                                </button>
                                <button type="button" className="quick-action-btn btn-all-missed" onClick={() => handleMarkAllStatus("missed")}>
                                    ✕ All Missed
                                </button>
                                <button type="button" className="quick-action-btn btn-all-cancelled" onClick={() => handleMarkAllStatus("cancelled")}>
                                    🚫 All Cancelled
                                </button>
                            </div>
                        )}

                        <div className="subjects-checklist">
                            {subjectsList.length === 0 && (
                                <p className="empty-checklist">No classes scheduled for this day. Add one below.</p>
                            )}
                            {subjectsList.map((sub, idx) => (
                                <div
                                    key={idx}
                                    className={`subject-row status-${sub.status || "attended"}`}
                                >
                                    <span className="subject-name">{sub.name}</span>
                                    <div className="status-pill-group">
                                        <button
                                            type="button"
                                            className={`pill-btn pill-attended ${sub.status === "attended" ? "active" : ""}`}
                                            onClick={() => setSubjectStatus(idx, "attended")}
                                            title="Attended class"
                                        >
                                            ✓ Attended
                                        </button>
                                        <button
                                            type="button"
                                            className={`pill-btn pill-missed ${sub.status === "missed" ? "active" : ""}`}
                                            onClick={() => setSubjectStatus(idx, "missed")}
                                            title="Missed class"
                                        >
                                            ✕ Missed
                                        </button>
                                        <button
                                            type="button"
                                            className={`pill-btn pill-cancelled ${sub.status === "cancelled" ? "active" : ""}`}
                                            onClick={() => setSubjectStatus(idx, "cancelled")}
                                            title="Class Cancelled (Excluded from attendance percentage)"
                                        >
                                            🚫 Cancelled
                                        </button>
                                        <button
                                            type="button"
                                            className="remove-row-btn"
                                            onClick={() => handleRemoveSubjectRow(idx)}
                                            title="Remove class"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleAddCustomSubject} className="add-extra-subject-form">
                            <input
                                type="text"
                                className="add-subject-input"
                                placeholder="Add custom class..."
                                value={customSubjectInput}
                                onChange={(e) => setCustomSubjectInput(e.target.value)}
                            />
                            <button type="submit" className="add-subject-btn">+ Add</button>
                        </form>

                        <div className="checklist-stats">
                            <div className="stat-pill pill-good">Attended: <strong>{attendedCount}</strong></div>
                            <div className="stat-pill pill-bad">Missed: <strong>{missedCount}</strong></div>
                            {cancelledCount > 0 && (
                                <div className="stat-pill pill-cancelled-stat">Cancelled: <strong>{cancelledCount}</strong></div>
                            )}
                            <div className="stat-pill">Held: <strong>{heldCount}</strong></div>
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