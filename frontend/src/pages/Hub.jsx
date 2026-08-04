import { Link } from "react-router-dom";
import "../App.css";

function Hub({ user, onLogout }) {
    return (
        <div className="app-layout">
            <header className="app-header">
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

            <main className="container">
                <div className="hub-grid">
                    <Link to="/attendance" className="hub-card">
                        <h2>Attendance</h2>
                        <p>Track daily attendance, weekly schedule, and monthly percentage.</p>
                    </Link>
                    <Link to="/deadlines" className="hub-card">
                        <h2>Deadlines</h2>
                        <p>Manage tasks, subtasks, filters, and your academic calendar.</p>
                    </Link>
                </div>
            </main>
        </div>
    );
}

export default Hub;