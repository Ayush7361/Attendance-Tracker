import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/MobileNav.css";

function MobileNav() {
    return (
        <nav className="mobile-nav" aria-label="Mobile Bottom Navigation">
            <NavLink
                to="/"
                end
                className={({ isActive }) =>
                    `mobile-nav-item ${isActive ? "active" : ""}`
                }
            >
                <svg className="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
                <span className="mobile-nav-label">Hub</span>
            </NavLink>

            <NavLink
                to="/attendance"
                className={({ isActive }) =>
                    `mobile-nav-item ${isActive ? "active" : ""}`
                }
            >
                <svg className="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <path d="m9 16 2 2 4-4" />
                </svg>
                <span className="mobile-nav-label">Attendance</span>
            </NavLink>

            <NavLink
                to="/deadlines"
                className={({ isActive }) =>
                    `mobile-nav-item ${isActive ? "active" : ""}`
                }
            >
                <svg className="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="mobile-nav-label">Deadlines</span>
            </NavLink>

            <NavLink
                to="/study"
                className={({ isActive }) =>
                    `mobile-nav-item ${isActive ? "active" : ""}`
                }
            >
                <svg className="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
                <span className="mobile-nav-label">Study</span>
            </NavLink>

            <NavLink
                to="/timeline"
                className={({ isActive }) =>
                    `mobile-nav-item ${isActive ? "active" : ""}`
                }
            >
                <svg className="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="20" x2="12" y2="10" />
                    <line x1="18" y1="20" x2="18" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="16" />
                </svg>
                <span className="mobile-nav-label">Timeline</span>
            </NavLink>
        </nav>
    );
}

export default MobileNav;
