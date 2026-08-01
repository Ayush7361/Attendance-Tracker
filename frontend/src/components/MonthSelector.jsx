const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function MonthSelector({ month, onChange }) {
    return (
        <div className="top-controls">
            <label>Select Month:</label>
            <select value={month} onChange={(e) => onChange(e.target.value)}>
                {months.map((m) => (
                    <option key={m}>{m}</option>
                ))}
            </select>
        </div>
    );
}

export default MonthSelector;