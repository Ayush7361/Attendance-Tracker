function getColor(percentage) {
    if (percentage >= 85) return "#00c853";
    if (percentage >= 75) return "#ffc107";
    return "#d32f2f";
}

function OverallSummary({ monthData }) {
    const months = Object.keys(monthData);

    if (months.length === 0) {
        return <p>No attendance data available yet.</p>;
    }

    let grandTotal = 0;
    let grandAttended = 0;

    for (let i = 0; i < months.length; i++) {
        grandTotal += monthData[months[i]].total;
        grandAttended += monthData[months[i]].attended;
    }

    const overallPercent = grandTotal === 0 ? 0 : ((grandAttended / grandTotal) * 100).toFixed(1);

    return (
        <div className="overall-summary" style={{ display: "block" }}>
            <div className="cards overall-cards">
                <div className="card">
                    <h3>Total Classes (All)</h3>
                    <p>{grandTotal}</p>
                </div>
                <div className="card">
                    <h3>Total Attended</h3>
                    <p>{grandAttended}</p>
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

            <div className="month-breakdown">
                <h3>Month Breakdown:</h3>
                <ul>
                    {months.map((m) => {
                        const data = monthData[m];
                        const p = data.total === 0 ? 0 : ((data.attended / data.total) * 100).toFixed(1);
                        return (
                            <li key={m}>
                                {m}: {data.attended}/{data.total} ({p}%)
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

export default OverallSummary;