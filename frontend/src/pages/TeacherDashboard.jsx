import { useState, useEffect } from "react";
import { getTeacherAssignments, getClassRoster, submitTeacherAttendance } from "../api/teacherApi";
import { useToast } from "../context/ToastContext";
import "../App.css";

function formatDateKey(date) {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function TeacherDashboard({ user, onLogout }) {
    const { showToast } = useToast();
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignmentIndex, setSelectedAssignmentIndex] = useState(0);
    const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));
    
    const [roster, setRoster] = useState([]);
    const [className, setClassName] = useState("");
    const [presentStudentIds, setPresentStudentIds] = useState(new Set());
    
    const [loadingAssignments, setLoadingAssignments] = useState(true);
    const [loadingRoster, setLoadingRoster] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadAssignments();
    }, []);

    useEffect(() => {
        if (assignments.length > 0 && assignments[selectedAssignmentIndex]) {
            const currentAssignment = assignments[selectedAssignmentIndex];
            const cid = currentAssignment.classId?._id || currentAssignment.classId;
            if (cid) {
                loadRoster(cid);
            }
        }
    }, [assignments, selectedAssignmentIndex]);

    async function loadAssignments() {
        setLoadingAssignments(true);
        try {
            const data = await getTeacherAssignments();
            setAssignments(data || []);
            if (data && data.length > 0) {
                setSelectedAssignmentIndex(0);
            }
        } catch (err) {
            console.error("Failed to load teacher assignments:", err);
            if (showToast) showToast("Failed to load teacher assignments", "error");
        } finally {
            setLoadingAssignments(false);
        }
    }

    async function loadRoster(classId) {
        setLoadingRoster(true);
        try {
            const data = await getClassRoster(classId);
            setRoster(data.students || []);
            setClassName(data.name || "Class");
            // Default-present: all student IDs in set
            const allIds = new Set((data.students || []).map((s) => s._id));
            setPresentStudentIds(allIds);
        } catch (err) {
            console.error("Failed to load class roster:", err);
            if (showToast) showToast("Failed to load class roster", "error");
        } finally {
            setLoadingRoster(false);
        }
    }

    function toggleStudentPresent(studentId) {
        const nextSet = new Set(presentStudentIds);
        if (nextSet.has(studentId)) {
            nextSet.delete(studentId); // Mark absent
        } else {
            nextSet.add(studentId); // Mark present
        }
        setPresentStudentIds(nextSet);
    }

    function handleMarkAllPresent() {
        const allIds = new Set(roster.map((s) => s._id));
        setPresentStudentIds(allIds);
    }

    function handleMarkAllAbsent() {
        setPresentStudentIds(new Set());
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (assignments.length === 0 || !assignments[selectedAssignmentIndex]) return;

        const currentAssignment = assignments[selectedAssignmentIndex];
        const classId = currentAssignment.classId?._id || currentAssignment.classId;
        const subjectName = currentAssignment.subjectName;

        // Calculate absentees: students NOT in presentStudentIds set
        const absentStudentIds = roster
            .filter((s) => !presentStudentIds.has(s._id))
            .map((s) => s._id);

        setSubmitting(true);
        try {
            await submitTeacherAttendance({
                classId,
                subjectName,
                date: selectedDate,
                absentStudentIds
            });

            const presentCount = roster.length - absentStudentIds.length;
            if (showToast) {
                showToast(`Attendance marked! ${presentCount}/${roster.length} students present for ${subjectName}`, "success");
            }
        } catch (err) {
            console.error("Failed to submit attendance:", err);
            const msg = err.response?.data?.message || "Failed to submit attendance";
            if (showToast) showToast(msg, "error");
        } finally {
            setSubmitting(false);
        }
    }

    const currentAssignment = assignments[selectedAssignmentIndex] || null;
    const subjectName = currentAssignment?.subjectName || "";

    return (
        <div className="app-layout teacher-layout">
            <header className="app-header">
                <div className="header-brand">
                    <div className="brand-badge" style={{ background: "#818cf8" }}>TP</div>
                    <div>
                        <h1 className="app-title">Teacher Portal</h1>
                        <p className="app-subtitle">Welcome, {user.username} (Teacher)</p>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span className="pill-badge" style={{ background: "rgba(129, 140, 248, 0.2)", color: "#818cf8", padding: "4px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "600" }}>
                        Teacher Role
                    </span>
                    <button className="logout-btn" onClick={onLogout}>
                        Logout
                    </button>
                </div>
            </header>

            <main className="container" style={{ maxWidth: "800px", marginTop: "24px" }}>
                <div className="page-header-box card-panel" style={{ marginBottom: "20px" }}>
                    <h2 className="page-title">Digital Attendance Marking</h2>
                    <p className="page-subtitle">Mark period attendance for your assigned class roster. Changes instantly sync to student dashboards.</p>
                </div>

                {loadingAssignments ? (
                    <div className="card-panel" style={{ textAlign: "center", padding: "30px" }}>Loading your assigned classes...</div>
                ) : assignments.length === 0 ? (
                    <div className="card-panel" style={{ textAlign: "center", padding: "40px" }}>
                        <h3>No Class Assignments Found</h3>
                        <p style={{ color: "#94a3b8", marginTop: "8px" }}>
                            You currently do not have any assigned classes or subjects. Please contact system administrator.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="teacher-form">
                        {/* Selector Controls */}
                        <div className="card-panel" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#94a3b8", marginBottom: "6px" }}>
                                    Assigned Class & Subject:
                                </label>
                                <select
                                    value={selectedAssignmentIndex}
                                    onChange={(e) => setSelectedAssignmentIndex(Number(e.target.value))}
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        background: "rgba(15, 23, 42, 0.8)",
                                        border: "1px solid rgba(255, 255, 255, 0.15)",
                                        color: "#ffffff",
                                        fontWeight: "600",
                                        fontSize: "0.95rem"
                                    }}
                                >
                                    {assignments.map((asgn, i) => (
                                        <option key={i} value={i}>
                                            {asgn.subjectName} — {asgn.classId?.name || "Class"}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#94a3b8", marginBottom: "6px" }}>
                                    Attendance Date:
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        background: "rgba(15, 23, 42, 0.8)",
                                        border: "1px solid rgba(255, 255, 255, 0.15)",
                                        color: "#ffffff",
                                        fontWeight: "600",
                                        fontSize: "0.95rem"
                                    }}
                                />
                            </div>
                        </div>

                        {/* Roster Section */}
                        <div className="card-panel">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Roster for {className} ({subjectName})</h3>
                                    <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                                        Default is set to Present. Uncheck any student who was absent.
                                    </span>
                                </div>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button type="button" onClick={handleMarkAllPresent} className="quick-action-btn btn-all-attended" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
                                        All Present
                                    </button>
                                    <button type="button" onClick={handleMarkAllAbsent} className="quick-action-btn btn-all-missed" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
                                        All Absent
                                    </button>
                                </div>
                            </div>

                            {loadingRoster ? (
                                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>Loading student roster...</div>
                            ) : roster.length === 0 ? (
                                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No students enrolled in this class yet.</div>
                            ) : (
                                <div className="roster-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {roster.map((student) => {
                                        const isPresent = presentStudentIds.has(student._id);
                                        return (
                                            <div
                                                key={student._id}
                                                onClick={() => toggleStudentPresent(student._id)}
                                                style={{
                                                    display: "flex",
                                                    justify: "space-between",
                                                    alignItems: "center",
                                                    padding: "12px 16px",
                                                    borderRadius: "10px",
                                                    background: isPresent ? "rgba(52, 211, 153, 0.08)" : "rgba(239, 68, 68, 0.08)",
                                                    border: isPresent ? "1px solid rgba(52, 211, 153, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                                                    cursor: "pointer",
                                                    transition: "all 0.15s ease"
                                                }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isPresent}
                                                        onChange={() => {}} // Handled by div container click
                                                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                                    />
                                                    <span style={{ fontWeight: "600", fontSize: "0.98rem", color: "#ffffff" }}>
                                                        {student.username}
                                                    </span>
                                                </div>
                                                <span
                                                    style={{
                                                        padding: "4px 10px",
                                                        borderRadius: "12px",
                                                        fontSize: "0.78rem",
                                                        fontWeight: "700",
                                                        background: isPresent ? "rgba(52, 211, 153, 0.2)" : "rgba(239, 68, 68, 0.2)",
                                                        color: isPresent ? "#34d399" : "#f87171"
                                                    }}
                                                >
                                                    {isPresent ? "✓ PRESENT" : "✕ ABSENT"}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div style={{ marginTop: "24px", textAlign: "right" }}>
                                <button
                                    type="submit"
                                    className="save-day-record-btn"
                                    disabled={submitting || roster.length === 0}
                                    style={{ width: "100%", maxWidth: "300px", padding: "12px 24px", fontSize: "1rem" }}
                                >
                                    {submitting ? "Submitting..." : "Submit Class Attendance"}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </main>
        </div>
    );
}

export default TeacherDashboard;
