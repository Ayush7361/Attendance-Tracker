import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getGpaRecord, saveGpaRecord } from "../api/gpaApi";
import MobileNotificationDrawer from "../components/MobileNotificationDrawer";
import { useToast } from "../context/ToastContext";
import "../styles/Gpa.css";

const GRADE_POINTS = {
    "A+": 10,
    "A": 9,
    "B+": 8,
    "B": 7,
    "C+": 6,
    "C": 5,
    "D": 4
};

function GpaPage({ user, onLogout }) {
    const { showToast } = useToast();
    const [targetGpa, setTargetGpa] = useState(8.5);
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        try {
            const res = await getGpaRecord();
            if (res.data) {
                setTargetGpa(res.data.targetGpa || 8.5);
                setSubjects(res.data.subjects || []);
            }
        } catch (err) {
            console.error("Failed to load GPA data", err);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave() {
        try {
            await saveGpaRecord({ targetGpa, subjects });
            if (showToast) showToast("GPA & Marks setup saved!", "success");
        } catch (err) {
            console.error("Failed to save GPA setup", err);
            if (showToast) showToast("Failed to save GPA setup", "error");
        }
    }

    function handleAddSubject() {
        setSubjects((prev) => [
            ...prev,
            {
                name: `Subject ${prev.length + 1}`,
                credits: 3,
                internalMarks: 35,
                totalInternal: 50,
                targetGrade: "A",
                finalExamWeight: 50
            }
        ]);
    }

    function handleDeleteSubject(index) {
        setSubjects((prev) => prev.filter((_, i) => i !== index));
    }

    function handleSubjectChange(index, field, value) {
        setSubjects((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    }

    // Calculation logic
    const totalCredits = subjects.reduce((sum, s) => sum + (Number(s.credits) || 0), 0);

    let totalWeightedPoints = 0;
    subjects.forEach((s) => {
        const pts = GRADE_POINTS[s.targetGrade] || 8;
        totalWeightedPoints += pts * (Number(s.credits) || 0);
    });

    const projectedSgpa = totalCredits > 0 ? (totalWeightedPoints / totalCredits).toFixed(2) : "0.00";

    return (
        <div className="app-layout gpa-page">
            <header className="app-header">
                <div className="header-brand">
                    <div className="brand-badge" style={{ background: "#818cf8" }}>GPA</div>
                    <div>
                        <h1 className="app-title">GPA & Marks Predictor</h1>
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
                    <h2 className="page-title">GPA & Marks Predictor</h2>
                    <p className="page-subtitle">Configure subjects, adjust credit weights, and calculate required final exam scores.</p>
                </div>

                <div className="gpa-summary-card card-panel">
                    <div className="gpa-summary-grid">
                        <div className="gpa-stat-box">
                            <span className="gpa-stat-label">Total Credits</span>
                            <span className="gpa-stat-value">{totalCredits}</span>
                        </div>
                        <div className="gpa-stat-box">
                            <span className="gpa-stat-label">Target SGPA</span>
                            <div className="gpa-target-input-wrap">
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    value={targetGpa}
                                    onChange={(e) => setTargetGpa(Number(e.target.value))}
                                    className="gpa-target-input"
                                />
                                <span className="gpa-max-tag">/ 10.0</span>
                            </div>
                        </div>
                        <div className="gpa-stat-box">
                            <span className="gpa-stat-label">Projected SGPA</span>
                            <span className="gpa-stat-value value-projected">{projectedSgpa}</span>
                        </div>
                    </div>
                </div>

                <div className="gpa-toolbar-row">
                    <button type="button" className="gpa-btn gpa-btn-primary" onClick={handleAddSubject}>
                        + Add Subject
                    </button>
                    <button type="button" className="gpa-btn gpa-btn-save" onClick={handleSave}>
                        💾 Save Setup
                    </button>
                </div>

                <div className="gpa-subjects-list">
                    {subjects.length === 0 ? (
                        <div className="card-panel gpa-empty">No subjects added yet. Click "+ Add Subject" above.</div>
                    ) : (
                        subjects.map((sub, idx) => {
                            const internalPct = sub.totalInternal > 0 ? (sub.internalMarks / sub.totalInternal) * 100 : 0;
                            const targetGradePts = GRADE_POINTS[sub.targetGrade] || 8;
                            // Estimate final exam score needed (assuming final is out of 50)
                            const targetMinTotalPct = targetGradePts * 10 - 5; // e.g. 9*10 - 5 = 85%
                            const neededFinalMarks = Math.max(
                                0,
                                Math.ceil(targetMinTotalPct - sub.internalMarks)
                            );

                            return (
                                <div key={idx} className="gpa-subject-card card-panel">
                                    <div className="gpa-card-top">
                                        <input
                                            type="text"
                                            value={sub.name}
                                            onChange={(e) => handleSubjectChange(idx, "name", e.target.value)}
                                            className="gpa-subject-title-input"
                                            placeholder="Subject Name"
                                        />
                                        <button
                                            type="button"
                                            className="gpa-delete-btn"
                                            onClick={() => handleDeleteSubject(idx)}
                                            title="Delete Subject"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="gpa-card-fields-grid">
                                        <div className="gpa-field-group">
                                            <label>Credits</label>
                                            <select
                                                value={sub.credits}
                                                onChange={(e) => handleSubjectChange(idx, "credits", Number(e.target.value))}
                                                className="gpa-select"
                                            >
                                                <option value={1}>1 Credit (Lab)</option>
                                                <option value={2}>2 Credits</option>
                                                <option value={3}>3 Credits</option>
                                                <option value={4}>4 Credits (Core)</option>
                                                <option value={5}>5 Credits</option>
                                            </select>
                                        </div>

                                        <div className="gpa-field-group">
                                            <label>Internal Score</label>
                                            <div className="gpa-inline-inputs">
                                                <input
                                                    type="number"
                                                    value={sub.internalMarks}
                                                    onChange={(e) => handleSubjectChange(idx, "internalMarks", Number(e.target.value))}
                                                    className="gpa-num-input"
                                                />
                                                <span>/</span>
                                                <input
                                                    type="number"
                                                    value={sub.totalInternal}
                                                    onChange={(e) => handleSubjectChange(idx, "totalInternal", Number(e.target.value))}
                                                    className="gpa-num-input"
                                                />
                                            </div>
                                        </div>

                                        <div className="gpa-field-group">
                                            <label>Target Grade</label>
                                            <select
                                                value={sub.targetGrade}
                                                onChange={(e) => handleSubjectChange(idx, "targetGrade", e.target.value)}
                                                className="gpa-select"
                                            >
                                                <option value="A+">A+ (10.0 Pts)</option>
                                                <option value="A">A (9.0 Pts)</option>
                                                <option value="B+">B+ (8.0 Pts)</option>
                                                <option value="B">B (7.0 Pts)</option>
                                                <option value="C+">C+ (6.0 Pts)</option>
                                                <option value="C">C (5.0 Pts)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="gpa-prediction-footer">
                                        <span className="gpa-predict-badge">
                                            Needed in Final Exam: <strong>{neededFinalMarks} / 50</strong>
                                        </span>
                                        <span className="gpa-predict-sub">
                                            Internal: {sub.internalMarks}/{sub.totalInternal} ({internalPct.toFixed(0)}%)
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
}

export default GpaPage;
