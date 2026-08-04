import { useState } from "react";
import { createSemesterEvent, deleteSemesterEvent } from "../api/semesterApi";
import { formatDueDate } from "../utils/deadlineUtils";

function SemesterTimeline({ events, onRefresh }) {
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [type, setType] = useState("Other");

    async function handleAdd(e) {
        e.preventDefault();
        if (!title.trim() || !date) return;
        await createSemesterEvent({ title: title.trim(), date, type });
        setTitle("");
        setDate("");
        onRefresh();
    }

    async function handleDelete(id) {
        await deleteSemesterEvent(id);
        onRefresh();
    }

    const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

    let timelineBar = null;
    if (sorted.length >= 2) {
        const min = new Date(sorted[0].date).getTime();
        const max = new Date(sorted[sorted.length - 1].date).getTime();
        const range = max - min || 1;

        timelineBar = (
            <div className="dl-timeline-bar">
                {sorted.map((ev) => {
                    const pos = ((new Date(ev.date).getTime() - min) / range) * 100;
                    return (
                        <div
                            key={ev._id}
                            className="dl-timeline-marker"
                            style={{ left: pos + "%" }}
                            title={ev.title + " — " + formatDueDate(ev.date)}
                        >
                            <span className="dl-timeline-dot" />
                            <span className="dl-timeline-marker-label">{ev.title}</span>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="dl-semester">
            <h3>Academic Timeline</h3>

            {timelineBar}

            <form className="dl-semester-form" onSubmit={handleAdd}>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Event title (e.g. Final Exams)"
                />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="Exam">Exam</option>
                    <option value="Break">Break</option>
                    <option value="Registration">Registration</option>
                    <option value="Other">Other</option>
                </select>
                <button type="submit" className="dl-btn">Add Event</button>
            </form>

            <div className="dl-semester-list">
                {sorted.length === 0 && (
                    <p className="dl-empty" style={{ padding: "12px" }}>No events yet. Add exams, breaks, or other key dates.</p>
                )}
                {sorted.map((ev) => (
                    <div className="dl-semester-item" key={ev._id}>
                        <div>
                            <strong>{ev.title}</strong>
                            <span className="dl-semester-meta"> · {ev.type} · {formatDueDate(ev.date)}</span>
                        </div>
                        <button className="dl-btn dl-btn-danger" onClick={() => handleDelete(ev._id)}>×</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SemesterTimeline;
