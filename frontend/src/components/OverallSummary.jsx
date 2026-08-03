function getColor(percentage) {
    if (percentage >= 85) return "#00c853";
    if (percentage >= 75) return "#ffc107";
    return "#d32f2f";
}

function OverallSummary({ total, attended }) {
    if (total === 0) {
        return <p>No attendance data available yet.</p>;
    }

    const overallPercent = ((attended / total) * 100).toFixed(1);

    return (
        <div className="overall-summary" style={{ display: "block" }}>
            <div className="cards overall-cards">
                <div className="card">
                    <h3>Total Classes (All)</h3>
                    <p>{total}</p>
                </div>
                <div className="card">
                    <h3>Total Attended</h3>
                    <p>{attended}</p>
                </div>
                <div className="card">
                    <h3>Overall %</h3>
                    <p>{overallPercent}%</p>
                </div>
            </div>

            <div className="progress-container overall-progress-container">
                <div className="progress-bar" style={{ width: overallPercent + "%", background: getColor(overallPercent) }}>
                    {overallPercent}%
                </div>
            </div>
        </div>
    );
}

export default OverallSummary;