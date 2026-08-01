
function SummaryCards({ total, attended, percentage }) {
    return (
        <div className="cards">
            <div className="card">
                <h3>Total Classes</h3>
                <p>{total}</p>
            </div>
            <div className="card">
                <h3>Attended</h3>
                <p>{attended}</p>
            </div>
            <div className="card">
                <h3>Attendance %</h3>
                <p>{percentage}%</p>
            </div>
        </div>
    );
}

export default SummaryCards;