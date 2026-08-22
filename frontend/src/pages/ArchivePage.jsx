import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getArchiveRecords, saveArchiveSemester, deleteArchiveSemester } from "../api/archiveApi";
import MobileNotificationDrawer from "../components/MobileNotificationDrawer";
import { useToast } from "../context/ToastContext";
import "../styles/Archive.css";

function ArchivePage({ user, onLogout }) {
    const { showToast } = useToast();
    const [semesters, setSemesters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [semesterName, setSemesterName] = useState("Semester 1");
    const [academicYear, setAcademicYear] = useState("2025-2026");
    const [gpa, setGpa] = useState(8.5);
    const [attendancePct, setAttendancePct] = useState(82);
    const [totalStudyHours, setTotalStudyHours] = useState(120);
    const [notes, setNotes] = useState("");

    useEffect(() => {
        loadArchives();
    }, []);

    async function loadArchives() {
        setIsLoading(true);
        try {
            const res = await getArchiveRecords();
            setSemesters(res.data || []);
        } catch (err) {
            console.error("Failed to load archives", err);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleAddArchive(e) {
        e.preventDefault();
        try {
            const updated = await saveArchiveSemester({
                semesterName,
                academicYear,
                gpa: Number(gpa),
                attendancePct: Number(attendancePct),
                totalStudyHours: Number(totalStudyHours),
                notes
            });
            setSemesters(updated.data || []);
            setNotes("");
            if (showToast) showToast(`Archived ${semesterName}!`, "success");
        } catch (err) {
            console.error("Failed to archive semester", err);
        }
    }

    async function handleDelete(id) {
        try {
            const updated = await deleteArchiveSemester(id);
            setSemesters(updated.data || []);
            if (showToast) showToast("Archive record deleted", "info");
        } catch (err) {
            console.error("Failed to delete archive record", err);
        }
    }

    const avgGpa = semesters.length > 0
        ? (semesters.reduce((sum, s) => sum + s.gpa, 0) / semesters.length).toFixed(2)
        : "—";

    const avgAttendance = semesters.length > 0
        ? (semesters.reduce((sum, s) => sum + s.attendancePct, 0) / semesters.length).toFixed(1)
        : "—";

    return (
        <div className="app-layout archive-page">
            <header className="app-header">
                <div className="header-brand">
                    <div className="brand-badge" style={{ background: "#f59e0b" }}>AR</div>
                    <div>
                        <h1 className="app-title">Semester Archive & Growth</h1>
                        <p className="app-subtitle">Welcome back, {user.username}</p>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <MobileNotificationDrawer />
                    <button className="logout-btn" onClick={onLogout}>Logout</button>
                </div>
            </header>

            <main className="container">
                <Link to="/" className="back-link">← Back to Dashboard</Link>

                <div className="page-header-box">
                    <h2 className="page-title">Academic History & Growth</h2>
                    <p className="page-subtitle">Track past terms, compare GPA trends, and archive completed semesters.</p>
                </div>

                <div className="archive-stats-card card-panel">
                    <div className="archive-stats-grid">
                        <div className="archive-stat-box">
                            <span className="archive-stat-label">Archived Terms</span>
                            <span className="archive-stat-value">{semesters.length}</span>
                        </div>
                        <div className="archive-stat-box">
                            <span className="archive-stat-label">Overall CGPA</span>
                            <span className="archive-stat-value value-cgpa">{avgGpa}</span>
                        </div>
                        <div className="archive-stat-box">
                            <span className="archive-stat-label">Avg Attendance</span>
                            <span className="archive-stat-value">{avgAttendance}%</span>
                        </div>
                    </div>
                </div>

                <div className="archive-form-card card-panel">
                    <h3 className="panel-heading">+ Archive Completed Semester</h3>
                    <form onSubmit={handleAddArchive} className="archive-form-grid">
                        <div className="archive-field">
                            <label>Semester Name</label>
                            <input
                                type="text"
                                value={semesterName}
                                onChange={(e) => setSemesterName(e.target.value)}
                                placeholder="e.g. Semester 1"
                                className="archive-input"
                                required
                            />
                        </div>
                        <div className="archive-field">
                            <label>Academic Year</label>
                            <input
                                type="text"
                                value={academicYear}
                                onChange={(e) => setAcademicYear(e.target.value)}
                                placeholder="e.g. 2025-2026"
                                className="archive-input"
                                required
                            />
                        </div>
                        <div className="archive-field">
                            <label>Final SGPA / GPA</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="10"
                                value={gpa}
                                onChange={(e) => setGpa(e.target.value)}
                                className="archive-input"
                                required
                            />
                        </div>
                        <div className="archive-field">
                            <label>Attendance %</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={attendancePct}
                                onChange={(e) => setAttendancePct(e.target.value)}
                                className="archive-input"
                                required
                            />
                        </div>
                        <div className="archive-field">
                            <label>Total Study Hours</label>
                            <input
                                type="number"
                                min="0"
                                value={totalStudyHours}
                                onChange={(e) => setTotalStudyHours(e.target.value)}
                                className="archive-input"
                                required
                            />
                        </div>
                        <div className="archive-field" style={{ gridColumn: "1 / -1" }}>
                            <label>Notes / Achievements</label>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g. Dean's List, Completed Data Structures Project"
                                className="archive-input"
                            />
                        </div>
                        <button type="submit" className="archive-submit-btn" style={{ gridColumn: "1 / -1" }}>
                            💾 Save Semester to Archive
                        </button>
                    </form>
                </div>

                <div className="archive-history-list">
                    <h3 className="panel-heading">Archived Terms History</h3>
                    {semesters.length === 0 ? (
                        <div className="card-panel archive-empty">No past semesters archived yet. Use the form above to record completed terms.</div>
                    ) : (
                        semesters.map((s) => (
                            <div key={s._id} className="archive-item-card card-panel">
                                <div className="archive-item-top">
                                    <div>
                                        <h4 className="archive-item-title">{s.semesterName}</h4>
                                        <span className="archive-item-year">{s.academicYear}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="archive-delete-btn"
                                        onClick={() => handleDelete(s._id)}
                                        title="Delete archive item"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="archive-item-metrics">
                                    <span className="archive-metric-badge badge-gpa">GPA: {s.gpa}</span>
                                    <span className="archive-metric-badge badge-att">Attendance: {s.attendancePct}%</span>
                                    <span className="archive-metric-badge badge-study">Study: {s.totalStudyHours} hrs</span>
                                </div>

                                {s.notes && <p className="archive-item-notes">{s.notes}</p>}
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}

export default ArchivePage;
