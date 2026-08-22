import React from "react";

function getColor(percentage, targetThreshold = 75) {
    if (percentage >= targetThreshold + 10) return "#10b981";
    if (percentage >= targetThreshold) return "#f59e0b";
    return "#ef4444";
}

function OverallSummary({ total = 0, attended = 0, targetThreshold = 75 }) {
    if (total === 0) {
        return <p className="hub-panel-empty">No attendance data logged yet.</p>;
    }

    const percentage = Number(((attended / total) * 100).toFixed(1));
    const target = Number(targetThreshold) || 75;
    const targetDec = target / 100;
    const isAboveTarget = percentage >= target;

    let safeBunks = 0;
    let requiredToAttend = 0;

    if (isAboveTarget) {
        safeBunks = Math.max(0, Math.floor((attended - targetDec * total) / targetDec));
    } else {
        const num = targetDec * total - attended;
        const den = 1 - targetDec;
        requiredToAttend = den > 0 ? Math.ceil(num / den) : 0;
    }

    return (
        <div className="overall-summary" style={{ display: "block" }}>
            <div className="cards overall-cards">
                <div className="card">
                    <div className="card-header-label">Total Classes</div>
                    <p className="card-value">{total}</p>
                </div>
                <div className="card">
                    <div className="card-header-label">Attended</div>
                    <p className="card-value value-attended">{attended}</p>
                </div>
                <div className="card">
                    <div className="card-header-label">Overall %</div>
                    <p className="card-value">{percentage}%</p>
                    <span className={`target-status-badge ${isAboveTarget ? "target-good" : "target-warn"}`}>
                        {isAboveTarget
                            ? `Safe Bunks: ${safeBunks}`
                            : `Need ${requiredToAttend} class${requiredToAttend !== 1 ? "es" : ""}`}
                    </span>
                </div>
            </div>

            <div className="progress-container overall-progress-container" style={{ marginTop: "14px" }}>
                <div
                    className="progress-bar"
                    style={{
                        width: Math.min(100, Math.max(5, percentage)) + "%",
                        background: getColor(percentage, target)
                    }}
                >
                    {percentage}%
                </div>
            </div>
        </div>
    );
}

export default OverallSummary;