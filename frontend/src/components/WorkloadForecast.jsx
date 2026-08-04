function WorkloadForecast({ data }) {
    if (!data) return <p className="dl-empty">Loading forecast...</p>;

    const maxHours = Math.max(...data.forecast.map((d) => d.hours), 1);

    return (
        <div className="dl-forecast">
            <h3>Workload Forecast (next 7 days)</h3>
            <p className="dl-forecast-total">Total: {data.totalHours}h estimated</p>
            <div className="dl-forecast-chart">
                {data.forecast.map((day) => (
                    <div className="dl-forecast-col" key={day.date}>
                        <div className="dl-forecast-bar-wrap">
                            <div
                                className="dl-forecast-bar"
                                style={{ height: (day.hours / maxHours) * 100 + "%" }}
                                title={day.hours + "h, " + day.taskCount + " tasks"}
                            />
                        </div>
                        <span className="dl-forecast-hours">{day.hours}h</span>
                        <span className="dl-forecast-label">{day.label}</span>
                    </div>
                ))}
            </div>
            <p className="dl-forecast-note">Based on estimated hours of pending deadlines due each day.</p>
        </div>
    );
}

export default WorkloadForecast;
