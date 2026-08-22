import React from "react";

function SummaryCards({ total = 0, attended = 0, percentage = 0, targetThreshold = 75 }) {
    const missed = Math.max(0, total - attended);
    const pctNum = Number(percentage) || 0;
    const target = Number(targetThreshold) || 75;
    const targetDec = target / 100;
    const isAboveTarget = pctNum >= target;

    let safeBunks = 0;
    let requiredToAttend = 0;

    if (total > 0) {
        if (isAboveTarget) {
            safeBunks = Math.max(0, Math.floor((attended - targetDec * total) / targetDec));
        } else {
            const num = targetDec * total - attended;
            const den = 1 - targetDec;
            requiredToAttend = den > 0 ? Math.ceil(num / den) : 0;
        }
    }

    return (
        <div className="cards summary-cards-grid">
            <div className="card card-total">
                <div className="card-header-label">Total Classes</div>
                <p className="card-value">{total}</p>
                <span className="card-sub-hint">Classes logged</span>
            </div>

            <div className="card card-attended">
                <div className="card-header-label">Attended</div>
                <p className="card-value value-attended">✓ {attended}</p>
                <span className="card-sub-hint hint-attended">Present</span>
            </div>

            <div className="card card-missed">
                <div className="card-header-label">Missed</div>
                <p className="card-value value-missed">✕ {missed}</p>
                <span className="card-sub-hint hint-missed">Absent</span>
            </div>

            <div className="card card-percentage">
                <div className="card-header-label">Attendance Score</div>
                <p className="card-value">{percentage}%</p>
                {total > 0 && (
                    <div className="bunk-calculator-badge">
                        <span className={`target-status-badge ${isAboveTarget ? "target-good" : "target-warn"}`}>
                            {isAboveTarget
                                ? `Safe Bunks: ${safeBunks} class${safeBunks !== 1 ? "es" : ""}`
                                : `Must Attend Next: ${requiredToAttend} class${requiredToAttend !== 1 ? "es" : ""}`}
                        </span>
                        <span className="card-sub-hint" style={{ marginTop: "4px" }}>
                            Target: {target}%
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SummaryCards;