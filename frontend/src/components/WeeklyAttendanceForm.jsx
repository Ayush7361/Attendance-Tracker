const days = [
    { key: "mon", label: "Mon" },
    { key: "tue", label: "Tue" },
    { key: "wed", label: "Wed" },
    { key: "thu", label: "Thu" },
    { key: "fri", label: "Fri" },
    { key: "sat", label: "Sat" }
];

function WeeklyAttendanceForm({ weekAttendance, onChange, onSubmit }) {
    return (
        <div>
            <h2>Add Weekly Attendance</h2>
            <div className="grid">
                {days.map((d) => (
                    <label key={d.key}>
                        {d.label}
                        <input
                            type="number"
                            min="0"
                            value={weekAttendance[d.key]}
                            onChange={(e) => onChange(d.key, e.target.value)}
                        />
                    </label>
                ))}
            </div>
            <button onClick={onSubmit}>Add Week</button>
        </div>
    );
}

export default WeeklyAttendanceForm;