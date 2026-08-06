import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import StudyTracker from "../components/StudyTracker";
import StudyStatsCard from "../components/StudyStatsCard";
import StudyHistoryPanel from "../components/StudyHistoryPanel";
import { getSchedule } from "../api/attendanceApi";
import { getStudySessions, saveStudySession, deleteStudySession } from "../api/studyApi";
import "../styles/Study.css";

function StudyPage({ user, onLogout }) {
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        try {
            // Load schedule to derive subject list
            const schedRes = await getSchedule();
            if (schedRes.data) {
                const daysObj = schedRes.data;
                const setOfSubjects = new Set();

                Object.values(daysObj).forEach((val) => {
                    if (Array.isArray(val)) {
                        val.forEach((sub) => {
                            if (typeof sub === "string" && sub.trim()) {
                                setOfSubjects.add(sub.trim());
                            }
                        });
                    }
                });

                if (setOfSubjects.size > 0) {
                    setAvailableSubjects(Array.from(setOfSubjects));
                }
            }
        } catch (err) {
            console.error("Failed to load schedule subjects for study tracker", err);
        }

        try {
            // Load past study sessions
            const sessionData = await getStudySessions();
            setSessions(sessionData || []);
        } catch (err) {
            console.error("Failed to load study sessions", err);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSessionComplete(sessionData) {
        try {
            await saveStudySession(sessionData);
            // Refresh sessions list
            const updated = await getStudySessions();
            setSessions(updated || []);
        } catch (err) {
            console.error("Failed to auto-save study session", err);
        }
    }

    async function handleDeleteSession(id) {
        if (!window.confirm("Are you sure you want to delete this study session record?")) {
            return;
        }
        try {
            await deleteStudySession(id);
            const updated = await getStudySessions();
            setSessions(updated || []);
        } catch (err) {
            console.error("Failed to delete study session", err);
        }
    }

    return (
        <div className="app-layout">
            <header className="app-header">
                <div className="header-brand">
                    <div className="brand-badge brand-study">AT</div>
                    <div>
                        <h1 className="app-title">Study Sessions</h1>
                        <p className="app-subtitle">Welcome back, {user.username}</p>
                    </div>
                </div>
                <button className="logout-btn" onClick={onLogout}>
                    Logout
                </button>
            </header>

            <main className="container study-page-container">
                <Link to="/" className="back-link">
                    ← Back to Dashboard
                </Link>

                <div className="page-header-box">
                    <h2 className="page-title">Study Sessions</h2>
                    <p className="page-subtitle">
                        Flexible subject-tagged focus tracking, stopwatch & custom duration modes, and study analytics.
                    </p>
                </div>

                {/* Hero Active Session Card */}
                <StudyTracker
                    availableSubjects={availableSubjects}
                    onSessionComplete={handleSessionComplete}
                />

                {/* Today's & Weekly Analytics Summary */}
                <StudyStatsCard sessions={sessions} />

                {/* Scrollable Session History Log */}
                <StudyHistoryPanel
                    sessions={sessions}
                    onDeleteSession={handleDeleteSession}
                />
            </main>
        </div>
    );
}

export default StudyPage;
