import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    getTeacherAssignments,
    getTodayTeacherSchedule,
    getClassRoster,
    submitTeacherAttendance,
    getClassAnalytics,
    getAuditHistory,
    getClassRoutine,
    saveClassRoutine
} from "../api/teacherApi";
import { useToast } from "../context/ToastContext";
import "../App.css";

const DAYS_LIST = [
    { key: "mon", label: "Monday" },
    { key: "tue", label: "Tuesday" },
    { key: "wed", label: "Wednesday" },
    { key: "thu", label: "Thursday" },
    { key: "fri", label: "Friday" },
    { key: "sat", label: "Saturday" },
    { key: "sun", label: "Sunday" }
];

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
    const navigate = useNavigate();
    const location = useLocation();

    const path = location.pathname;
    let activeTab = "mark";
    if (path.includes("/analytics")) activeTab = "analytics";
    else if (path.includes("/audit")) activeTab = "audit";
    else if (path.includes("/routine")) activeTab = "routine";

    const [assignments, setAssignments] = useState([]);
    const [selectedAssignmentIndex, setSelectedAssignmentIndex] = useState(0);
    const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));
    
    const [todaySchedule, setTodaySchedule] = useState(null);
    const [isAutoSelected, setIsAutoSelected] = useState(false);

    const [roster, setRoster] = useState([]);
    const [className, setClassName] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);
    const [presentStudentIds, setPresentStudentIds] = useState(new Set());

    const [loadingAssignments, setLoadingAssignments] = useState(true);
    const [loadingRoster, setLoadingRoster] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Analytics state
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    // Audit state
    const [auditLogs, setAuditLogs] = useState([]);
    const [loadingAudit, setLoadingAudit] = useState(false);

    // Routine state
    const [routineClassId, setRoutineClassId] = useState("");
    const [classRoutine, setClassRoutine] = useState([]);
    const [loadingRoutine, setLoadingRoutine] = useState(false);
    const [savingRoutine, setSavingRoutine] = useState(false);
    const [newSlot, setNewSlot] = useState({ day: "mon", subjectName: "", periodNumber: 1, timeSlot: "" });

    useEffect(() => {
        loadTeacherData();
    }, []);

    useEffect(() => {
        if (assignments.length > 0 && selectedDate) {
            autoSelectFromRoutine(selectedDate);
        }
    }, [selectedDate, assignments]);

    useEffect(() => {
        if (assignments.length > 0 && assignments[selectedAssignmentIndex]) {
            const current = assignments[selectedAssignmentIndex];
            const cid = current.classId?._id || current.classId;
            if (cid) {
                loadRoster(cid, selectedDate, current.subjectName);
                if (activeTab === "analytics") {
                    loadAnalytics(cid);
                }
            }
        }
    }, [assignments, selectedAssignmentIndex, selectedDate, activeTab]);

    useEffect(() => {
        if (activeTab === "audit") {
            loadAudits();
        }
    }, [activeTab]);

    async function loadTeacherData() {
        setLoadingAssignments(true);
        try {
            const asgns = await getTeacherAssignments();
            setAssignments(asgns || []);
            if (asgns && asgns.length > 0) {
                setSelectedAssignmentIndex(0);
                const firstCid = asgns[0].classId?._id || asgns[0].classId;
                if (firstCid) {
                    setRoutineClassId(firstCid);
                    loadRoutine(firstCid);
                }
            }
        } catch (err) {
            console.error("Failed to load teacher assignments:", err);
        } finally {
            setLoadingAssignments(false);
        }
    }

    async function autoSelectFromRoutine(dateStr) {
        try {
            const sched = await getTodayTeacherSchedule(dateStr);
            setTodaySchedule(sched);

            if (sched && sched.periods && sched.periods.length > 0) {
                const firstPeriod = sched.periods[0];
                const matchIndex = assignments.findIndex(
                    (a) =>
                        (a.classId?._id || a.classId).toString() === firstPeriod.classId.toString() &&
                        a.subjectName.trim().toLowerCase() === firstPeriod.subjectName.trim().toLowerCase()
                );

                if (matchIndex >= 0) {
                    setSelectedAssignmentIndex(matchIndex);
                    setIsAutoSelected(true);
                }
            } else {
                setIsAutoSelected(false);
            }
        } catch (err) {
            console.error("Auto select routine error:", err);
        }
    }

    async function loadRoster(classId, dateStr, subjectName) {
        setLoadingRoster(true);
        try {
            const data = await getClassRoster(classId, dateStr, subjectName);
            setRoster(data.students || []);
            setClassName(data.name || "Class");
            setJoinCode(data.joinCode || "");
            setIsAlreadySubmitted(data.isAlreadySubmitted || false);

            const presentSet = new Set();
            (data.students || []).forEach((s) => {
                if (!s.isAbsent) {
                    presentSet.add(s._id);
                }
            });
            setPresentStudentIds(presentSet);
        } catch (err) {
            console.error("Failed to load class roster:", err);
        } finally {
            setLoadingRoster(false);
        }
    }

    async function loadAnalytics(classId) {
        setLoadingAnalytics(true);
        try {
            const data = await getClassAnalytics(classId);
            setAnalyticsData(data);
        } catch (err) {
            console.error("Failed to load analytics:", err);
        } finally {
            setLoadingAnalytics(false);
        }
    }

    async function loadAudits() {
        setLoadingAudit(true);
        try {
            const data = await getAuditHistory();
            setAuditLogs(data || []);
        } catch (err) {
            console.error("Failed to load audit history:", err);
        } finally {
            setLoadingAudit(false);
        }
    }

    function toggleStudentPresent(studentId) {
        const nextSet = new Set(presentStudentIds);
        if (nextSet.has(studentId)) {
            nextSet.delete(studentId);
        } else {
            nextSet.add(studentId);
        }
        setPresentStudentIds(nextSet);
    }

    function handleMarkAllPresent() {
        setPresentStudentIds(new Set(roster.map((s) => s._id)));
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
            setIsAlreadySubmitted(true);
            if (showToast) {
                showToast(`Attendance & Audit Log saved! ${presentCount}/${roster.length} present for ${subjectName}`, "success");
            }
        } catch (err) {
            console.error("Failed to submit attendance:", err);
            const msg = err.response?.data?.message || "Failed to submit attendance";
            if (showToast) showToast(msg, "error");
        } finally {
            setSubmitting(false);
        }
    }

    async function loadRoutine(cid) {
        if (!cid) return;
        setLoadingRoutine(true);
        try {
            const data = await getClassRoutine(cid);
            setClassRoutine(data || []);
        } catch (err) {
            console.error("Failed to load routine:", err);
        } finally {
            setLoadingRoutine(false);
        }
    }

    function handleRoutineClassChange(cid) {
        setRoutineClassId(cid);
        loadRoutine(cid);
    }

    function handleAddRoutineSlot(e) {
        e.preventDefault();
        if (!newSlot.subjectName.trim()) return;

        const updated = [
            ...classRoutine,
            {
                day: newSlot.day,
                subjectName: newSlot.subjectName.trim(),
                periodNumber: Number(newSlot.periodNumber) || 1,
                timeSlot: newSlot.timeSlot.trim() || "Period Slot"
            }
        ];
        setClassRoutine(updated);
        setNewSlot({ ...newSlot, subjectName: "", timeSlot: "" });
    }

    function handleRemoveRoutineSlot(index) {
        setClassRoutine(classRoutine.filter((_, i) => i !== index));
    }

    async function handleSaveRoutine() {
        if (!routineClassId) return;
        setSavingRoutine(true);
        try {
            await saveClassRoutine(routineClassId, classRoutine);
            if (showToast) showToast("Master Class Routine saved!", "success");
        } catch (err) {
            console.error("Failed to save routine:", err);
            if (showToast) showToast("Failed to save routine", "error");
        } finally {
            setSavingRoutine(false);
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
                        <h1 className="app-title">Enterprise Teacher Suite</h1>
                        <p className="app-subtitle">Welcome, {user.username} (Teacher)</p>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span className="pill-badge" style={{ background: "rgba(129, 140, 248, 0.2)", color: "#818cf8", padding: "4px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "600" }}>
                        Teacher Portal
                    </span>
                    <button className="logout-btn" onClick={onLogout}>
                        Logout
                    </button>
                </div>
            </header>

            <main className="container" style={{ maxWidth: "900px", marginTop: "24px" }}>
                {/* Navigation Tab Suite */}
                <div className="card-panel" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "8px", padding: "8px", marginBottom: "20px" }}>
                    <button
                        type="button"
                        className={`action-btn ${activeTab === "mark" ? "btn-primary" : ""}`}
                        onClick={() => navigate("/teacher")}
                        style={{ padding: "10px", borderRadius: "8px", fontWeight: "700", border: "none", cursor: "pointer", fontSize: "0.9rem" }}
                    >
                        ⚡ Mark Attendance
                    </button>
                    <button
                        type="button"
                        className={`action-btn ${activeTab === "analytics" ? "btn-primary" : ""}`}
                        onClick={() => navigate("/teacher/analytics")}
                        style={{ padding: "10px", borderRadius: "8px", fontWeight: "700", border: "none", cursor: "pointer", fontSize: "0.9rem" }}
                    >
                        📊 Class Risk Analytics
                    </button>
                    <button
                        type="button"
                        className={`action-btn ${activeTab === "audit" ? "btn-primary" : ""}`}
                        onClick={() => navigate("/teacher/audit")}
                        style={{ padding: "10px", borderRadius: "8px", fontWeight: "700", border: "none", cursor: "pointer", fontSize: "0.9rem" }}
                    >
                        📜 Audit History
                    </button>
                    <button
                        type="button"
                        className={`action-btn ${activeTab === "routine" ? "btn-primary" : ""}`}
                        onClick={() => navigate("/teacher/routine")}
                        style={{ padding: "10px", borderRadius: "8px", fontWeight: "700", border: "none", cursor: "pointer", fontSize: "0.9rem" }}
                    >
                        🗓️ Master Routine
                    </button>
                </div>

                {/* TAB 1: MARK ATTENDANCE */}
                {activeTab === "mark" && (
                    <>
                        <div className="page-header-box card-panel" style={{ marginBottom: "20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                                <div>
                                    <h2 className="page-title" style={{ margin: 0 }}>Digital Period Attendance</h2>
                                    <p className="page-subtitle" style={{ margin: "4px 0 0" }}>
                                        Fast 1-click marking. Generates immutable audit logs & student alerts.
                                    </p>
                                </div>
                                {isAutoSelected && (
                                    <span style={{ fontSize: "0.82rem", background: "rgba(16, 185, 129, 0.2)", color: "#34d399", padding: "4px 12px", borderRadius: "20px", fontWeight: "700" }}>
                                        ⚡ Auto-Selected from Routine
                                    </span>
                                )}
                            </div>
                        </div>

                        {loadingAssignments ? (
                            <div className="card-panel" style={{ textAlign: "center", padding: "30px" }}>Loading assigned classes...</div>
                        ) : assignments.length === 0 ? (
                            <div className="card-panel" style={{ textAlign: "center", padding: "40px" }}>
                                <h3>No Class Assignments Found</h3>
                                <p style={{ color: "#94a3b8" }}>No assigned classes found for your account.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="teacher-form">
                                <div className="card-panel" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#94a3b8", marginBottom: "6px" }}>
                                            Assigned Class & Subject:
                                        </label>
                                        <select
                                            value={selectedAssignmentIndex}
                                            onChange={(e) => {
                                                setSelectedAssignmentIndex(Number(e.target.value));
                                                setIsAutoSelected(false);
                                            }}
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

                                <div className="card-panel">
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
                                                    Roster for {className} ({subjectName})
                                                </h3>
                                                {joinCode && (
                                                    <span style={{ fontSize: "0.78rem", background: "rgba(129, 140, 248, 0.2)", color: "#818cf8", padding: "2px 8px", borderRadius: "6px", fontWeight: "700" }}>
                                                        Join Code: {joinCode}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                                                {isAlreadySubmitted ? (
                                                    <span style={{ color: "#818cf8", fontWeight: "600" }}>
                                                        ✏️ Existing record loaded. Modify status below to edit/correct past attendance.
                                                    </span>
                                                ) : (
                                                    <span style={{ color: "#94a3b8" }}>
                                                        Default is Present. Uncheck any absent student.
                                                    </span>
                                                )}
                                            </div>
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
                                        <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No enrolled students found. Share Join Code: {joinCode}</div>
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
                                                                onChange={() => {}}
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
                                            style={{ width: "100%", maxWidth: "340px", padding: "12px 24px", fontSize: "1rem" }}
                                        >
                                            {submitting
                                                ? "Saving..."
                                                : isAlreadySubmitted
                                                ? "Update Past Attendance Log"
                                                : "Submit Period Attendance (1-Click)"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </>
                )}

                {/* TAB 2: CLASS RISK ANALYTICS */}
                {activeTab === "analytics" && (
                    <div className="card-panel">
                        <div style={{ marginBottom: "20px" }}>
                            <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Class Performance & At-Risk Analytics</h2>
                            <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "#94a3b8" }}>
                                Monitor class attendance health and identify students falling below the 75% threshold.
                            </p>
                        </div>

                        {loadingAnalytics ? (
                            <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>Calculating class analytics...</div>
                        ) : !analyticsData ? (
                            <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>No analytics data available.</div>
                        ) : (
                            <>
                                {/* Overview Metrics */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                                    <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                                        <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: "700" }}>CLASS AVERAGE</span>
                                        <div style={{ fontSize: "1.8rem", fontWeight: "800", color: analyticsData.classAveragePct >= 75 ? "#34d399" : "#f87171", marginTop: "4px" }}>
                                            {analyticsData.classAveragePct}%
                                        </div>
                                    </div>

                                    <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                                        <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: "700" }}>TOTAL STUDENTS</span>
                                        <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#ffffff", marginTop: "4px" }}>
                                            {analyticsData.totalStudents}
                                        </div>
                                    </div>

                                    <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "16px", borderRadius: "12px", border: analyticsData.atRiskCount > 0 ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)" }}>
                                        <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: "700" }}>AT-RISK STUDENTS (&lt; 75%)</span>
                                        <div style={{ fontSize: "1.8rem", fontWeight: "800", color: analyticsData.atRiskCount > 0 ? "#f87171" : "#34d399", marginTop: "4px" }}>
                                            {analyticsData.atRiskCount}
                                        </div>
                                    </div>
                                </div>

                                {/* At-Risk Students List */}
                                <h3 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>At-Risk Student Flag List</h3>
                                {analyticsData.atRiskStudents.length === 0 ? (
                                    <div style={{ padding: "16px", background: "rgba(52, 211, 153, 0.1)", borderRadius: "10px", border: "1px solid rgba(52, 211, 153, 0.3)", color: "#34d399", fontWeight: "600" }}>
                                        ✓ Outstanding! All students in {analyticsData.className} are maintaining attendance above 75%.
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        {analyticsData.atRiskStudents.map((st) => (
                                            <div
                                                key={st._id}
                                                style={{
                                                    display: "flex",
                                                    justify: "space-between",
                                                    alignItems: "center",
                                                    padding: "12px 16px",
                                                    borderRadius: "10px",
                                                    background: "rgba(239, 68, 68, 0.08)",
                                                    border: "1px solid rgba(239, 68, 68, 0.3)"
                                                }}
                                            >
                                                <div>
                                                    <span style={{ fontWeight: "700", color: "#ffffff", fontSize: "1rem" }}>{st.username}</span>
                                                    <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "2px" }}>
                                                        Attended {st.attended} / {st.total} classes held
                                                    </div>
                                                </div>
                                                <span style={{ padding: "4px 12px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.2)", color: "#f87171", fontWeight: "800", fontSize: "0.9rem" }}>
                                                    ⚠️ {st.percentage}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* TAB 3: AUDIT HISTORY */}
                {activeTab === "audit" && (
                    <div className="card-panel">
                        <div style={{ marginBottom: "20px" }}>
                            <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Attendance Audit Trail</h2>
                            <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "#94a3b8" }}>
                                Immutable chronological log of all period submissions and past corrections.
                            </p>
                        </div>

                        {loadingAudit ? (
                            <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>Loading audit logs...</div>
                        ) : auditLogs.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>No audit logs recorded yet.</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {auditLogs.map((log) => (
                                    <div
                                        key={log._id}
                                        style={{
                                            padding: "14px 16px",
                                            borderRadius: "10px",
                                            background: "rgba(15, 23, 42, 0.6)",
                                            border: "1px solid rgba(255, 255, 255, 0.1)"
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                            <div>
                                                <span style={{ fontWeight: "700", color: "#ffffff", fontSize: "0.98rem" }}>
                                                    {log.subjectName} ({log.classId?.name || "Class"})
                                                </span>
                                                <span style={{ marginLeft: "8px", fontSize: "0.72rem", padding: "2px 8px", borderRadius: "6px", background: log.actionType === "CORRECTION" ? "rgba(129, 140, 248, 0.2)" : "rgba(16, 185, 129, 0.2)", color: log.actionType === "CORRECTION" ? "#818cf8" : "#34d399", fontWeight: "700" }}>
                                                    {log.actionType}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                                                {new Date(log.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
                                            Date: <strong>{new Date(log.date).toLocaleDateString()}</strong> | Present: <strong style={{ color: "#34d399" }}>{log.presentCount}</strong> | Absent: <strong style={{ color: "#f87171" }}>{log.absentCount}</strong>
                                        </div>
                                        {log.absentStudentIds && log.absentStudentIds.length > 0 && (
                                            <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "4px" }}>
                                                Absentees: {log.absentStudentIds.map(s => s.username).join(", ")}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 4: MASTER ROUTINE */}
                {activeTab === "routine" && (
                    <div className="card-panel">
                        <div style={{ marginBottom: "20px" }}>
                            <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Master Class Routine Feeder</h2>
                            <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "#94a3b8" }}>
                                Feed the 7-day weekly schedule for your class cohort. The system auto-selects scheduled classes on the portal.
                            </p>
                        </div>

                        {assignments.length > 0 && (
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#94a3b8", marginBottom: "6px" }}>
                                    Select Class:
                                </label>
                                <select
                                    value={routineClassId}
                                    onChange={(e) => handleRoutineClassChange(e.target.value)}
                                    style={{
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        background: "rgba(15, 23, 42, 0.8)",
                                        border: "1px solid rgba(255, 255, 255, 0.15)",
                                        color: "#ffffff",
                                        fontWeight: "600",
                                        fontSize: "0.95rem"
                                    }}
                                >
                                    {assignments.map((asgn, idx) => {
                                        const cid = asgn.classId?._id || asgn.classId;
                                        return (
                                            <option key={idx} value={cid}>
                                                {asgn.classId?.name || "Class"} {asgn.classId?.joinCode ? `(Join Code: ${asgn.classId.joinCode})` : ""}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        )}

                        <form onSubmit={handleAddRoutineSlot} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", background: "rgba(15, 23, 42, 0.6)", padding: "16px", borderRadius: "10px", marginBottom: "20px" }}>
                            <div>
                                <label style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "700" }}>Day</label>
                                <select
                                    value={newSlot.day}
                                    onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })}
                                    style={{ width: "100%", padding: "8px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #334155" }}
                                >
                                    {DAYS_LIST.map((d) => (
                                        <option key={d.key} value={d.key}>{d.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "700" }}>Subject Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Data Structures"
                                    value={newSlot.subjectName}
                                    onChange={(e) => setNewSlot({ ...newSlot, subjectName: e.target.value })}
                                    style={{ width: "100%", padding: "8px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #334155" }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "700" }}>Time Slot (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 09:00 - 10:00 AM"
                                    value={newSlot.timeSlot}
                                    onChange={(e) => setNewSlot({ ...newSlot, timeSlot: e.target.value })}
                                    style={{ width: "100%", padding: "8px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #334155" }}
                                />
                            </div>

                            <div style={{ display: "flex", alignItems: "flex-end" }}>
                                <button type="submit" style={{ width: "100%", padding: "9px", borderRadius: "6px", background: "#818cf8", color: "#fff", fontWeight: "700", border: "none", cursor: "pointer" }}>
                                    + Add Slot
                                </button>
                            </div>
                        </form>

                        {loadingRoutine ? (
                            <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>Loading routine...</div>
                        ) : classRoutine.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>No routine slots added yet.</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {classRoutine.map((slot, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            display: "flex",
                                            justify: "space-between",
                                            alignItems: "center",
                                            padding: "10px 14px",
                                            background: "rgba(15, 23, 42, 0.4)",
                                            border: "1px solid rgba(255, 255, 255, 0.1)",
                                            borderRadius: "8px"
                                        }}
                                    >
                                        <div>
                                            <strong style={{ color: "#818cf8", textTransform: "capitalize" }}>{slot.day.toUpperCase()}</strong>: {slot.subjectName} {slot.timeSlot && `(${slot.timeSlot})`}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveRoutineSlot(idx)}
                                            style={{ background: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }}
                                        >
                                            ✕ Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ marginTop: "20px", textAlign: "right" }}>
                            <button
                                type="button"
                                onClick={handleSaveRoutine}
                                disabled={savingRoutine}
                                className="save-day-record-btn"
                                style={{ width: "220px" }}
                            >
                                {savingRoutine ? "Saving..." : "Save Master Routine"}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default TeacherDashboard;
