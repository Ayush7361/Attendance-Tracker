import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getDeadline, createDeadline, updateDeadline } from "../api/deadlinesApi";
import "../styles/Deadlines.css";

const TYPES = ["Assignment", "Exam", "Project", "Quiz", "Lab"];
const PRIORITIES = ["Low", "Medium", "High"];

function toDateInputValue(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toISOString().split("T")[0];
}

function DeadlineFormPage({ user, onLogout }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("");
    const [type, setType] = useState("Assignment");
    const [dueDate, setDueDate] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [description, setDescription] = useState("");
    const [estimatedHours, setEstimatedHours] = useState("");
    const [subtasks, setSubtasks] = useState([]);
    const [newSubtask, setNewSubtask] = useState("");

    useEffect(() => {
        if (isEdit) loadDeadline();
    }, [id]);

    async function loadDeadline() {
        try {
            const res = await getDeadline(id);
            const d = res.data;
            setTitle(d.title);
            setSubject(d.subject);
            setType(d.type);
            setDueDate(toDateInputValue(d.dueDate));
            setPriority(d.priority);
            setDescription(d.description || "");
            setEstimatedHours(d.estimatedHours != null ? String(d.estimatedHours) : "");
            setSubtasks(d.subtasks || []);
        } catch (err) {
            console.error("Failed to load deadline", err);
            navigate("/deadlines");
        }
    }

    function addSubtask() {
        const text = newSubtask.trim();
        if (!text) return;
        setSubtasks([...subtasks, { text, done: false }]);
        setNewSubtask("");
    }

    function removeSubtask(index) {
        setSubtasks(subtasks.filter((_, i) => i !== index));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const payload = {
            title: title.trim(),
            subject: subject.trim(),
            type,
            dueDate,
            priority,
            description: description.trim(),
            estimatedHours: estimatedHours === "" ? null : Number(estimatedHours),
            subtasks
        };

        try {
            if (isEdit) {
                await updateDeadline(id, payload);
                navigate("/deadlines/" + id);
            } else {
                const res = await createDeadline(payload);
                navigate("/deadlines/" + res.data._id);
            }
        } catch (err) {
            alert("Failed to save deadline.");
        }
    }

    return (
        <div className="app-layout deadlines-page">
            <header className="app-header">
                <div className="header-brand">
                    <div className="brand-badge">DL</div>
                    <div>
                        <h1 className="app-title">{isEdit ? "Edit Deadline" : "Add Deadline"}</h1>
                        <p className="app-subtitle">{user.username}</p>
                    </div>
                </div>
                <button className="logout-btn" onClick={onLogout}>Logout</button>
            </header>

            <main className="container">
                <Link to={isEdit ? "/deadlines/" + id : "/deadlines"} className="back-link">
                    ← Back
                </Link>

                <form className="dl-form" onSubmit={handleSubmit}>
                    <label>
                        Title
                        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </label>

                    <div className="dl-form-row">
                        <label>
                            Subject
                            <input value={subject} onChange={(e) => setSubject(e.target.value)} required />
                        </label>
                        <label>
                            Type
                            <select value={type} onChange={(e) => setType(e.target.value)}>
                                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </label>
                    </div>

                    <div className="dl-form-row">
                        <label>
                            Due Date
                            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
                        </label>
                        <label>
                            Priority
                            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </label>
                    </div>

                    <label>
                        Estimated Hours (optional)
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={estimatedHours}
                            onChange={(e) => setEstimatedHours(e.target.value)}
                        />
                    </label>

                    <label>
                        Description
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                    </label>

                    <div className="dl-section">
                        <h3>Subtasks</h3>
                        <div className="dl-subtask-input-row">
                            <input
                                value={newSubtask}
                                onChange={(e) => setNewSubtask(e.target.value)}
                                placeholder="Add a subtask..."
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); } }}
                            />
                            <button type="button" className="dl-btn" onClick={addSubtask}>Add</button>
                        </div>
                        <div className="dl-subtask-list" style={{ marginTop: "8px" }}>
                            {subtasks.map((s, i) => (
                                <div className="dl-subtask-item" key={i}>
                                    <span>{s.text}</span>
                                    <button type="button" className="dl-btn dl-btn-danger" onClick={() => removeSubtask(i)}>×</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="dl-btn dl-btn-primary">
                        {isEdit ? "Save Changes" : "Create Deadline"}
                    </button>
                </form>
            </main>
        </div>
    );
}

export default DeadlineFormPage;
