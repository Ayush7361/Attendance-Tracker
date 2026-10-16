import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/MobileNav.css";

function MobileNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    // Close drawer on location change
    useEffect(() => {
        setShowMoreMenu(false);
    }, [location.pathname]);

    function handleTabClick(path) {
        setShowMoreMenu(false);
        if (location.pathname !== path) {
            navigate(path);
        }
        // "instant" is not a supported ScrollBehavior value in Safari. It can
        // throw before navigate() runs, which made every module tab unresponsive.
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    const currentPath = location.pathname;
    const isHubActive = currentPath === "/";
    const isAttendanceActive = currentPath === "/attendance";
    const isRoutineActive = currentPath === "/schedule";
    const isDeadlinesActive = currentPath.startsWith("/deadlines");
    const isStudyActive = currentPath === "/study";
    const isMoreActive = ["/gpa", "/timeline", "/archive"].includes(currentPath);

    return (
        <>
            {/* Slide-Up Suite Drawer for Mobile */}
            {showMoreMenu && (
                <div
                    className="mobile-more-overlay"
                    onClick={() => setShowMoreMenu(false)}
                >
                    <div
                        className="mobile-more-sheet"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="more-sheet-header">
                            <div>
                                <h3 className="more-sheet-title">More</h3>
                                <p className="more-sheet-sub">GPA, calendar, and archive</p>
                            </div>
                            <button
                                type="button"
                                className="more-close-btn"
                                onClick={() => setShowMoreMenu(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="more-sheet-grid">
                            <button
                                type="button"
                                className="more-sheet-item"
                                onClick={() => handleTabClick("/")}
                            >
                                <div className="more-item-icon" style={{ background: "rgba(16, 185, 129, 0.18)", color: "#10b981" }}>
                                    🏠
                                </div>
                                <div className="more-item-info">
                                    <span className="more-item-title">Today</span>
                                    <span className="more-item-desc">What to do now</span>
                                </div>
                            </button>

                            <button
                                type="button"
                                className="more-sheet-item"
                                onClick={() => handleTabClick("/schedule")}
                            >
                                <div className="more-item-icon" style={{ background: "rgba(52, 211, 153, 0.18)", color: "#34d399" }}>
                                    🕒
                                </div>
                                <div className="more-item-info">
                                    <span className="more-item-title">Routine</span>
                                    <span className="more-item-desc">Weekly timetable</span>
                                </div>
                            </button>

                            <button
                                type="button"
                                className="more-sheet-item"
                                onClick={() => handleTabClick("/gpa")}
                            >
                                <div className="more-item-icon" style={{ background: "rgba(129, 140, 248, 0.18)", color: "#818cf8" }}>
                                    🎓
                                </div>
                                <div className="more-item-info">
                                    <span className="more-item-title">GPA</span>
                                    <span className="more-item-desc">Marks and target scores</span>
                                </div>
                            </button>

                            <button
                                type="button"
                                className="more-sheet-item"
                                onClick={() => handleTabClick("/timeline")}
                            >
                                <div className="more-item-icon" style={{ background: "rgba(245, 158, 11, 0.18)", color: "#f59e0b" }}>
                                    🗓️
                                </div>
                                <div className="more-item-info">
                                    <span className="more-item-title">Calendar</span>
                                    <span className="more-item-desc">Exams and key dates</span>
                                </div>
                            </button>

                            <button
                                type="button"
                                className="more-sheet-item"
                                onClick={() => handleTabClick("/archive")}
                            >
                                <div className="more-item-icon" style={{ background: "rgba(236, 72, 153, 0.18)", color: "#ec4899" }}>
                                    📦
                                </div>
                                <div className="more-item-info">
                                    <span className="more-item-title">Archive</span>
                                    <span className="more-item-desc">Past terms</span>
                                </div>
                            </button>

                            <button
                                type="button"
                                className="more-sheet-item"
                                onClick={() => handleTabClick("/deadlines/new")}
                            >
                                <div className="more-item-icon" style={{ background: "rgba(99, 102, 241, 0.18)", color: "#818cf8" }}>
                                    ➕
                                </div>
                                <div className="more-item-info">
                                    <span className="more-item-title">Add task</span>
                                    <span className="more-item-desc">Deadline, assignment, exam</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Navigation Bar */}
            <nav className="mobile-nav" aria-label="Mobile Bottom Navigation">
                <button
                    type="button"
                    className={`mobile-nav-item ${isHubActive ? "active" : ""}`}
                    onClick={() => handleTabClick("/")}
                >
                    <svg className="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                    </svg>
                    <span className="mobile-nav-label">Today</span>
                </button>

                <button
                    type="button"
                    className={`mobile-nav-item ${isAttendanceActive ? "active" : ""}`}
                    onClick={() => handleTabClick("/attendance")}
                >
                    <svg className="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <path d="m9 16 2 2 4-4" />
                    </svg>
                    <span className="mobile-nav-label">Attendance</span>
                </button>

                <button
                    type="button"
                    className={`mobile-nav-item ${isRoutineActive ? "active" : ""}`}
                    onClick={() => handleTabClick("/schedule")}
                >
                    <svg className="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="mobile-nav-label">Routine</span>
                </button>

                <button
                    type="button"
                    className={`mobile-nav-item ${isDeadlinesActive ? "active" : ""}`}
                    onClick={() => handleTabClick("/deadlines")}
                >
                    <svg className="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    <span className="mobile-nav-label">Tasks</span>
                </button>

                <button
                    type="button"
                    className={`mobile-nav-item ${isStudyActive ? "active" : ""}`}
                    onClick={() => handleTabClick("/study")}
                >
                    <svg className="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                    </svg>
                    <span className="mobile-nav-label">Study</span>
                </button>

                <button
                    type="button"
                    className={`mobile-nav-item ${isMoreActive ? "active" : ""}`}
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                >
                    <svg className="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                    </svg>
                    <span className="mobile-nav-label">More</span>
                </button>
            </nav>
        </>
    );
}

export default MobileNav;
