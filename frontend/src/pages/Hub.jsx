import { Link } from "react-router-dom";
import "../styles/Hub.css";

function Hub({ user, onLogout }) {
    return (
        <div className="hub-wrapper">
            <header className="hub-header">
                <div className="header-brand">
                    <div className="brand-badge">AT</div>
                    <div>
                        <h1 className="app-title">Study Dashboard</h1>
                        <p className="app-subtitle">Welcome back, {user.username}</p>
                    </div>
                </div>
                <button className="logout-btn" onClick={onLogout}>
                    Logout
                </button>
            </header>

            <main className="hub-container">
                <div className="hub-hero">
                    <h2 className="hub-greeting">Academic Workspace</h2>
                    <p className="hub-tagline">Track daily attendance, manage upcoming deadlines, and plan your academic timeline.</p>
                </div>

                <div className="hub-grid">
                    <Link to="/attendance" className="hub-card">
                        <div className="hub-card-header">
                            <h2>Attendance Tracker</h2>
                        </div>
                        <p>Daily class logs, subject schedules, and percentage targets.</p>
                        <span className="hub-card-link">Open Attendance →</span>
                    </Link>

                    <Link to="/deadlines" className="hub-card">
                        <div className="hub-card-header">
                            <h2>Deadlines & Tasks</h2>
                        </div>
                        <p>Subtask checklists, urgency filters, and workload analytics.</p>
                        <span className="hub-card-link">Manage Tasks →</span>
                    </Link>

                    <Link to="/timeline" className="hub-card">
                        <div className="hub-card-header">
                            <h2>Academic Timeline</h2>
                        </div>
                        <p>Semester events, exam schedules, and key academic dates.</p>
                        <span className="hub-card-link">View Timeline →</span>
                    </Link>

                    <Link to="/study" className="hub-card">
                        <div className="hub-card-header">
                            <h2>Study Sessions</h2>
                        </div>
                        <p>Subject-tagged focus timer, cycle tracking, and daily study analytics.</p>
                        <span className="hub-card-link">Open Timer →</span>
                    </Link>
                </div>
            </main>
        </div>
    );
}

export default Hub;