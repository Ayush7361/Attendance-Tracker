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

    return (
        <div className="dl-semester">
            <h3>Academic Events</h3>

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
                    <option value="Important Date">Important Date</option>
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
