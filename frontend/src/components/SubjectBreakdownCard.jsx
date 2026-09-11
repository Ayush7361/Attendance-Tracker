import { useState, useEffect } from "react";
import { getSubjectBreakdown } from "../api/attendanceApi";
import { getCoveredSubjects } from "../api/teacherApi";

function SubjectBreakdownCard({ targetThreshold = 75 }) {
    const [breakdown, setBreakdown] = useState([]);
    const [coveredSubjects, setCoveredSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [bRes, cData] = await Promise.all([
                getSubjectBreakdown(),
                getCoveredSubjects().catch(() => [])
            ]);
            setBreakdown(bRes.data || []);
            if (Array.isArray(cData)) {
                setCoveredSubjects(cData.map((s) => s.trim().toLowerCase()));
            }
        } catch (err) {
            console.error("Failed to load subject breakdown", err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="card-panel" style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>Loading subject analytics...</div>;
    }

    if (breakdown.length === 0) {
        return null; // Hide card if no subject data logged yet
    }

    return (
        <div className="card-panel subject-breakdown-card" style={{ marginTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700" }}>Subject-Wise Attendance Breakdown</h3>
                    <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                        Per-subject percentage, teacher verification status, and safe bunk indicators.
                    </p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                {breakdown.map((item, idx) => {
                    const isTeacherCovered = coveredSubjects.includes((item.subjectName || "").trim().toLowerCase());
                    const pct = item.percentage;
                    const isSafe = pct >= targetThreshold;

                    return (
                        <div
                            key={idx}
                            style={{
                                background: "rgba(15, 23, 42, 0.6)",
                                border: isTeacherCovered ? "1px solid rgba(129, 140, 248, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "12px",
                                padding: "16px"
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                                <div>
                                    <div style={{ fontWeight: "700", fontSize: "1rem", color: "#ffffff" }}>
                                        {item.subjectName}
                                    </div>
                                    {isTeacherCovered ? (
                                        <span style={{ display: "inline-block", marginTop: "4px", fontSize: "0.72rem", background: "rgba(129, 140, 248, 0.2)", color: "#818cf8", padding: "2px 8px", borderRadius: "6px", fontWeight: "600" }}>
                                            🔒 Teacher Verified
                                        </span>
                                    ) : (
                                        <span style={{ display: "inline-block", marginTop: "4px", fontSize: "0.72rem", background: "rgba(148, 163, 184, 0.15)", color: "#94a3b8", padding: "2px 8px", borderRadius: "6px" }}>
                                            ✍ Self-Reported
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: "1.25rem", fontWeight: "800", color: isSafe ? "#34d399" : "#f87171" }}>
                                    {pct}%
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", overflow: "hidden", marginBottom: "12px" }}>
                                <div
                                    style={{
                                        width: `${Math.min(100, Math.max(0, pct))}%`,
                                        height: "100%",
                                        background: isSafe ? "linear-gradient(90deg, #10b981, #34d399)" : "linear-gradient(90deg, #ef4444, #f87171)",
                                        borderRadius: "4px"
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#cbd5e1" }}>
                                <span>Attended: <strong>{item.attended}/{item.total}</strong></span>
                                <span>Missed: <strong style={{ color: item.missed > 0 ? "#f87171" : "#cbd5e1" }}>{item.missed}</strong></span>
                            </div>

                            <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed rgba(255, 255, 255, 0.1)", fontSize: "0.82rem" }}>
                                {isSafe ? (
                                    <span style={{ color: "#34d399", fontWeight: "600" }}>
                                        ✓ Safe to bunk next {item.safeBunks} {item.safeBunks === 1 ? "class" : "classes"}
                                    </span>
                                ) : (
                                    <span style={{ color: "#f87171", fontWeight: "600" }}>
                                        ⚠️ Must attend next {item.recoveryNeeded} {item.recoveryNeeded === 1 ? "class" : "classes"} consecutively
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default SubjectBreakdownCard;
