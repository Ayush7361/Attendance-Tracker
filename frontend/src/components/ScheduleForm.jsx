const days = [
    { key: "mon", label: "Mon" },
    { key: "tue", label: "Tue" },
    { key: "wed", label: "Wed" },
    { key: "thu", label: "Thu" },
    { key: "fri", label: "Fri" },
    { key: "sat", label: "Sat" }
];

function ScheduleForm({ schedule, onChange, onSave }) {
    return (
        <div>
            <h2>Set Weekly Schedule</h2>
            <div className="grid">
                {days.map((d) => (
                    <label key={d.key}>
                        {d.label}
                        <input
                            type="number"
                            min="0"
                            value={schedule[d.key]}
                            onChange={(e) => onChange(d.key, e.target.value)}
                        />
                    </label>
                ))}
            </div>
            <button onClick={onSave}>Save Schedule</button>
        </div>
    );
}

export default ScheduleForm;