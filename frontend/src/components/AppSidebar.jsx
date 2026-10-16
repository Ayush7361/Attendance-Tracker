import { NavLink } from "react-router-dom";
import "../styles/AppSidebar.css";

const PRIMARY = [
    { to: "/", label: "Today", end: true },
    { to: "/attendance", label: "Attendance" },
    { to: "/schedule", label: "Routine" },
    { to: "/deadlines", label: "Tasks" },
    { to: "/study", label: "Study" }
];

const SECONDARY = [
    { to: "/gpa", label: "GPA" },
    { to: "/timeline", label: "Calendar" },
    { to: "/archive", label: "Archive" }
];

function AppSidebar({ user, onLogout }) {
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
                {PRIMARY.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                            `sidebar-link${isActive ? " active" : ""}`
                        }
                    >
                        {item.label}
                    </NavLink>
                ))}

                <p className="sidebar-group-label">Records</p>
                {SECONDARY.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `sidebar-link${isActive ? " active" : ""}`
                        }
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <button type="button" className="sidebar-logout" onClick={onLogout}>
                Log out
            </button>
        </aside>
    );
}

export default AppSidebar;
