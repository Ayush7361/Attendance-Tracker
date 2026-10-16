import { NavLink } from "react-router-dom";
import "../styles/StudentRouteNav.css";

const routes = [
    { to: "/", label: "Today", end: true },
    { to: "/attendance", label: "Attendance" },
    { to: "/schedule", label: "Routine" },
    { to: "/deadlines", label: "Tasks" },
    { to: "/study", label: "Study" },
    { to: "/gpa", label: "GPA" },
    { to: "/timeline", label: "Calendar" },
    { to: "/archive", label: "Archive" }
];

// A visible route switcher for compact layouts. The bottom bar remains useful
// for one-handed use, while this keeps navigation available at the top of every
// page and gives people an obvious way back to Today.
function StudentRouteNav() {
    return (
        <nav className="student-route-nav" aria-label="Student pages">
            {routes.map((route) => (
                <NavLink
                    key={route.to}
                    to={route.to}
                    end={route.end}
                    className={({ isActive }) => `student-route-link${isActive ? " active" : ""}`}
                >
                    {route.label}
                </NavLink>
            ))}
        </nav>
    );
}

export default StudentRouteNav;
