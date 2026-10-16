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

const GRADE_MIN_PCT = {
    "A+": 90,
    "A": 80,
    "B+": 70,
    "B": 60,
    "C+": 50,
    "C": 40,
    "D": 35
};

function getHighestAchievableGrade(sub) {
    const totalInternal = Math.max(1, Number(sub.totalInternal) || 50);
    const internalMarks = Math.max(0, Number(sub.internalMarks) || 0);
    const totalFinal = Math.max(1, Number(sub.finalExamWeight) || 50);

    const maxTotalMarks = internalMarks + totalFinal;
    const maxTotalPct = (maxTotalMarks / (totalInternal + totalFinal)) * 100;

    const grades = ["A+", "A", "B+", "B", "C+", "C", "D"];
    for (const g of grades) {
        if (maxTotalPct >= GRADE_MIN_PCT[g]) {
            return g;
        }
    }
    return "F";
}

function calculateSubjectPrediction(sub) {
    const internalMarks = Math.max(0, Number(sub.internalMarks) || 0);
    const totalInternal = Math.max(1, Number(sub.totalInternal) || 50);
    const totalFinal = Math.max(1, Number(sub.finalExamWeight) || 50);
    const targetGrade = sub.targetGrade || "A";

    const targetMinPct = GRADE_MIN_PCT[targetGrade] || 80;
    const totalSubjectMax = totalInternal + totalFinal;
    const neededTotalMarks = Math.ceil((targetMinPct / 100) * totalSubjectMax);
    const neededFinalMarks = neededTotalMarks - internalMarks;

    const maxAchievable = getHighestAchievableGrade(sub);

    if (neededFinalMarks > totalFinal) {
        return {
            status: "unachievable",
            needed: neededFinalMarks,
            totalFinal,
            maxAchievable,
            message: `Unachievable (Requires ${neededFinalMarks} / ${totalFinal} marks). Max achievable grade with current internal score (${internalMarks}/${totalInternal}) is ${maxAchievable}.`
        };
    } else if (neededFinalMarks <= 0) {
        return {
            status: "achieved",
            needed: 0,
            totalFinal,
            message: `Target Secured! Internal marks (${internalMarks}/${totalInternal}) already meet the ${targetMinPct}% threshold.`
        };
    } else {
        const finalExamNeededPct = Math.round((neededFinalMarks / totalFinal) * 100);
        return {
            status: "needed",
            needed: neededFinalMarks,
            totalFinal,
            finalExamNeededPct,
            message: `Needed in Final Exam: ${neededFinalMarks} / ${totalFinal} (${finalExamNeededPct}%)`
        };
    }
}

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

    // Calculations
    const totalCredits = subjects.reduce((sum, s) => sum + (Number(s.credits) || 0), 0);

    let totalWeightedPoints = 0;
    subjects.forEach((s) => {
        const pts = GRADE_POINTS[s.targetGrade] || 8;
        totalWeightedPoints += pts * (Number(s.credits) || 0);
    });

    const projectedSgpaNum = totalCredits > 0 ? totalWeightedPoints / totalCredits : 0;
    const projectedSgpa = projectedSgpaNum.toFixed(2);
    const isTargetAchieved = projectedSgpaNum >= targetGpa;

    return (
        <div className="app-layout gpa-page">
            <header className="app-header">
                <Link to="/" className="header-brand-link" title="Return to Dashboard">
                    <div className="header-brand">
                        <div className="brand-badge" style={{ background: "#818cf8" }}>GPA</div>
                        <div>
                            <h1 className="app-title">GPA & Marks Predictor</h1>
                            <p className="app-subtitle">Welcome back, {user.username}</p>
                        </div>
                    </div>
                </Link>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <MobileNotificationDrawer />
                    <button className="logout-btn" onClick={onLogout}>Logout</button>
                </div>
            </header>

            <main className="container">
                <Link to="/" className="back-link">← Back to Dashboard</Link>

                <div className="page-header-box">
                    <h2 className="page-title">GPA & Marks Predictor</h2>
                    <p className="page-subtitle">Enter internals and see what you need on the final.</p>
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
                            <span className={`gpa-stat-value ${isTargetAchieved ? "value-projected" : "value-warn"}`}>
                                {projectedSgpa}
                            </span>
                        </div>
                    </div>

                    <div className="gpa-status-banner" style={{
                        marginTop: "16px",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        background: isTargetAchieved ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                        border: `1px solid ${isTargetAchieved ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
                        color: isTargetAchieved ? "#a7f3d0" : "#fef08a",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}>
                        <span>{isTargetAchieved ? "✓" : "⚠️"}</span>
                        <span>
                            {isTargetAchieved
                                ? `Your target grades will achieve an SGPA of ${projectedSgpa} (meets/exceeds target ${targetGpa}).`
                                : `Projected SGPA (${projectedSgpa}) is below your target (${targetGpa}). Raise target grades on core subjects.`}
                        </span>
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
                            const prediction = calculateSubjectPrediction(sub);
                            const internalMarks = Number(sub.internalMarks) || 0;
                            const totalInternal = Number(sub.totalInternal) || 50;
                            const internalPct = totalInternal > 0 ? (internalMarks / totalInternal) * 100 : 0;

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
                                                <option value={6}>6 Credits</option>
                                            </select>
                                        </div>

                                        <div className="gpa-field-group">
                                            <label>Internal Score</label>
                                            <div className="gpa-inline-inputs">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={totalInternal}
                                                    value={sub.internalMarks}
                                                    onChange={(e) => handleSubjectChange(idx, "internalMarks", Number(e.target.value))}
                                                    className="gpa-num-input"
                                                />
                                                <span>/</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={sub.totalInternal}
                                                    onChange={(e) => handleSubjectChange(idx, "totalInternal", Number(e.target.value))}
                                                    className="gpa-num-input"
                                                />
                                            </div>
                                        </div>

                                        <div className="gpa-field-group">
                                            <label>Final Exam Max Marks</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={sub.finalExamWeight || 50}
                                                onChange={(e) => handleSubjectChange(idx, "finalExamWeight", Number(e.target.value))}
                                                className="gpa-num-input"
                                                style={{ width: "100%" }}
                                                placeholder="e.g. 50"
                                            />
                                        </div>

                                        <div className="gpa-field-group">
                                            <label>Target Grade</label>
                                            <select
                                                value={sub.targetGrade}
                                                onChange={(e) => handleSubjectChange(idx, "targetGrade", e.target.value)}
                                                className="gpa-select"
                                            >
                                                <option value="A+">A+ (90% / 10.0 Pts)</option>
                                                <option value="A">A (80% / 9.0 Pts)</option>
                                                <option value="B+">B+ (70% / 8.0 Pts)</option>
                                                <option value="B">B (60% / 7.0 Pts)</option>
                                                <option value="C+">C+ (50% / 6.0 Pts)</option>
                                                <option value="C">C (40% / 5.0 Pts)</option>
                                                <option value="D">D (35% / 4.0 Pts)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="gpa-prediction-footer">
                                        <div className={`gpa-predict-badge badge-${prediction.status}`}>
                                            {prediction.message}
                                        </div>
                                        <span className="gpa-predict-sub">
                                            Internal: {internalMarks}/{totalInternal} ({internalPct.toFixed(0)}%)
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
