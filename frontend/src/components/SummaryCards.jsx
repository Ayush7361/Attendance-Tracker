
function SummaryCards({ total = 0, attended = 0, percentage = 0 }) {
    const missed = Math.max(0, total - attended);
    const pctNum = Number(percentage) || 0;
    const isAboveTarget = pctNum >= 75;

    return (
        <div className="cards summary-cards-grid">
            <div className="card card-total">
                <div className="card-header-label">Total Classes</div>
                <p className="card-value">{total}</p>
                <span className="card-sub-hint">Classes scheduled & logged</span>
            </div>

            <div className="card card-attended">
                <div className="card-header-label">Attended</div>
                <p className="card-value value-attended">✓ {attended}</p>
                <span className="card-sub-hint hint-attended">Classes present</span>
            </div>

            <div className="card card-missed">
                <div className="card-header-label">Missed</div>
                <p className="card-value value-missed">✕ {missed}</p>
                <span className="card-sub-hint hint-missed">Classes absent</span>
            </div>

            <div className="card card-percentage">
                <div className="card-header-label">Attendance %</div>
                <p className="card-value">{percentage}%</p>
                {total > 0 && (
                    <span className={`target-status-badge ${isAboveTarget ? "target-good" : "target-warn"}`}>
                        {isAboveTarget ? "Target Met (≥75%)" : "Below 75% Target"}
                    </span>
                )}
            </div>
        </div>
    );
}

export default SummaryCards;