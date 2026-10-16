import { NavLink, useLocation } from "react-router-dom";
import "../styles/AppSidebar.css";

const PRIMARY = [
    { to: "/", label: "Today", end: true },
    { to: "/attendance", label: "Attendance", match: ["/attendance"] },
    { to: "/schedule", label: "Routine", match: ["/schedule", "/routine"] },
    { to: "/deadlines", label: "Tasks", match: ["/deadlines", "/tasks"] },
    { to: "/study", label: "Study", match: ["/study"] }
];

const SECONDARY = [
    { to: "/gpa", label: "GPA", match: ["/gpa"] },
    { to: "/timeline", label: "Calendar", match: ["/timeline", "/calendar"] },
    { to: "/archive", label: "Archive", match: ["/archive"] }
];

function isItemActive(item, pathname) {
    if (item.end) {
        return pathname === "/";
    }
    if (item.match) {
        return item.match.some((m) => pathname === m || pathname.startsWith(m + "/"));
    }
    return pathname === item.to || pathname.startsWith(item.to + "/");
}

function AppSidebar({ user, onLogout }) {
    const location = useLocation();

    return (
        <aside className="app-sidebar" aria-label="Main navigation">
            <div className="sidebar-brand">
                <span className="sidebar-mark">SD</span>
                <div>
                    <p className="sidebar-title">Study Dashboard</p>
                    <p className="sidebar-user">{user?.username}</p>
                </div>
            </div>

            <nav className="sidebar-nav">
                <p className="sidebar-group-label">Day to day</p>
                {PRIMARY.map((item) => {
                    const active = isItemActive(item, location.pathname);
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={`sidebar-link${active ? " active" : ""}`}
                        >
                            {item.label}
                        </NavLink>
                    );
                })}

                <p className="sidebar-group-label">Records</p>
                {SECONDARY.map((item) => {
                    const active = isItemActive(item, location.pathname);
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={`sidebar-link${active ? " active" : ""}`}
                        >
                            {item.label}
                        </NavLink>
                    );
                })}
            </nav>

            <button type="button" className="sidebar-logout" onClick={onLogout}>
                Log out
            </button>
        </aside>
    );
}

export default AppSidebar;
