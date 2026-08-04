import { rescheduleDeadline } from "../api/deadlinesApi";
import { formatDueDate } from "../utils/deadlineUtils";

function InsightsPanel({ data, onReschedule }) {
    if (!data) return <p className="dl-empty">Loading insights...</p>;

    async function handleReschedule(id) {
        await rescheduleDeadline(id, 7);
        onReschedule();
    }

    return (
        <div className="dl-insights">
            <h3>Insights</h3>
            <div className="dl-insight-list">
                {data.insights.map((item, i) => (
                    <div key={i} className={"dl-insight dl-insight-" + item.type}>
                        {item.message}
                    </div>
                ))}
            </div>

            {data.overdueTasks.length > 0 && (
                <div className="dl-recovery">
                    <h3>Overdue Recovery</h3>
                    <p className="dl-recovery-desc">Reschedule overdue tasks by +7 days:</p>
                    {data.overdueTasks.map((t) => (
                        <div className="dl-recovery-row" key={t._id}>
                            <div>
                                <strong>{t.title}</strong>
                                <span className="dl-semester-meta"> · {t.subject} · was due {formatDueDate(t.dueDate)}</span>
                            </div>
                            <button className="dl-btn" onClick={() => handleReschedule(t._id)}>+7 days</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default InsightsPanel;
