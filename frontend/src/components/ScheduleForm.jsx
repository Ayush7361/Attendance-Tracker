import { useState } from "react";

const days = [
    { key: "mon", label: "Monday" },
    { key: "tue", label: "Tuesday" },
    { key: "wed", label: "Wednesday" },
    { key: "thu", label: "Thursday" },
    { key: "fri", label: "Friday" },
    { key: "sat", label: "Saturday" },
    { key: "sun", label: "Sunday" }
];

function ScheduleForm({ schedule, onChange, onSave }) {
    const [activeDay, setActiveDay] = useState("mon");
    const [subjectInput, setSubjectInput] = useState("");

    function getDaySubjects(dayKey) {
        const val = schedule[dayKey];
        if (Array.isArray(val)) {
            return val;
        }
        if (typeof val === "number" && val > 0) {
            const list = [];
            for (let i = 1; i <= val; i++) {
                list.push(`Class ${i}`);
            }
            return list;
        }
        return [];
    }

    function handleAddSubject(e) {
        e.preventDefault();
        const trimmed = subjectInput.trim();
        if (!trimmed) return;

        const currentList = getDaySubjects(activeDay);
        const updated = [...currentList, trimmed];
        onChange(activeDay, updated);
        setSubjectInput("");
    }

    function handleRemoveSubject(indexToRemove) {
        const currentList = getDaySubjects(activeDay);
        const updated = currentList.filter((_, idx) => idx !== indexToRemove);
        onChange(activeDay, updated);
    }

    const activeSubjects = getDaySubjects(activeDay);

    return (
        <div className="schedule-card card-panel">
            <div className="schedule-header">
                <h2>Weekly Subject Timetable</h2>
            </div>

            {/* Day Selector Tabs */}
            <div className="day-tabs">
                {days.map((d) => {
                    const subjects = getDaySubjects(d.key);
                    const count = subjects.length;
                    return (
                        <button
                            key={d.key}
                            type="button"
                            className={`day-tab ${activeDay === d.key ? "active" : ""}`}
                            onClick={() => setActiveDay(d.key)}
                        >
                            <span className="day-tab-label">{d.label.slice(0, 3)}</span>
                            {count > 0 && <span className="day-tab-count">{count}</span>}
                        </button>
                    );
                })}
            </div>

            {/* Selected Day Subject Management */}
            <div className="active-day-editor">
                <h3>Subjects for {days.find((d) => d.key === activeDay)?.label}</h3>

                <form onSubmit={handleAddSubject} className="add-subject-form">
                    <input
                        type="text"
                        placeholder="e.g. Mathematics, Data Structures, Physics..."
                        value={subjectInput}
                        onChange={(e) => setSubjectInput(e.target.value)}
                        className="subject-input"
                    />
                    <button type="submit" className="add-btn">
                        + Add Subject
                    </button>
                </form>

                <div className="subject-list">
                    {activeSubjects.length === 0 && (
                        <p className="empty-list-hint">No subjects yet for this day</p>
                    )}
                    {activeSubjects.map((sub, index) => (
                        <div key={index} className="subject-list-item">
                            <span className="subject-list-name">{sub}</span>
                            <button
                                type="button"
                                className="remove-tag-btn"
                                onClick={() => handleRemoveSubject(index)}
                                title="Remove subject"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="schedule-footer">
                <button onClick={onSave} className="save-schedule-btn">
                    Save Timetable
                </button>
            </div>
        </div>
    );
}

export default ScheduleForm;