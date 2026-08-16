import { getHealthGrade } from "../utils/healthScore";

function AcademicHealthScore({ score, components, belowAttendanceThreshold, attendanceThreshold }) {
    const grade = getHealthGrade(score.overall);
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (score.overall / 100) * circumference;

    return (
        <div className="health-score-card">
            <div className="health-score-header">
                <h3>Academic Health Score</h3>
                <span className="health-grade-pill" style={{ background: `${grade.color}22`, color: grade.color }}>
                    {grade.label}
                </span>
            </div>

            <div className="health-score-body">
                <div className="health-score-ring-wrap">
                    <svg className="health-score-ring" viewBox="0 0 120 120">
                        <circle className="health-ring-bg" cx="60" cy="60" r="54" />
                        <circle
                            className="health-ring-fill"
                            cx="60"
                            cy="60"
                            r="54"
                            stroke={grade.color}
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                        />
                    </svg>
                    <div className="health-score-value">
                        <span className="health-score-number">{score.overall}</span>
                        <span className="health-score-max">/ 100</span>
                    </div>
                </div>

                <div className="health-breakdown">
                    {components.map((c) => (
                        <div className="health-breakdown-row" key={c.key}>
                            <div className="health-breakdown-top">
                                <span className="health-breakdown-label">{c.label}</span>
                                <span className="health-breakdown-score">{c.score}%</span>
                            </div>
                            <div className="health-breakdown-track">
                                <div
                                    className="health-breakdown-fill"
                                    style={{ width: `${c.score}%` }}
                                />
                            </div>
                            <span className="health-breakdown-detail">{c.detail}</span>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}

export default AcademicHealthScore;
