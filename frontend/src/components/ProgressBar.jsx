function getColor(percentage) {
    if (percentage >= 85) return "#00c853";
    if (percentage >= 75) return "#ffc107";
    return "#d32f2f";
}

function ProgressBar({ percentage }) {
    return (
        <div className="progress-container">
            <div className="progress-bar" style={{ width: percentage + "%", background: getColor(percentage) }}>
                {percentage}%
            </div>
        </div>
    );
}

export default ProgressBar;